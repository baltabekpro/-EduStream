import React, { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { OCRService } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { PageTransition } from '../components/PageTransition';
import { StudentResult } from '../types';
import Confetti from '../components/Confetti';

// Mock Queue Data for Batch Mode
const mockQueue = [
    { id: '1', name: 'Александра-Виктория К.', subject: 'Алгебра II', status: 'pending', accuracy: 92 },
    { id: '2', name: 'Борис Джонсон', subject: 'Физика', status: 'pending', accuracy: 88 },
    { id: '3', name: 'Мария Иванова', subject: 'История', status: 'flagged', accuracy: 45 },
    { id: '4', name: 'Петр Петров', subject: 'Литература', status: 'pending', accuracy: 95 },
];

const OCR: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  // View State
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState(mockQueue);
  const [currentWork, setCurrentWork] = useState<StudentResult | null>(null);
  
  // Editor State
  const [manualScore, setManualScore] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load Work Details
  const loadWork = async (id: string) => {
      try {
          const data = await OCRService.getById(id);
          setCurrentWork(data);
          setManualScore(18); // Mock initial score
          setViewMode('detail');
      } catch (e) {
          addToast("Failed to load work", "error");
      }
  };

  // --- Batch Logic ---

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
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

      // Optimistic Update
      setQueue(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      addToast(`Processing ${count} works...`, "info");

      try {
          await OCRService.batchApprove(ids);
          setShowConfetti(true);
          addToast(`Successfully graded ${count} works`, "success");
          setTimeout(() => setShowConfetti(false), 3000);
      } catch (e) {
          addToast("Batch operation failed", "error");
          // Rollback logic would go here in real app
      }
  };

  // --- Editor Logic ---
  
  const handleSave = async () => {
      if (!currentWork) return;
      try {
          await OCRService.updateResult(currentWork.id, { questions: currentWork.questions });
          addToast("Changes saved", "success");
          setIsDirty(false);
      } catch (e) {
          addToast("Save failed", "error");
      }
  };

  return (
    <PageTransition>
    <Confetti active={showConfetti} />
    <div className="h-full bg-background flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface/50 backdrop-blur flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">document_scanner</span>
                {viewMode === 'list' ? t('nav.ocr') : currentWork?.student.name}
            </h1>
            
            {viewMode === 'list' ? (
                 <div className="flex gap-3">
                     <span className="text-sm text-slate-400 self-center">{selectedIds.size} {t('ocr.selected')}</span>
                     <button 
                        onClick={handleBatchApprove}
                        disabled={selectedIds.size === 0}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-primary-hover transition-colors"
                     >
                         {t('ocr.approveSelected')}
                     </button>
                 </div>
            ) : (
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-border text-slate-300 rounded-lg text-sm font-bold hover:bg-white/5">
                        {t('ocr.close')}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-hover">
                        {t('ocr.saveChanges')}
                    </button>
                </div>
            )}
        </div>

        {/* BATCH LIST VIEW */}
        {viewMode === 'list' && (
            <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-background text-slate-400 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4 w-12">
                                    <input type="checkbox" checked={selectedIds.size === queue.length && queue.length > 0} onChange={toggleAll} className="rounded border-slate-600 bg-slate-800" />
                                </th>
                                <th className="p-4">{t('ocr.th.student')}</th>
                                <th className="p-4">{t('ocr.th.subject')}</th>
                                <th className="p-4">{t('ocr.th.accuracy')}</th>
                                <th className="p-4">{t('ocr.th.status')}</th>
                                <th className="p-4 text-right">{t('ocr.th.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {queue.map(item => (
                                <tr key={item.id} className={`hover:bg-white/5 transition-colors ${selectedIds.has(item.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="p-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(item.id)} 
                                            onChange={() => toggleSelection(item.id)}
                                            className="rounded border-slate-600 bg-slate-800" 
                                        />
                                    </td>
                                    <td className="p-4 font-bold text-white">{item.name}</td>
                                    <td className="p-4">{item.subject}</td>
                                    <td className="p-4">
                                        <span className={`font-bold ${item.accuracy > 90 ? 'text-green-400' : item.accuracy > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {item.accuracy}%
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'flagged' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => loadWork(item.id)} className="text-primary hover:underline font-bold">{t('ocr.review')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {queue.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                            <p>{t('ocr.caughtUp')}</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* EDITOR VIEW */}
        {viewMode === 'detail' && currentWork && (
            <div className="flex flex-1 overflow-hidden">
                {/* Image Pane */}
                <div className="w-1/2 bg-black relative flex items-center justify-center overflow-hidden border-r border-border">
                     <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-surface/80 rounded-lg p-1">
                         <button onClick={() => setZoom(z => z + 10)} className="p-2 hover:text-white text-slate-400"><span className="material-symbols-outlined">zoom_in</span></button>
                         <button onClick={() => setZoom(z => z - 10)} className="p-2 hover:text-white text-slate-400"><span className="material-symbols-outlined">zoom_out</span></button>
                     </div>
                     <img 
                        src={currentWork.image} 
                        className="transition-transform duration-200"
                        style={{ transform: `scale(${zoom / 100})`, maxWidth: '90%' }} 
                        alt="Scan" 
                     />
                </div>
                
                {/* Text Pane */}
                <div className="w-1/2 bg-surface p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {currentWork.questions.map(q => (
                        <div key={q.id} className="space-y-2">
                             <div className="flex justify-between">
                                 <span className="text-xs font-bold text-primary uppercase">{q.label}</span>
                                 <span className={`text-xs font-bold ${q.confidence === 'Low' ? 'text-yellow-500' : 'text-green-500'}`}>
                                     {q.confidence === 'Low' ? t('ocr.conf.low') : t('ocr.conf.high')}
                                 </span>
                             </div>
                             <div className="p-4 bg-background border border-border rounded-lg text-white font-mono text-sm leading-relaxed" contentEditable suppressContentEditableWarning>
                                 {q.ocrText}
                             </div>
                        </div>
                    ))}
                    <div className="pt-6 border-t border-border">
                        <label className="text-sm font-bold text-white block mb-2">{t('ocr.grade')}</label>
                        <input 
                            type="number" 
                            value={manualScore} 
                            onChange={(e) => { setManualScore(Number(e.target.value)); setIsDirty(true); }}
                            className="bg-background border border-border rounded p-2 text-white w-24"
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
    </PageTransition>
  );
};

export default OCR;
