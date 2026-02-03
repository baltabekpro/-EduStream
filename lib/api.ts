import { 
    DashboardData, 
    AnalyticsData, 
    StudentResult, 
    User, 
    UserRegister,
    QuizConfig, 
    Question, 
    SmartActionRequest,
    Material,
    Course
} from '../types';

const API_BASE_URL = 'https://104.214.169.12/api/v1';

// Custom Error Class
export class ApiError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

interface CustomRequestInit extends RequestInit {
    skipAuth?: boolean;
}

// Helper to handle requests with auth headers
async function request<T>(endpoint: string, options: CustomRequestInit = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;
    const token = localStorage.getItem('token');
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...((token && !skipAuth) ? { 'Authorization': `Bearer ${token}` } : {}),
        ...fetchOptions.headers as any, // Cast to any to merge properly
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            try {
                const errorBody = await response.json();
                if (errorBody.message) errorMessage = errorBody.message;
                // Handle standard validation errors usually returned as detail
                if (errorBody.detail) errorMessage = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
            } catch (e) {
                // Response was not JSON
            }
            throw new ApiError(response.status, errorMessage);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) throw error;
        // Network errors
        throw new ApiError(500, (error as Error).message || 'Network Error');
    }
}

// --- Service Layer ---

export const AuthService = {
    async login(email: string, password?: string): Promise<{ token: string, user: User }> {
        return request<{ token: string, user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true
        });
    },

    async register(data: UserRegister): Promise<{ token: string, user: User } | User> {
        // Returns created user (or token+user if auto-login logic exists on backend)
        return request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
            skipAuth: true
        });
    },

    async getCurrentUser(): Promise<User> {
        return request<User>('/users/me');
    },

    async updateSettings(settings: Partial<User['settings']>): Promise<void> {
        await request('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({ settings }),
        });
    },
    
    async updateUserProfile(data: Partial<User>): Promise<User> {
        return request<User>('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
};

export const CourseService = {
    async getAll(): Promise<Course[]> {
        const response = await request<any>('/courses');
        return Array.isArray(response) ? response : [];
    }
};

export const DashboardService = {
    async getOverview(courseId: string): Promise<DashboardData> {
        const response = await request<any>(`/dashboard/overview?courseId=${courseId}`);
        // Sanitize response to guarantee arrays and prevent map errors
        return {
            pieChart: Array.isArray(response.pieChart) ? response.pieChart : [],
            needsReview: Array.isArray(response.needsReview) ? response.needsReview : [],
            recentActivity: Array.isArray(response.recentActivity) ? response.recentActivity : []
        };
    }
};

export const OCRService = {
    async getQueue(): Promise<StudentResult[]> {
        const response = await request<any>('/ocr/queue');
        // Handle various response shapes (array vs wrapped object)
        if (Array.isArray(response)) return response;
        if (response.items && Array.isArray(response.items)) return response.items;
        if (response.data && Array.isArray(response.data)) return response.data;
        return [];
    },

    async getById(id: string): Promise<StudentResult> {
        return request<StudentResult>(`/ocr/results/${id}`);
    },

    async batchApprove(ids: string[]): Promise<{ processed: number, failed: number }> {
        await request('/ocr/batch-approve', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
        // Assuming success means all processed
        return { processed: ids.length, failed: 0 };
    },

    async updateResult(id: string, data: Partial<StudentResult>): Promise<void> {
        await request(`/ocr/results/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
};

export const AIService = {
    async getMaterials(): Promise<Material[]> {
        const response = await request<any>('/materials');
        return Array.isArray(response) ? response : [];
    },

    async uploadMaterial(file: File, courseId: string): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId);

        const token = localStorage.getItem('token');
        
        // Use raw fetch to avoid setting Content-Type header manually (browser sets boundary)
        const response = await fetch(`${API_BASE_URL}/materials`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Upload failed';
            try {
                const errorBody = await response.json();
                if (errorBody.message) errorMessage = errorBody.message;
            } catch {}
            throw new ApiError(response.status, errorMessage);
        }
    },

    async getDocument(id: string): Promise<Material> {
        return request<Material>(`/materials/${id}`);
    },

    async chat(message: string, materialId?: string): Promise<string> {
        const response = await request<{ text: string }>('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, materialId })
        });
        return response.text;
    },

    async generateQuiz(config: QuizConfig): Promise<Question[]> {
        const response = await request<any>('/ai/generate-quiz', {
            method: 'POST',
            body: JSON.stringify(config),
        });
        
        // Handle response wrapper if API returns { questions: [...] } vs [...]
        if (Array.isArray(response)) return response;
        if (response.questions && Array.isArray(response.questions)) return response.questions;
        return [];
    },

    async performSmartAction(req: SmartActionRequest): Promise<string> {
        const response = await request<{ result: string }>('/ai/smart-action', {
            method: 'POST',
            body: JSON.stringify(req),
        });
        return response.result;
    },

    async regenerateBlock(blockId: string, context: string): Promise<Question> {
        return request<Question>('/ai/regenerate-block', {
            method: 'POST',
            body: JSON.stringify({ blockId, instruction: context }),
        });
    }
};

// Simple In-Memory Cache for Analytics to reduce API calls on navigation
const analyticsCache: Record<string, AnalyticsData> = {};

export const AnalyticsService = {
    async getPerformance(courseId: string): Promise<AnalyticsData> {
        if (analyticsCache[courseId]) {
            return analyticsCache[courseId];
        }

        const response = await request<any>(`/analytics/performance?courseId=${courseId}`);
        // Sanitize data
        const data: AnalyticsData = {
            performance: Array.isArray(response.performance) ? response.performance : [],
            topics: Array.isArray(response.topics) ? response.topics : [],
            students: Array.isArray(response.students) ? response.students : []
        };

        analyticsCache[courseId] = data; 
        return data;
    },
    
    clearCache() {
        for (const key in analyticsCache) delete analyticsCache[key];
    }
};