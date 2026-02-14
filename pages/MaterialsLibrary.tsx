import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIService, ShareService } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import { useToast } from '../components/Toast';
import { useCourse } from '../context/CourseContext';
import type { Material } from '../types';

const ASSIGNMENT_LINKS_STORAGE_KEY = 'teacherAssignmentLinks';

type AssignmentLinkMap = Record<string, { url: string; code: string }>;

const loadSavedLinks = (): AssignmentLinkMap => {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_LINKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const MaterialsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { selectedCourse } = useCourse();

  const [items, setItems] = useState<Material[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sharingMaterialId, setSharingMaterialId] = useState<string | null>(null);
  const [assignmentLinks, setAssignmentLinks] = useState<AssignmentLinkMap>(loadSavedLinks());

  useEffect(() => {
    localStorage.setItem(ASSIGNMENT_LINKS_STORAGE_KEY, JSON.stringify(assignmentLinks));
  }, [assignmentLinks]);

  const handleCreateAssignment = async (material: Material) => {
    try {
      setSharingMaterialId(material.id);
      const result = await ShareService.create(material.id, {
        resourceType: 'material',
        viewOnly: true,
        allowCopy: false,
      });
      const code = result.url.split('/shared/')[1] || '';
      setAssignmentLinks((prev) => ({
        ...prev,
        [material.id]: { url: result.url, code }
      }));
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.url);
      }
      addToast('Ссылка и код задания созданы', 'success');
    } catch (error: any) {
      addToast(error.message || 'Не удалось создать ссылку задания', 'error');
    } finally {
      setSharingMaterialId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!selectedCourse) {
          setItems([]);
          return;
        }
        const data = await AIService.getMaterials(selectedCourse.id);
        setItems(data);
      } catch (error: any) {
        addToast(error.message || 'Не удалось загрузить библиотеку материалов', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedCourse?.id]);

  useEffect(() => {
    if (!items.length) return;
    setAssignmentLinks((prev) => {
      const itemIds = new Set(items.map((item) => item.id));
      const next = Object.fromEntries(
        Object.entries(prev).filter(([materialId]) => itemIds.has(materialId))
      );
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [items]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.title.toLowerCase().includes(normalized));
  }, [items, query]);

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Библиотека файлов</h1>
            <p className="text-slate-400 text-sm">Файлы курса: {selectedCourse?.title || 'курс не выбран'}.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-slate-300 hover:bg-white/5"
          >
            На дашборд
          </button>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск материала..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
          />
        </div>

        {!selectedCourse ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">Сначала выберите курс в левом меню</div>
        ) : isLoading ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">Материалы не найдены</div>
        ) : (
          <div className="space-y-3">
            {!!Object.keys(assignmentLinks).length && (
              <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-300">Опубликованных заданий: {Object.keys(assignmentLinks).length}</p>
                <button
                  type="button"
                  onClick={() => setAssignmentLinks({})}
                  className="px-3 py-1.5 bg-background border border-border text-slate-300 rounded-lg text-xs font-bold hover:bg-white/5"
                >
                  Очистить сохранённые ссылки
                </button>
              </div>
            )}
            {filtered.map((material) => (
              <div key={material.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-white font-bold">{material.title}</p>
                  <p className="text-slate-400 text-xs mt-1 truncate">{material.id}</p>
                  {assignmentLinks[material.id] && (
                    <div className="mt-3 bg-background border border-border rounded-lg p-3 space-y-2">
                      <p className="text-xs text-slate-400">Задание опубликовано</p>
                      <p className="text-sm font-black tracking-wider text-white">{assignmentLinks[material.id].code}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(assignmentLinks[material.id].url, '_blank')}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover"
                        >
                          Открыть как ученик
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const code = assignmentLinks[material.id].code;
                            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
                            addToast('Код скопирован', 'success');
                          }}
                          className="px-3 py-1.5 bg-surface border border-border text-slate-200 rounded-lg text-xs font-bold hover:bg-white/5"
                        >
                          Копировать код
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const url = assignmentLinks[material.id].url;
                            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
                            addToast('Ссылка скопирована', 'success');
                          }}
                          className="px-3 py-1.5 bg-surface border border-border text-slate-200 rounded-lg text-xs font-bold hover:bg-white/5"
                        >
                          Копировать ссылку
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/ai', { state: { docId: material.id } })}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
                >
                  Открыть в AI
                </button>
                <button
                  onClick={() => handleCreateAssignment(material)}
                  disabled={sharingMaterialId === material.id}
                  className="px-4 py-2 bg-surface border border-border text-slate-200 rounded-xl font-bold hover:bg-white/5 disabled:opacity-60"
                >
                  {sharingMaterialId === material.id ? 'Создаю...' : assignmentLinks[material.id] ? 'Обновить ссылку' : 'Создать задание'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MaterialsLibrary;
