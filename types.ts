// --- Common & Entities based on Swagger ---

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role: string;
    settings: UserSettings;
}

export interface UserSettings {
    language: 'ru' | 'en';
    notifications: {
        reports: boolean;
        errors: boolean;
        lowPerformance: boolean;
    };
}

export interface UserRegister {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface Course {
    id: string;
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    materialsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CourseCreate {
    title: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface CourseUpdate {
    title?: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface MaterialUpdate {
    title?: string;
    course_id?: string;
}

// --- Dashboard ---

export interface DashboardData {
    pieChart: PieChartItem[];
    needsReview: ReviewItem[];
    recentActivity: ActivityItem[];
}

export interface PieChartItem {
    name: string;
    value: number;
    color: string;
}

export interface ReviewItem {
    id: string;
    name: string;
    subject: string;
    img: string;
    type: 'ocr' | 'quiz';
}

export interface ActivityItem {
    id: number;
    title: string;
    source: string;
    time: string;
    status: string;
    statusColor: string; // Tailwind color name
    type: string;
    action: string;
}

// --- OCR ---

export interface StudentResult {
    id: string;
    student: {
        name: string;
        accuracy: number;
    };
    subject?: string; // Optional in API response sometimes
    image: string;
    questions: OCRRegion[];
    status: 'pending' | 'graded' | 'flagged'; 
}

export interface OCRRegion {
    id: string;
    label: string;
    original: string; // Эталон
    ocrText: string;  // Распознанное
    confidence: 'High' | 'Low';
    match: number;
}

// --- AI & Quiz ---

export interface AISession {
    id: number;
    title: string;
    date: string;
    docId: string;
}

export interface Material {
    id: string;
    title: string;
    content: string;
    uploadDate?: string;
}

export interface QuizConfig {
    materialId?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
    type: 'mcq' | 'open' | 'boolean';
}

export interface Question {
    id: string;
    type: 'mcq' | 'open' | 'boolean';
    text: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
}

export interface SmartActionRequest {
    text: string;
    action: 'explain' | 'simplify' | 'translate' | 'summarize';
    context?: string;
}

// --- Analytics ---

export interface AnalyticsData {
    performance: { name: string; value: number }[];
    topics: AnalyticsTopic[];
    students: StudentMetric[];
}

export interface AnalyticsTopic {
    name: string;
    score: number;
    colorKey: string;
}

export interface StudentMetric {
    id: number;
    name: string;
    status: string;
    progress: number;
    trend: 'up' | 'down' | 'neutral';
    color: string;
    avatar: string;
}