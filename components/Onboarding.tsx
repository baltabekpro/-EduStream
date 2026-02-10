import React, { useState, useEffect } from 'react';

interface OnboardingStep {
    title: string;
    description: string;
    icon: string;
    targetElement?: string; // CSS selector for highlighting
}

interface OnboardingProps {
    isOpen: boolean;
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ isOpen, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightPosition, setHighlightPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

    const steps: OnboardingStep[] = [
        {
            title: "Создайте курс",
            description: "Курс объединяет материалы и студентов. Выберите название, например 'Физика 10А' или 'История 9Б'.",
            icon: "school",
            targetElement: "[data-onboarding='course-selector']"
        },
        {
            title: "Загрузите материал",
            description: "Загрузите PDF, DOCX или TXT файл с лекцией, которую хотите использовать для генерации тестов.",
            icon: "upload_file",
            targetElement: "[data-onboarding='upload-button']"
        },
        {
            title: "Сгенерируйте тест",
            description: "Перейдите в AI Ассистент и создайте тест автоматически. AI проанализирует материал и сформирует вопросы.",
            icon: "auto_awesome",
            targetElement: "[data-onboarding='ai-link']"
        }
    ];

    useEffect(() => {
        if (!isOpen || !steps[currentStep].targetElement) return;

        const element = document.querySelector(steps[currentStep].targetElement!);
        if (element) {
            const rect = element.getBoundingClientRect();
            setHighlightPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }, [currentStep, isOpen]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop with cutout */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-none">
                {highlightPosition && (
                    <div
                        className="absolute border-4 border-primary rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] animate-pulse"
                        style={{
                            top: highlightPosition.top - 8,
                            left: highlightPosition.left - 8,
                            width: highlightPosition.width + 16,
                            height: highlightPosition.height + 16,
                        }}
                    />
                )}
            </div>

            {/* Modal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 pointer-events-auto">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl animate-fade-in">
                    {/* Progress */}
                    <div className="flex gap-2 mb-6">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 rounded-full transition-all ${
                                    idx <= currentStep ? 'bg-primary' : 'bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-primary/10 p-4 rounded-2xl">
                            <span className="material-symbols-outlined text-5xl text-primary">
                                {steps[currentStep].icon}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {steps[currentStep].title}
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSkip}
                            className="flex-1 px-6 py-3 bg-surface border border-border text-slate-300 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-all"
                        >
                            Пропустить
                        </button>
                        <button
                            onClick={handleNext}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                        >
                            {currentStep < steps.length - 1 ? 'Далее' : 'Начать работу'}
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="mt-6 text-center text-xs text-slate-500 font-bold">
                        Шаг {currentStep + 1} из {steps.length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
