import { 
    DashboardData, 
    AnalyticsData, 
    StudentResult, 
    User, 
    QuizConfig, 
    Question, 
    SmartActionRequest 
} from '../types';
import { storage } from './storage'; // Using storage as our "Database"
import { aiWorkspaceData } from '../data/mockData';

// Simulated Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Custom Error Class
class ApiError extends Error {
    constructor(public code: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

// --- Service Layer ---

export const AuthService = {
    async login(email: string, password?: string): Promise<{ token: string, user: User }> {
        await delay(1500);
        // Mock validation
        if (password && password.length < 6) {
            throw new ApiError(400, "Password too short");
        }
        
        const user = await storage.getUser();
        // Simulate JWT
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token";
        
        return { token, user };
    },

    async getCurrentUser(): Promise<User> {
        const token = localStorage.getItem('token'); 
        // In a real app: if (!token) throw new ApiError(401, 'Unauthorized');
        return storage.getUser();
    },

    async updateSettings(settings: Partial<User['settings']>): Promise<void> {
        await delay(500);
        await storage.updateUser({ settings: { ...settings } as any });
    },
    
    async updateUserProfile(data: Partial<User>): Promise<User> {
        await delay(1000);
        return await storage.updateUser(data);
    }
};

export const DashboardService = {
    async getOverview(courseId: string): Promise<DashboardData> {
        try {
            return await storage.getDashboardData(courseId as any);
        } catch (error) {
            throw new ApiError(500, 'Failed to fetch dashboard data');
        }
    }
};

export const OCRService = {
    async getById(id: string): Promise<StudentResult> {
        return await storage.getOCRData();
    },

    async batchApprove(ids: string[]): Promise<{ processed: number, failed: number }> {
        await delay(1500); 
        return { processed: ids.length, failed: 0 };
    },

    async updateResult(id: string, data: Partial<StudentResult>): Promise<void> {
        await delay(500);
    }
};

export const AIService = {
    async generateQuiz(config: QuizConfig): Promise<Question[]> {
        await delay(2000);
        
        if (config.count > 50) {
            throw new ApiError(422, 'Cannot generate more than 50 questions at once.');
        }

        return AIService._mockQuestions(config);
    },

    async performSmartAction(req: SmartActionRequest): Promise<string> {
        await delay(1000);
        if (req.action === 'simplify') return "Упрощенная версия: " + req.text.substring(0, 50) + "... (простыми словами)";
        if (req.action === 'explain') return "Объяснение: Это ключевой термин в биологии, означающий...";
        if (req.action === 'translate') return "Translation: " + req.text;
        return "Processed text";
    },

    async regenerateBlock(blockId: string, context: string): Promise<Question> {
        await delay(1000);
        return {
            id: blockId,
            type: 'mcq',
            text: "Обновленный вопрос (v2): Какова роль АТФ?",
            options: ["Энергия", "Структура", "Защита", "Транспорт"],
            correctAnswer: "Энергия",
            explanation: "АТФ является универсальным источником энергии."
        };
    },

    _mockQuestions(config: QuizConfig): Question[] {
        const questions: Question[] = [];
        for (let i = 0; i < config.count; i++) {
            questions.push({
                id: Math.random().toString(36).substr(2, 9),
                type: config.type,
                text: `Сгенерированный вопрос #${i + 1} (${config.difficulty})`,
                options: ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'],
                correctAnswer: 'Вариант А',
                explanation: 'Автоматическое объяснение от ИИ.'
            });
        }
        return questions;
    }
};

// Simple In-Memory Cache for Analytics
const analyticsCache: Record<string, AnalyticsData> = {};

export const AnalyticsService = {
    async getPerformance(courseId: string): Promise<AnalyticsData> {
        if (analyticsCache[courseId]) {
            return analyticsCache[courseId];
        }

        const data = await storage.getAnalytics(courseId as any);
        analyticsCache[courseId] = data; 
        return data;
    },
    
    clearCache() {
        for (const key in analyticsCache) delete analyticsCache[key];
    }
};
