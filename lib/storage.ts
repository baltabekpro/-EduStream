import { dashboardData, analyticsData, ocrData, aiWorkspaceData, currentUser } from '../data/mockData';

// Типы данных
export type CourseId = '9A' | '10B';

// Имитация случайной сетевой задержки (300ms - 1500ms)
const delay = (min = 300, max = 1500) => {
    const ms = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const storage = {
    getUser: async () => {
        await delay(200, 500);
        return currentUser;
    },

    // Новый метод для обновления пользователя
    updateUser: async (data: Partial<typeof currentUser>) => {
        await delay(1000, 2000);
        // В реальном приложении здесь был бы API call
        // Мы просто возвращаем обновленные данные (симуляция)
        return { ...currentUser, ...data };
    },

    getDashboardData: async (courseId: CourseId) => {
        await delay(500, 1500); // Более долгая загрузка для демонстрации Skeleton
        const multiplier = courseId === '9A' ? 1 : 0.8;
        
        return {
            ...dashboardData,
            pieChart: dashboardData.pieChart.map(p => ({
                ...p,
                value: Math.round(p.value * (p.name === 'Отлично' ? multiplier : 1/multiplier))
            })),
            needsReview: dashboardData.needsReview.filter((_, i) => 
                courseId === '9A' ? i % 2 === 0 : i % 2 !== 0
            )
        };
    },

    getAnalytics: async (courseId: CourseId) => {
        await delay(800, 2000);
        return {
            performance: analyticsData.performance.map(p => ({
                ...p,
                value: courseId === '9A' ? p.value : Math.max(0, p.value - 10)
            })),
            topics: analyticsData.classes[courseId] || analyticsData.classes['9A'],
            students: analyticsData.students
        };
    },

    getOCRData: async () => {
        await delay(500, 1000);
        return ocrData;
    },

    getAIDocument: async () => {
        await delay(600, 1200);
        return aiWorkspaceData.document;
    },

    saveOCRResult: async (id: string, text: string, score: number) => {
        await delay(800, 1500);
        console.log(`Saved OCR ${id}: score ${score}`);
        return true;
    }
};