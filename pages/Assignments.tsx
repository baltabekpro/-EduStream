import React, { useEffect, useMemo, useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { useCourse } from '../context/CourseContext';
import { AIService, MaterialService, OCRService, ShareService } from '../lib/api';
import { useToast } from '../components/Toast';
import type { AssignmentLinkHistoryItem, AssignmentSubmissionHistoryItem, Material, StudentResult } from '../types';
import ShareModal from '../components/ShareModal';

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const Assignments: React.FC = () => {
  const { selectedCourse } = useCourse();
  const { addToast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [assignmentText, setAssignmentText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linksHistory, setLinksHistory] = useState<AssignmentLinkHistoryItem[]>([]);
  const [submissionsHistory, setSubmissionsHistory] = useState<AssignmentSubmissionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [openedSubmission, setOpenedSubmission] = useState<AssignmentSubmissionHistoryItem | null>(null);
  const [openedAnswerDetails, setOpenedAnswerDetails] = useState<StudentResult | null>(null);

  const selectedMaterial = useMemo(
    () => materials.find((item) => item.id === selectedMaterialId) || null,
    [materials, selectedMaterialId]
  );

  const isImagePath = (value?: string) => /\.(png|jpe?g|bmp|tiff?|webp|gif)$/i.test(value || '');

  const loadMaterials = async () => {
    if (!selectedCourse?.id) {
      setMaterials([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await AIService.getMaterials(selectedCourse.id);
      setMaterials(data);
      if (!selectedMaterialId && data.length > 0) {
        setSelectedMaterialId(data[0].id);
        setAssignmentText(data[0].summary || '');
      }
    } catch (error: any) {
      addToast(error.message || 'Не удалось загрузить материалы курса', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedCourse?.id) {
      setLinksHistory([]);
      setSubmissionsHistory([]);
      return;
    }

    setHistoryLoading(true);
    try {
      const [links, submissions] = await Promise.all([
        ShareService.getAssignmentLinks(selectedCourse.id),
        ShareService.getAssignmentResults(selectedCourse.id, 'all'),
      ]);
      setLinksHistory(links);
      setSubmissionsHistory(submissions);
    } catch (error: any) {
      addToast(error.message || 'Не удалось загрузить историю заданий', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    loadHistory();
  }, [selectedCourse?.id]);

  useEffect(() => {
    if (selectedMaterial) {
      setAssignmentText(selectedMaterial.summary || '');
    }
  }, [selectedMaterial?.id]);

  const handleGenerate = async () => {
    if (!selectedMaterial) {
      addToast('Выберите материал для генерации задания', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await AIService.generateAssignment(selectedMaterial.id, instruction);
      setAssignmentText(result.assignmentText || '');
      setMaterials((prev) => prev.map((item) => (
        item.id === selectedMaterial.id
          ? { ...item, summary: result.assignmentText }
          : item
      )));
      addToast('Задание сгенерировано', 'success');
    } catch (error: any) {
      addToast(error.message || 'Не удалось сгенерировать задание', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMaterial) {
      addToast('Выберите материал', 'error');
      return;
    }

    if (!assignmentText.trim()) {
      addToast('Введите текст задания перед сохранением', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await MaterialService.update(selectedMaterial.id, { summary: assignmentText.trim() });
      setMaterials((prev) => prev.map((item) => (
        item.id === selectedMaterial.id
          ? { ...item, summary: assignmentText.trim() }
          : item
      )));
      addToast('Задание сохранено', 'success');
    } catch (error: any) {
      addToast(error.message || 'Не удалось сохранить задание', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const insertFormatting = (snippet: string) => {
    setAssignmentText((prev) => `${prev}${prev.endsWith('\n') || prev.length === 0 ? '' : '\n'}${snippet}`);
  };

  const handleOpenCheckedAnswer = async (item: AssignmentSubmissionHistoryItem) => {
    setOpenedSubmission(item);
    setIsAnswerModalOpen(true);
    setAnswerLoading(true);
    setOpenedAnswerDetails(null);
    try {
      const details = await OCRService.getById(item.submissionId);
      setOpenedAnswerDetails(details);
    } catch (error: any) {
      addToast(error.message || 'Не удалось открыть ответ', 'error');
    } finally {
      setAnswerLoading(false);
    }
  };

  if (!selectedCourse) {
    return (
      <PageTransition>
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-3xl">
            <h1 className="text-2xl font-black text-white">Задания</h1>
            <p className="text-slate-400 mt-2">Сначала выберите курс в левом меню.</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Задания курса</h1>
          <p className="text-slate-400 mt-2">Курс: {selectedCourse.title}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Материал-источник</label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
                disabled={isLoading || materials.length === 0}
              >
                {materials.length === 0 ? (
                  <option value="">Нет материалов в курсе</option>
                ) : (
                  materials.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Пожелания к заданию (опционально)</label>
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Например: сделать задание для 9 класса, 20 минут"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedMaterial || isGenerating}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover disabled:opacity-60"
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать задание с AI'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedMaterial || isSaving}
              className="px-4 py-2 bg-surface border border-border text-slate-300 rounded-xl font-bold hover:bg-white/5 disabled:opacity-60"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить задание'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowShareModal(true);
              }}
              disabled={!selectedMaterial || !assignmentText.trim()}
              className="px-4 py-2 bg-surface border border-border text-white rounded-xl font-bold hover:bg-white/5 disabled:opacity-60"
            >
              Назначить ученикам
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Текст задания</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <button type="button" onClick={() => insertFormatting('# Заголовок')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">H1</button>
              <button type="button" onClick={() => insertFormatting('## Подзаголовок')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">H2</button>
              <button type="button" onClick={() => insertFormatting('**Жирный текст**')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">Жирный</button>
              <button type="button" onClick={() => insertFormatting('*Курсив*')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">Курсив</button>
              <button type="button" onClick={() => insertFormatting('- Пункт списка')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">Список</button>
              <button type="button" onClick={() => insertFormatting('1) Шаг 1\n2) Шаг 2')} className="px-2 py-1 text-xs rounded-lg border border-border text-slate-300 hover:bg-white/5">Шаги</button>
            </div>
            <textarea
              value={assignmentText}
              onChange={(e) => setAssignmentText(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white min-h-56"
              placeholder="Сгенерируйте задание через AI или введите текст вручную"
            />
            <p className="text-xs text-slate-500 mt-2">Поддерживается форматирование: заголовки (#), жирный (**текст**), курсив (*текст*), списки (- пункт).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">История назначений</h2>
              <button
                onClick={loadHistory}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-300 hover:bg-white/5"
              >
                Обновить
              </button>
            </div>

            {historyLoading ? (
              <div className="text-slate-400 text-sm">Загрузка...</div>
            ) : linksHistory.length === 0 ? (
              <div className="text-slate-400 text-sm">Пока нет созданных ссылок на задания</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {linksHistory.map((item) => (
                  <div key={item.linkId} className="bg-background border border-border rounded-lg p-3">
                    <p className="text-white text-sm font-bold truncate" title={item.materialTitle}>{item.materialTitle}</p>
                    <p className="text-slate-400 text-xs mt-1">Код: {item.shortCode} • {formatDate(item.createdAt)}</p>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-primary text-xs mt-2 inline-block hover:underline">Открыть ссылку</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <h2 className="text-lg font-bold text-white mb-4">История проверенных заданий</h2>

            {historyLoading ? (
              <div className="text-slate-400 text-sm">Загрузка...</div>
            ) : submissionsHistory.length === 0 ? (
              <div className="text-slate-400 text-sm">Ответов по заданиям пока нет</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {submissionsHistory.map((item) => (
                  <div key={item.submissionId} className="bg-background border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-bold truncate">{item.studentName}</p>
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${item.status === 'graded' || item.status === 'reviewed' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                        {item.status === 'graded' || item.status === 'reviewed' ? 'Проверено' : 'На проверке'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">{formatDate(item.submittedAt)}{typeof item.score === 'number' ? ` • ${item.score}%` : ''}</p>
                    {item.previewText && (
                      <p className="text-slate-300 text-xs mt-2 line-clamp-2">{item.previewText}</p>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleOpenCheckedAnswer(item)}
                        disabled={!(item.status === 'graded' || item.status === 'reviewed')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-200 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Открыть ответ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isAnswerModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAnswerModalOpen(false)}></div>
          <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl p-5 md:p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Ответ ученика</h3>
                <p className="text-xs text-slate-400">{openedSubmission?.studentName || '—'} • {formatDate(openedSubmission?.submittedAt)}</p>
              </div>
              <button
                onClick={() => setIsAnswerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {answerLoading ? (
              <div className="text-slate-400 text-sm">Загрузка ответа...</div>
            ) : !openedAnswerDetails ? (
              <div className="text-slate-400 text-sm">Не удалось загрузить детали ответа</div>
            ) : (
              <div className="space-y-4">
                {isImagePath(openedAnswerDetails.image) ? (
                  <div className="bg-background border border-border rounded-xl p-3">
                    <img src={openedAnswerDetails.image} alt="Ответ ученика" className="max-h-[320px] mx-auto rounded-lg" />
                  </div>
                ) : (
                  <div className="bg-background border border-border rounded-xl p-3 text-xs text-slate-400">
                    Файл ответа: {openedAnswerDetails.image || 'нет файла'}
                  </div>
                )}

                <div className="space-y-3">
                  {openedAnswerDetails.questions.map((region) => (
                    <div key={region.id} className="bg-background border border-border rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-2">{region.label}</p>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{region.ocrText || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          loadHistory();
        }}
        resourceType="material"
        resourceId={selectedMaterial?.id}
        resourceTitle={selectedMaterial?.title || 'Задание'}
      />
    </PageTransition>
  );
};

export default Assignments;
