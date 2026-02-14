import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIService } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import { useToast } from '../components/Toast';
import type { Material } from '../types';

const MaterialsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [items, setItems] = useState<Material[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AIService.getMaterials();
        setItems(data);
      } catch (error: any) {
        addToast(error.message || 'Не удалось загрузить библиотеку материалов', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

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
            <p className="text-slate-400 text-sm">Выберите материал для работы с AI ассистентом.</p>
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

        {isLoading ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">Материалы не найдены</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((material) => (
              <div key={material.id} className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-white font-bold">{material.title}</p>
                  <p className="text-slate-400 text-xs mt-1 truncate">{material.id}</p>
                </div>
                <button
                  onClick={() => navigate('/ai', { state: { docId: material.id } })}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
                >
                  Открыть в AI
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
