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
    Course,
    AISession,
    AISessionDetail,
    CourseCreate,
    CourseUpdate,
    MaterialUpdate,
    QuizPayload,
    SharedQuizPayload,
    SharedQuizResult,
    TeacherQuizResult,
    StudentJournalResponse
} from '../types';

// Use environment variable or fallback to production URL
// Using optional chaining to avoid "Cannot read properties of undefined" if import.meta.env is missing
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://94.131.85.176/api/v1';

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

let authRedirectScheduled = false;

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
            // Handle 401 Unauthorized - clear token and redirect to login
            if (response.status === 401 && !skipAuth) {
                localStorage.removeItem('token');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userRole');

                if (!authRedirectScheduled) {
                    authRedirectScheduled = true;
                    window.dispatchEvent(new Event('authExpired'));
                    setTimeout(() => {
                        window.location.href = '/#/login';
                    }, 100);
                }
                
                throw new ApiError(401, 'Сессия истекла. Пожалуйста, войдите снова.');
            }
            
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
        // Added trailing slash to avoid 307 Redirect
        const response = await request<any>('/courses/');
        return Array.isArray(response) ? response : [];
    },

    async getById(id: string): Promise<Course> {
        return request<Course>(`/courses/${id}`);
    },

    async create(data: CourseCreate): Promise<Course> {
        return request<Course>('/courses/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: CourseUpdate): Promise<Course> {
        return request<Course>(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        await request(`/courses/${id}`, {
            method: 'DELETE',
        });
    }
};

export const DashboardService = {
    async getOverview(courseId: string): Promise<DashboardData> {
        const response = await request<any>(`/dashboard/overview?courseId=${courseId}`);
        // Sanitize response to guarantee arrays and prevent map errors
        return {
            pieChart: Array.isArray(response.pieChart) ? response.pieChart : [],
            needsReview: Array.isArray(response.needsReview) ? response.needsReview : [],
            recentActivity: Array.isArray(response.recentActivity) ? response.recentActivity : [],
            stats: response.stats || undefined
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
    async getMaterials(courseId?: string): Promise<Material[]> {
        const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
        const response = await request<any>(`/materials/${query}`);
        return Array.isArray(response) ? response : [];
    },

    async uploadMaterial(file: File, courseId: string): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId);

        const token = localStorage.getItem('token');
        
        // Use raw fetch to avoid setting Content-Type header manually (browser sets boundary)
        const response = await fetch(`${API_BASE_URL}/materials/`, { // Added trailing slash to avoid 307 Redirect
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

    async chat(message: string, materialId?: string, sessionId?: number): Promise<{ response: string; sessionId?: number }> {
        const response = await request<{ response?: string; text?: string; sessionId?: number; session_id?: number }>('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, materialId, sessionId })
        });
        return {
            response: response.response || response.text || 'No response',
            sessionId: response.sessionId ?? response.session_id,
        };
    },

    async getSessions(): Promise<AISession[]> {
        const response = await request<any>('/ai/sessions');
        return Array.isArray(response) ? response : [];
    },

    async getSessionById(sessionId: number): Promise<AISessionDetail> {
        return request<AISessionDetail>(`/ai/sessions/${sessionId}`);
    },

    async generateQuiz(config: QuizConfig): Promise<QuizPayload> {
        const response = await request<any>('/ai/generate-quiz', {
            method: 'POST',
            body: JSON.stringify(config),
        });

        if (response && response.id && Array.isArray(response.questions)) {
            return response as QuizPayload;
        }

        if (Array.isArray(response)) {
            return {
                id: '',
                materialId: config.materialId || '',
                createdAt: new Date().toISOString(),
                questions: response,
            };
        }

        if (response?.questions && Array.isArray(response.questions)) {
            return {
                id: response.id || '',
                materialId: response.materialId || config.materialId || '',
                createdAt: response.createdAt || new Date().toISOString(),
                questions: response.questions,
            };
        }

        return {
            id: '',
            materialId: config.materialId || '',
            createdAt: new Date().toISOString(),
            questions: [],
        };
    },

    async getQuizById(quizId: string): Promise<QuizPayload> {
        return request<QuizPayload>(`/ai/quizzes/${quizId}`);
    },

    async updateQuiz(quizId: string, questions: Question[], title?: string): Promise<QuizPayload> {
        return request<QuizPayload>(`/ai/quizzes/${quizId}`, {
            method: 'PUT',
            body: JSON.stringify({ questions, title }),
        });
    },

    async createQuizFromDraft(materialId: string, questions: Question[], title?: string): Promise<QuizPayload> {
        return request<QuizPayload>('/ai/quizzes', {
            method: 'POST',
            body: JSON.stringify({ materialId, questions, title }),
        });
    },

    async performSmartAction(req: SmartActionRequest): Promise<string> {
        const response = await request<{ response?: string; result?: string }>('/ai/smart-action', {
            method: 'POST',
            body: JSON.stringify(req),
        });
        return response.response || response.result || 'Action completed';
    },

    async regenerateBlock(blockId: string, context: string): Promise<Question> {
        return request<Question>('/ai/regenerate-block', {
            method: 'POST',
            body: JSON.stringify({ blockId, instruction: context }),
        });
    },

    async generateAssignment(materialId: string, instruction?: string): Promise<{ materialId: string; title: string; assignmentText: string }> {
        return request<{ materialId: string; title: string; assignmentText: string }>('/ai/generate-assignment', {
            method: 'POST',
            body: JSON.stringify({ materialId, instruction: instruction || '' }),
        });
    }
};

export const ShareService = {
    async create(resourceId: string, options?: { password?: string; viewOnly?: boolean; allowCopy?: boolean; resourceType?: 'quiz' | 'material' }): Promise<{ url: string }> {
        return request<{ url: string }>('/share/create', {
            method: 'POST',
            body: JSON.stringify({
                resourceId,
                resourceType: options?.resourceType ?? 'quiz',
                viewOnly: options?.viewOnly ?? true,
                allowCopy: options?.allowCopy ?? false,
                password: options?.password || null,
            }),
        });
    },

    async getByCode(shortCode: string, password?: string): Promise<SharedQuizPayload> {
        const query = password ? `?password=${encodeURIComponent(password)}` : '';
        return request<SharedQuizPayload>(`/share/${shortCode}${query}`, { skipAuth: true });
    },

    async submit(shortCode: string, studentName: string, answers: Record<string, string>): Promise<SharedQuizResult> {
        return request<SharedQuizResult>(`/share/${shortCode}/submit`, {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ studentName, answers }),
        });
    },

    async uploadAssignment(
        shortCode: string,
        studentName: string,
        file?: File | null,
        responseText?: string
    ): Promise<{ submissionId: string; status: string; studentName: string; message: string }> {
        const formData = new FormData();
        formData.append('studentName', studentName);
        if (file) {
            formData.append('file', file);
        }
        if (responseText && responseText.trim()) {
            formData.append('responseText', responseText.trim());
        }

        const response = await fetch(`${API_BASE_URL}/share/${shortCode}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new ApiError(response.status, data?.detail || 'Upload failed');
        }
        return data;
    },

    async getTeacherResults(quizId?: string, courseId?: string): Promise<TeacherQuizResult[]> {
        const params = new URLSearchParams();
        if (quizId) params.set('quizId', quizId);
        if (courseId) params.set('courseId', courseId);
        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await request<any>(`/share/quiz-results${query}`);
        return Array.isArray(response) ? response : [];
    },
};

export const MaterialService = {
    async update(id: string, data: MaterialUpdate): Promise<Material> {
        return request<Material>(`/materials/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string): Promise<void> {
        await request(`/materials/${id}`, {
            method: 'DELETE',
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

    async getStudentJournal(courseId: string): Promise<StudentJournalResponse> {
        try {
            const response = await request<any>(`/analytics/student-journal?courseId=${encodeURIComponent(courseId)}`);
            return {
                courseId: response.courseId || courseId,
                totalStudents: Number(response.totalStudents || 0),
                regularStudents: Number(response.regularStudents || 0),
                averageScore: Number(response.averageScore || 0),
                students: Array.isArray(response.students) ? response.students : []
            };
        } catch (error) {
            if (error instanceof ApiError && error.code === 404) {
                return {
                    courseId,
                    totalStudents: 0,
                    regularStudents: 0,
                    averageScore: 0,
                    students: []
                };
            }
            throw error;
        }
    },

    async saveStudentComment(courseId: string, studentName: string, comment: string): Promise<void> {
        try {
            await request('/analytics/student-journal/comment', {
                method: 'PATCH',
                body: JSON.stringify({ courseId, studentName, comment }),
            });
        } catch (error) {
            if (error instanceof ApiError && error.code === 404) {
                return;
            }
            throw error;
        }
    },
    
    clearCache() {
        for (const key in analyticsCache) delete analyticsCache[key];
    }
};