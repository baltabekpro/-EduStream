import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AIService } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { PageTransition } from '../components/PageTransition';
import ShareModal from '../components/ShareModal';
import { incrementTimeSaved } from '../lib/timeSaved';
import { loadAISession, saveAISession, clearAISession } from '../lib/aiSessionStorage';
import { getSavedQuiz, saveQuizToLibrary } from '../lib/quizLibrary';
import { Question, QuizConfig, SmartActionRequest, Material } from '../types';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
}

type TabType = 'canvas' | 'structure' | 'resources' | 'test-builder';

// --- Components ---

const SmartActionMenu: React.FC<{ 
    x: number; 
    y: number; 
    onAction: (action: SmartActionRequest['action']) => void;
    onClose: () => void;
    t: (key: string) => string;
}> = ({ x, y, onAction, onClose, t }) => (
    <div 
        className="fixed z-50 bg-surface border border-border rounded-xl shadow-2xl p-1 animate-fade-in flex flex-col min-w-[160px]"
        style={{ top: y, left: x }}
    >
        <div className="px-3 py-2 border-b border-border/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('ai.actions')}
        </div>
        <button onClick={() => onAction('explain')} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left text-sm text-white rounded-lg transition-colors">
            <span className="material-symbols-outlined text-sm text-primary">lightbulb</span> {t('ai.action.explain')}
        </button>
        <button onClick={() => onAction('simplify')} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left text-sm text-white rounded-lg transition-colors">
            <span className="material-symbols-outlined text-sm text-green-400">child_care</span> {t('ai.action.simplify')}
        </button>
        <button onClick={() => onAction('translate')} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-left text-sm text-white rounded-lg transition-colors">
            <span className="material-symbols-outlined text-sm text-purple-400">translate</span> {t('ai.action.translate')}
        </button>
    </div>
);

