import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { OCRService } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { PageTransition } from '../components/PageTransition';
import { StudentResult } from '../types';
import Confetti from '../components/Confetti';

const OCR: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<StudentResult[]>([]);
  const [currentWork, setCurrentWork] = useState<StudentResult | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  
  const [manualScore, setManualScore] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
      setLoadingQueue(true);
      try {
          const data = await OCRService.getQueue();
          setQueue(data);
      } catch (e) {
          addToast("Failed to load OCR queue", "error");
      } finally {
          setLoadingQueue(false);
      }
  };

  const loadWork = async (id: string) => {
      try {
          const data = await OCRService.getById(id);
          setCurrentWork(data);
          setManualScore(18); // Mock score
          setViewMode('detail');
      } catch (e) { addToast("Failed to load work details", "error"); }
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleAll = () => {
      if (selectedIds.size === queue.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(queue.map(i => i.id)));
  };

  const handleBatchApprove = async () => {
      if (selectedIds.size === 0) return;
      const count = selectedIds.size;
      const ids = Array.from(selectedIds);
      setQueue(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      try {
          await OCRService.batchApprove(ids);
          setShowConfetti(true);
          addToast(`Successfully graded ${count} works`, "success");
          setTimeout(() => setShowConfetti(false), 3000);
      } catch (e) {
          addToast("Batch operation failed", "error");
          loadQueue();
      }
  };
  
  const handleSave = async () => {
      if (!currentWork) return;
      try {
          await OCRService.updateResult(currentWork.id, { questions: currentWork.questions });
          addToast("Changes saved", "success");
          setIsDirty(false);
      } catch (e) { addToast("Save failed", "error"); }
  };

  return (
    <PageTransition>
    <Confetti active={showConfetti} />
    <div className="h-full bg-background flex flex-col relative overflow-hidden">
        {/* Background blobs for detail view */}
        {viewMode === 'detail' && (
             <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]"></div>
             </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface/80 backdrop-blur z-20 flex justify-between items-center shadow-sm">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                    <span className="material-symbols-outlined">document_scanner</span>
                </div>
                {viewMode === 'list' ? (
                    <span className="tracking-tight">{t('nav.ocr')}</span>
                ) : (
                    <div className="flex flex-col">
                        <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Reviewing</span>
                        <span>{currentWork?.student.name}</span>
                    </div>
                )}
            </h1>
            
            {viewMode === 'list' ? (
                 <div className="flex gap-4 items-center">
                     {selectedIds.size > 0 && <span className="text-sm font-bold text-slate-300 animate-fade-in">{selectedIds.size} {t('ocr.selected')}</span>}
                     <button 
                        onClick={handleBatchApprove}
                        disabled={selectedIds.size === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                     >
                         <span className="material-symbols-outlined text-lg">done_all</span>
                         {t('ocr.approveSelected')}
                     </button>
                 </div>
            ) : (
                <div className="flex gap-3">
                    <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-border text-slate-300 rounded-xl text-sm font-bold hover:bg-white/5 hover:text-white transition-colors">
                        {t('ocr.close')}
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all active:scale-95">
                        <span className="material-symbols-outlined text-lg">save</span>
                        {t('ocr.saveChanges')}
                    </button>
                </div>
            )}
        </div>

        {/* LIST VIEW */}
        {viewMode === 'list' && (
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar h-full">
                {loadingQueue ? (
                    <div className="flex items-center justify-center h-64">
                         <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
                    </div>
                ) : (
                <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-border">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                    <input type="checkbox" checked={selectedIds.size === queue.length && queue.length > 0} onChange={toggleAll} className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary" />
                                </th>
                                <th className="p-4">{t('ocr.th.student')}</th>
                                <th className="p-4">{t('ocr.th.subject')}</th>
                                <th className="p-4">{t('ocr.th.accuracy')}</th>
                                <th className="p-4">{t('ocr.th.status')}</th>
                                <th className="p-4 text-right">{t('ocr.th.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {queue.map(item => (
                                <tr key={item.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(item.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(item.id)} 
                                            onChange={() => toggleSelection(item.id)}
                                            className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary" 
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                                                {item.student.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-white">{item.student.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium">{item.subject || 'Physics 101'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.student.accuracy > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${item.student.accuracy}%` }}></div>
                                            </div>
                                            <span className={`font-bold ${item.student.accuracy > 90 ? 'text-green-400' : item.student.accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {item.student.accuracy}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                            item.status === 'flagged' 
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => loadWork(item.id)} className="text-slate-400 hover:text-white transition-colors group-hover:bg-white/10 p-2 rounded-lg">
                                            <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {queue.length === 0 && (
                        <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                            <div className="size-20 bg-surface rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <span className="material-symbols-outlined text-4xl text-green-500/50">check</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Все проверено!</h3>
                            <p>{t('ocr.caughtUp')}</p>
                        </div>
                    )}
                </div>
                )}
            </div>
        )}

        {/* DETAIL / EDITOR VIEW */}
        {viewMode === 'detail' && currentWork && (
            <div className="flex flex-1 overflow-hidden relative">
                {/* Image Pane */}
                <div className="w-1/2 bg-[#050505] relative flex items-center justify-center overflow-hidden border-r border-border group">
                     {/* Toolbar */}
                     <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-surface/90 backdrop-blur border border-border/50 rounded-xl p-1.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button onClick={() => setZoom(z => z + 10)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title="Zoom In">
                             <span className="material-symbols-outlined text-xl">add</span>
                         </button>
                         <div className="w-px bg-border/50 my-1 mx-1"></div>
                         <button onClick={() => setZoom(100)} className="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white font-mono">
                             {zoom}%
                         </button>
                         <div className="w-px bg-border/50 my-1 mx-1"></div>
                         <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors" title="Zoom Out">
                             <span className="material-symbols-outlined text-xl">remove</span>
                         </button>
                     </div>
                     <img 
                        src={currentWork.image} 
                        className="transition-transform duration-200 shadow-2xl"
                        style={{ transform: `scale(${zoom / 100})`, maxWidth: '90%', maxHeight: '90vh' }} 
                        alt="Student Scan" 
                     />
                </div>
                
                {/* Grading Pane */}
                <div className="w-1/2 bg-background/50 backdrop-blur p-0 flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                        {currentWork.questions.map((q, idx) => (
                            <div key={q.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:border-primary/30 transition-colors group">
                                 <div className="flex justify-between items-center mb-3">
                                     <div className="flex items-center gap-3">
                                         <span className="size-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                             {idx + 1}
                                         </span>
                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{q.label}</span>
                                     </div>
                                     <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase ${q.confidence === 'Low' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'}`}>
                                         <span className="material-symbols-outlined text-sm">{q.confidence === 'Low' ? 'warning' : 'verified'}</span>
                                         {q.confidence === 'Low' ? t('ocr.conf.low') : t('ocr.conf.high')}
                                     </div>
                                 </div>
                                 <div 
                                    className="p-4 bg-[#0a0f1c] border border-border rounded-lg text-white font-mono text-sm leading-relaxed focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all outline-none" 
                                    contentEditable 
                                    suppressContentEditableWarning
                                    onInput={() => setIsDirty(true)}
                                 >
                                     {q.ocrText}
                                 </div>
                                 {q.confidence === 'Low' && (
                                     <div className="mt-2 text-xs text-yellow-500/80 flex items-center gap-2">
                                         <span className="material-symbols-outlined text-sm">info</span>
                                         Please verify the handwritten text above.
                                     </div>
                                 )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Bottom Action Bar */}
                    <div className="p-6 border-t border-border bg-surface z-10 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Score</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={manualScore} 
                                    onChange={(e) => { setManualScore(Number(e.target.value)); setIsDirty(true); }}
                                    className="bg-background border border-border rounded-lg p-2 text-white w-20 text-center font-bold text-xl focus:border-primary focus:outline-none"
                                />
                                <span className="text-slate-500 font-bold text-xl">/ 20</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-500 mb-1">Student Progress</p>
                             <div className="text-white font-bold text-lg flex items-center gap-2">
                                 <span className="material-symbols-outlined text-green-500">trending_up</span>
                                 Top 10%
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    </PageTransition>
  );
};

export default OCR;