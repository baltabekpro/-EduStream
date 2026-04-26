import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useToast } from './Toast';
import { useLanguage } from '../context/LanguageContext';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { nameKey: 'createCourse.colors.blue', value: '#3b82f6' },
  { nameKey: 'createCourse.colors.purple', value: '#8b5cf6' },
  { nameKey: 'createCourse.colors.pink', value: '#ec4899' },
  { nameKey: 'createCourse.colors.red', value: '#ef4444' },
  { nameKey: 'createCourse.colors.orange', value: '#f97316' },
  { nameKey: 'createCourse.colors.yellow', value: '#eab308' },
  { nameKey: 'createCourse.colors.green', value: '#10b981' },
  { nameKey: 'createCourse.colors.teal', value: '#14b8a6' },
  { nameKey: 'createCourse.colors.cyan', value: '#06b6d4' },
  { nameKey: 'createCourse.colors.indigo', value: '#6366f1' },
];

const ICONS = [
  { icon: 'school', nameKey: 'createCourse.icons.school' },
  { icon: 'menu_book', nameKey: 'createCourse.icons.menu_book' },
  { icon: 'science', nameKey: 'createCourse.icons.science' },
  { icon: 'calculate', nameKey: 'createCourse.icons.calculate' },
  { icon: 'language', nameKey: 'createCourse.icons.language' },
  { icon: 'palette', nameKey: 'createCourse.icons.palette' },
  { icon: 'fitness_center', nameKey: 'createCourse.icons.fitness_center' },
  { icon: 'music_note', nameKey: 'createCourse.icons.music_note' },
  { icon: 'psychology', nameKey: 'createCourse.icons.psychology' },
  { icon: 'computer', nameKey: 'createCourse.icons.computer' },
];

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose }) => {
  const { createCourse, refreshCourses } = useCourse();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedIcon, setSelectedIcon] = useState('school');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      addToast(t('course.enterTitle'), 'error');
      return;
    }

    try {
      setLoading(true);
      await createCourse({
        title: title.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: selectedIcon,
      });
      
      await refreshCourses();
      addToast(t('course.created'), 'success');
      handleClose();
    } catch (error) {
      console.error('Failed to create course:', error);
      addToast(t('course.failedToCreate'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setSelectedColor('#3b82f6');
      setSelectedIcon('school');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('createCourse.title')}</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('createCourse.courseName')} <span className="text-red-400">{t('createCourse.required')}</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('createCourse.namePlaceholder')}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('createCourse.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createCourse.descriptionPlaceholder')}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('createCourse.courseColor')}
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-12 h-12 rounded-xl transition-all ${
                    selectedColor === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={t(color.nameKey)}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('createCourse.courseIcon')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon.icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon.icon)}
                  className={`flex items-center justify-center w-12 h-12 rounded-xl border transition-all ${
                    selectedIcon === icon.icon
                      ? 'bg-primary border-primary text-white scale-110'
                      : 'bg-background border-border text-slate-400 hover:border-primary hover:text-primary'
                  }`}
                  title={t(icon.nameKey)}
                >
                  <span className="material-symbols-outlined text-2xl">{icon.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('createCourse.preview')}
            </label>
            <div
              className="p-4 rounded-xl flex items-center gap-3 border border-border"
              style={{ backgroundColor: `${selectedColor}15` }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="material-symbols-outlined text-white text-2xl">
                  {selectedIcon}
                </span>
              </div>
              <div>
                <div className="font-bold text-white">{title || t('createCourse.courseNameDefault')}</div>
                {description && (
                  <div className="text-sm text-slate-400 line-clamp-2">{description}</div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {t('createCourse.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('createCourse.creating')}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add</span>
                  {t('createCourse.create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