const AIWorkspace: React.FC = () => {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const location = useLocation();
    const navigate = useNavigate();
  
  // State
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('canvas');
  const [selection, setSelection] = useState<{text: string, x: number, y: number} | null>(null);
  
  // Document State
  const [documentData, setDocumentData] = useState<Material | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);

  // Test Builder State
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [testConfig, setTestConfig] = useState<QuizConfig>({
      difficulty: 'medium',
      count: 5,
      type: 'mcq'
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetSessionState = (docTitle?: string) => {
      setActiveTab('canvas');
      setInputValue('');
      setIsGenerating(false);
      setSelection(null);
      setTestQuestions([]);
      setTestConfig({
          difficulty: 'medium',
          count: 5,
          type: 'mcq'
      });
      setMessages([{
          id: 1,
          type: 'ai',
          text: docTitle
              ? `Я проанализировал документ "**${docTitle}**". Готов ответить на вопросы или создать тест.`
              : 'Пожалуйста, загрузите материал на странице Дашборда, чтобы начать работу.'
      }]);
  };

  // Load Initial Data
  useEffect(() => {
     const init = async () => {
         try {
             let docId = location.state?.docId;
             
             // If no docId provided, try to find the latest material
             if (!docId) {
                 try {
                     const materials = await AIService.getMaterials();
                     if (materials.length > 0) {
                         // Use first available material
                         docId = materials[0].id;
                     }
                 } catch (e) {
                     console.warn("Failed to fetch materials list");
                 }
             }

             if (!docId) {
                 setIsLoadingDoc(false);
                 setDocumentData(null);
                 setMessages([{ 
                    id: 1, 
                    type: 'ai', 
                    text: `Пожалуйста, загрузите материал на странице Дашборда, чтобы начать работу.` 
                 }]);
                 return;
             }

             const doc = await AIService.getDocument(docId);
             setDocumentData(doc);

             const stored = loadAISession(doc.id);
             if (stored) {
                 setMessages(stored.messages.map(m => ({ ...m, isTyping: false })));
                 setTestQuestions(Array.isArray(stored.testQuestions) ? stored.testQuestions : []);
                 if (stored.testConfig) setTestConfig(stored.testConfig);
             } else {
                 resetSessionState(doc.title);
             }

             // If navigated from Library with a saved quiz, load it into the builder
             if (location.state?.savedQuizId) {
                 const saved = getSavedQuiz(location.state.savedQuizId);
                 if (saved) {
                     setActiveTab('test-builder');
                     setTestConfig(saved.config);
                     setTestQuestions(saved.questions);
                     addToast('Тест загружен из библиотеки', 'success');
                 } else {
                     addToast('Не удалось найти тест в библиотеке', 'error');
                 }
             }

             // Check for template config after document is loaded
             if (location.state?.templateConfig) {
                 setActiveTab('test-builder');
                 setTestConfig(location.state.templateConfig);
                 // Pass doc.id explicitly to avoid stale state issues
                 handleGenerateTest(location.state.templateConfig, doc.id);
             }

         } catch (e) {
             addToast("Failed to load document", "error");
             setDocumentData({ id: 'err', title: 'Error', content: 'Failed to load content.' });
         } finally {
             setIsLoadingDoc(false);
         }
     };

     init();
  }, [location.state]);

  // Persist session locally per document (avoid excessive writes while streaming)
  useEffect(() => {
      if (!documentData || documentData.id === 'err') return;
      if (isGenerating) return;

      const docId = documentData.id;
      const timeout = window.setTimeout(() => {
          const storedMessages = messages
              .filter(m => !m.isTyping)
              .map(m => ({ id: m.id, type: m.type, text: m.text }));
          saveAISession(docId, {
              messages: storedMessages,
              testQuestions,
              testConfig,
          });
      }, 500);

      return () => window.clearTimeout(timeout);
  }, [documentData?.id, isGenerating, messages, testQuestions, testConfig]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Selection Handler
  useEffect(() => {
      const handleSelection = () => {
          const sel = window.getSelection();
          if (sel && sel.toString().trim().length > 0 && containerRef.current?.contains(sel.anchorNode)) {
              const range = sel.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              setSelection({
                  text: sel.toString().trim(),
                  x: rect.left,
                  y: rect.bottom + 10 // Position below text
              });
          } else {
              setSelection(null);
          }
      };

      document.addEventListener('mouseup', handleSelection);
      return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // --- Actions ---

  const handleSmartAction = async (action: SmartActionRequest['action']) => {
      if (!selection) return;
      const text = selection.text;
      setSelection(null); // Close menu
      window.getSelection()?.removeAllRanges();

      // Optimistic UI: Add user message
      const userMsgId = Date.now();
      setMessages(prev => [...prev, { id: userMsgId, type: 'user', text: `${action.toUpperCase()}: "${text}"` }]);
      setIsGenerating(true);

      try {
          const result = await AIService.performSmartAction({ text, action });
          // Stream the result - ensure it's a string
          streamResponse(result || "Action completed");
      } catch (e) {
          addToast("Failed to perform smart action", "error");
          streamResponse("Failed to perform action. Please try again.");
          setIsGenerating(false);
      }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputValue.trim() || isGenerating) return;

      const text = inputValue;
      setInputValue('');
      setMessages(prev => [...prev, { id: Date.now(), type: 'user', text }]);
      setIsGenerating(true);

      // Simulate a logic check for "Test" request
      if (text.toLowerCase().includes('тест') || text.toLowerCase().includes('quiz')) {
          setActiveTab('test-builder');
          handleGenerateTest();
          streamResponse(t('ai.generating')); // Using translated "Generating..." or "Switching to..."
          return;
      }

      try {
          const response = await AIService.chat(text, documentData?.id);
          streamResponse(response || "Message received");
      } catch (e) {
          console.error("Chat error:", e);
          streamResponse("I'm sorry, I'm having trouble connecting to the server.");
      }
  };

  const streamResponse = (fullText: string) => {
      // Safety check: ensure we have a valid string
      if (!fullText || typeof fullText !== 'string') {
          fullText = "Error: Invalid response from server";
      }
      
      const aiMsgId = Date.now() + 1;
      setMessages(prev => [...prev, { id: aiMsgId, type: 'ai', text: '', isTyping: true }]);

      let i = 0;
      const interval = setInterval(() => {
          if (i >= fullText.length) {
              clearInterval(interval);
              setIsGenerating(false);
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false } : m));
              return;
          }
          
          const chunk = fullText.slice(0, i + 5); // Chunk size 5 chars
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: chunk, isTyping: true } : m));
          i += 5;
      }, 30);
  };

  const handleGenerateTest = async (config = testConfig, overrideMaterialId?: string) => {
      setIsGenerating(true);
      try {
          // Use override if provided (during init), otherwise use state
          // Ensure we don't use 'err' id
          const currentStateId = documentData && documentData.id !== 'err' ? documentData.id : undefined;
          const matId = overrideMaterialId || currentStateId;
          
          if (!matId) {
             throw new Error("No valid material selected");
          }

          const questions = await AIService.generateQuiz({ ...config, materialId: matId });
          setTestQuestions(questions);
          incrementTimeSaved('quizzesGenerated', 1);
          addToast("Test generated successfully", "success");
      } catch (e: any) {
          addToast(e.message || "Error generating quiz", "error");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleRegenerateQuestion = async (id: string) => {
      addToast("Regenerating question...", "info");
      
      try {
          const newQ = await AIService.regenerateBlock(id, "context");
          setTestQuestions(prev => prev.map(q => q.id === id ? newQ : q));
          addToast("Question updated", "success");
      } catch (e) {
          addToast("Failed to update question", "error");
      }
  };

  return (
    <PageTransition>
    <div className="flex h-full bg-background overflow-hidden relative flex-col md:flex-row">
        
        {/* Smart Menu */}
        {selection && (
            <SmartActionMenu 
                x={selection.x} 
                y={selection.y} 
                onAction={handleSmartAction}
                onClose={() => setSelection(null)}
                t={t}
            />
        )}

        {/* Left: Document Viewer */}
        <div ref={containerRef} className="hidden md:block w-1/2 border-r border-border bg-[#0a0c10] overflow-y-auto p-12 custom-scrollbar">
            {isLoadingDoc ? (
                 <div className="flex h-full items-center justify-center">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
                 </div>
            ) : documentData ? (
                <div className="bg-white rounded shadow-2xl p-12 opacity-90 text-slate-800 min-h-[800px] selection:bg-primary/30 selection:text-primary-900">
                    <h1 className="text-2xl font-bold mb-6 border-b border-slate-200 pb-4">{documentData.title}</h1>
                    <p className="whitespace-pre-wrap leading-relaxed">{documentData.content}</p>
                </div>
            ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                    Document not found. Upload a file to get started.
                </div>
            )}
        </div>

        {/* Right: AI Interface */}
        <div className="w-full md:w-1/2 flex flex-col h-full bg-background relative">
             <div className="px-6 border-b border-border bg-surface/30 backdrop-blur-md flex-none z-10">
                <div className="flex items-center gap-8 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('canvas')} className={`border-b-2 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'canvas' ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                        <span className="material-symbols-outlined text-lg">auto_awesome</span> {t('ai.tab.canvas')}
                    </button>
                    <button onClick={() => setActiveTab('test-builder')} className={`border-b-2 py-4 text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'test-builder' ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                        <span className="material-symbols-outlined text-lg">quiz</span> {t('ai.tab.builder')}
                    </button>

                    <div className="flex-1" />

                    <button
                        type="button"
                        onClick={() => {
                            if (!documentData || documentData.id === 'err') return;
                            clearAISession(documentData.id);
                            resetSessionState(documentData.title);
                            addToast('Начата новая сессия (локальная история очищена)', 'success');
                        }}
                        className="flex items-center gap-2 px-3 py-2 my-2 bg-surface border border-border text-slate-300 rounded-lg text-xs font-bold hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap"
                        title="Очистить локальную историю чата и тестов"
                    >
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        Новая сессия
                    </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-32 md:pb-36 scroll-smooth custom-scrollbar">
                 {activeTab === 'canvas' && (
                     <>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-surface border border-border'}`}>
                                    {msg.type === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 text-primary text-xs font-bold uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-sm">smart_toy</span> EduBot
                                        </div>
                                    )}
                                    <div className="text-sm leading-relaxed break-words prose prose-invert prose-sm max-w-none" 
                                         dangerouslySetInnerHTML={{
                                            __html: msg.text
                                                .split('\n\n')
                                                .map(paragraph => {
                                                    let formatted = paragraph
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                                                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                                        .replace(/\n/g, '<br>');
                                                    return `<p class="mb-3 last:mb-0">${formatted}</p>`;
                                                })
                                                .join('')
                                         }}
                                    />
                                    {msg.isTyping && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse align-middle">|</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                     </>
                 )}

                 {activeTab === 'test-builder' && (
                     <div className="space-y-6 animate-fade-in">
                         {/* Config Panel */}
                         <div className="bg-surface border border-border rounded-2xl p-6 grid grid-cols-3 gap-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-400">{t('ai.difficulty')}</label>
                                 <select 
                                     value={testConfig.difficulty}
                                     onChange={(e) => setTestConfig({...testConfig, difficulty: e.target.value as any})}
                                     className="w-full bg-background border border-border rounded-lg p-2 text-white mt-1 text-sm"
                                 >
                                     <option value="easy">{t('ai.diff.easy')}</option>
                                     <option value="medium">{t('ai.diff.medium')}</option>
                                     <option value="hard">{t('ai.diff.hard')}</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-400">{t('ai.count')}: {testConfig.count}</label>
                                 <input 
                                    type="range" min="1" max="20"
                                    value={testConfig.count}
                                    onChange={(e) => setTestConfig({...testConfig, count: Number(e.target.value)})}
                                    className="w-full mt-2"
                                 />
                             </div>
                             <button 
                                onClick={() => handleGenerateTest()}
                                disabled={isGenerating}
                                className="col-span-1 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-50"
                             >
                                 {isGenerating ? t('ai.generating') : t('ai.generate')}
                             </button>
                         </div>

                         {/* Questions List */}
                         {testQuestions.map((q, idx) => (
                             <div key={q.id} className="bg-surface border border-border rounded-xl p-4 relative group">
                                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                     <button onClick={() => handleRegenerateQuestion(q.id)} className="p-1.5 bg-background border border-border rounded-lg text-primary hover:bg-white/5" title="Regenerate">
                                         <span className="material-symbols-outlined text-sm">refresh</span>
                                     </button>
                                 </div>
                                 <div className="flex gap-3">
                                     <span className="text-slate-500 font-bold">{idx + 1}.</span>
                                     <div className="flex-1">
                                         <p className="text-white font-medium mb-2">{q.text}</p>
                                         <ul className="space-y-1 ml-4 list-disc text-slate-400 text-sm">
                                             {q.options?.map((opt, i) => (
                                                 <li key={i} className={opt === q.correctAnswer ? 'text-green-400' : ''}>{opt}</li>
                                             ))}
                                         </ul>
                                         <div className="mt-3 p-2 bg-background/50 rounded text-xs text-slate-400 italic">
                                             <span className="font-bold not-italic text-slate-300">{t('ai.explanation')}:</span> {q.explanation}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))}
                         
                         {/* Action Buttons after test generation */}
                         {testQuestions.length > 0 && (
                             <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4 animate-fade-in">
                                 <div className="flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-wider">
                                     <span className="material-symbols-outlined">check_circle</span>
                                     Тест сгенерирован успешно ({testQuestions.length} {testQuestions.length === 1 ? 'вопрос' : testQuestions.length < 5 ? 'вопроса' : 'вопросов'})
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                     <button 
                                         onClick={() => {
                                             if (!documentData || documentData.id === 'err') {
                                                 addToast('Сначала выберите материал', 'error');
                                                 return;
                                             }
                                             if (testQuestions.length === 0) return;

                                             saveQuizToLibrary({
                                                 materialId: documentData.id,
                                                 materialTitle: documentData.title,
                                                 config: testConfig,
                                                 questions: testQuestions,
                                             });
                                             setShowSaveSuccess(true);
                                             addToast('Тест сохранён в библиотеку', 'success', {
                                                 label: 'Открыть библиотеку',
                                                 onClick: () => navigate('/library'),
                                             });
                                             setTimeout(() => setShowSaveSuccess(false), 3000);
                                         }}
                                         className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border text-white rounded-xl font-bold hover:bg-white/5 transition-all group"
                                     >
                                         <span className="material-symbols-outlined group-hover:scale-110 transition-transform">save</span>
                                         Сохранить в библиотеку
                                     </button>
                                     <button 
                                         onClick={() => setShowShareModal(true)}
                                         className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all group"
                                     >
                                         <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
                                         Поделиться с учениками
                                     </button>
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                     <button 
                                         onClick={() => addToast("Предпросмотр в разработке", "info")}
                                         className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border text-slate-300 rounded-xl font-medium hover:bg-white/5 hover:text-white transition-all"
                                     >
                                         <span className="material-symbols-outlined text-sm">visibility</span>
                                         Предпросмотр
                                     </button>
                                     <button 
                                         onClick={() => {
                                             setTestQuestions([]);
                                             handleGenerateTest();
                                         }}
                                         className="flex items-center justify-center gap-2 px-4 py-3 bg-surface border border-border text-slate-300 rounded-xl font-medium hover:bg-white/5 hover:text-white transition-all"
                                     >
                                         <span className="material-symbols-outlined text-sm">refresh</span>
                                         Сгенерировать заново
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
             </div>

             {/* Input Area */}
             {activeTab === 'canvas' && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background to-transparent">
                    <form onSubmit={handleSendMessage} className="relative flex items-center bg-surface border border-border rounded-xl shadow-2xl">
                        <input 
                            className="w-full bg-transparent border-none text-white focus:ring-0 py-4 px-4 placeholder-slate-500 outline-none" 
                            placeholder={t('ai.placeholder')}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isGenerating}
                        />
                        <button type="submit" disabled={isGenerating} className="p-2 mr-2 text-primary hover:bg-white/5 rounded-lg">
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </form>
                </div>
             )}
        </div>
    </div>
    
    {/* Share Modal */}
    <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resourceTitle={documentData?.title || "Тест"}
        resourceType="quiz"
    />
    </PageTransition>
  );
};

export default AIWorkspace;