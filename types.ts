// --- Common & Entities based on Swagger ---

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role: 'teacher' | 'student' | 'admin';
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
    role: 'teacher' | 'student';
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
    summary?: string;
}

// --- Dashboard ---

export interface DashboardData {
    pieChart: PieChartItem[];
    needsReview: ReviewItem[];
    recentActivity: ActivityItem[];
    stats?: DashboardStats;
}

export interface DashboardStats {
    needsReviewCount: number;
    averageScore: number;
    studentsCount: number;
    submissionsCount: number;
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

export interface AISessionDetail {
    id: number;
    title: string;
    date: string;
    docId?: string;
    messages: Array<{
        id: number;
        type: 'user' | 'ai';
        text: string;
        createdAt?: string;
    }>;
}

export interface Material {
    id: string;
    title: string;
    content: string;
    summary?: string;
    courseId?: string;
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

export interface QuizPayload {
    id: string;
    materialId: string;
    title?: string;
    createdAt: string;
    questions: Question[];
}

export interface SharedQuizPayload {
    resourceType: 'quiz' | 'material';
    shortCode: string;
    title: string;
    quizId?: string;
    viewOnly: boolean;
    allowCopy: boolean;
    questions?: Array<{
        id: string;
        type: 'mcq' | 'open' | 'boolean';
        text: string;
        options: string[];
    }>;
    materialId?: string;
    description?: string;
    acceptUploads?: boolean;
    acceptTextResponse?: boolean;
}

export interface SharedQuizResult {
    quizId: string;
    studentName: string;
    score: number;
    correct: number;
    total: number;
    details: Array<{
        questionId: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
    }>;
}

export interface TeacherQuizResult {
    resultId: string;
    quizId: string;
    materialId: string;
    materialTitle: string;
    studentName: string;
    score: number;
    submittedAt: string;
    totalQuestions: number;
}

export interface StudentJournalHistoryItem {
    resultId: string;
    score: number;
    submittedAt: string;
    quizId: string;
    quizTitle: string;
    materialTitle: string;
}

export interface StudentJournalItem {
    studentKey: string;
    studentName: string;
    attempts: number;
    averageScore: number;
    lastScore: number;
    regular: boolean;
    trend: 'up' | 'down' | 'neutral';
    teacherComment: string;
    weakTopics: string[];
    history: StudentJournalHistoryItem[];
}

export interface StudentJournalResponse {
    courseId: string;
    totalStudents: number;
    regularStudents: number;
    averageScore: number;
    students: StudentJournalItem[];
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