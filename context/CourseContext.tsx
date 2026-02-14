import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course, CourseCreate, CourseUpdate } from '../types';
import { ApiError, CourseService } from '../lib/api';

interface CourseContextType {
  courses: Course[];
  selectedCourse: Course | null;
  loading: boolean;
  selectCourse: (course: Course | null) => void;
  createCourse: (data: CourseCreate) => Promise<Course>;
  updateCourse: (id: string, data: CourseUpdate) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Load courses on mount
  const refreshCourses = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setCourses([]);
      setSelectedCourse(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fetchedCourses = await CourseService.getAll();
      setCourses(fetchedCourses);
      
      // Auto-select first course if none selected and courses exist
      if (!selectedCourse && fetchedCourses.length > 0) {
        setSelectedCourse(fetchedCourses[0]);
      }
      // If selected course was deleted, clear selection
      if (selectedCourse && !fetchedCourses.find(c => c.id === selectedCourse.id)) {
        setSelectedCourse(fetchedCourses.length > 0 ? fetchedCourses[0] : null);
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 401)) {
        console.error('Failed to load courses:', error);
      }
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    refreshCourses();
  }, []);

  const selectCourse = useCallback((course: Course | null) => {
    setSelectedCourse(course);
  }, []);

  const createCourse = useCallback(async (data: CourseCreate): Promise<Course> => {
    const newCourse = await CourseService.create(data);
    setCourses(prev => [...prev, newCourse]);
    // Auto-select newly created course
    setSelectedCourse(newCourse);
    return newCourse;
  }, []);

  const updateCourse = useCallback(async (id: string, data: CourseUpdate): Promise<Course> => {
    const updatedCourse = await CourseService.update(id, data);
    setCourses(prev => prev.map(c => c.id === id ? updatedCourse : c));
    // Update selected course if it's the one being updated
    if (selectedCourse?.id === id) {
      setSelectedCourse(updatedCourse);
    }
    return updatedCourse;
  }, [selectedCourse]);

  const deleteCourse = useCallback(async (id: string): Promise<void> => {
    await CourseService.delete(id);
    setCourses(prev => prev.filter(c => c.id !== id));
    // Clear selection if deleting selected course
    if (selectedCourse?.id === id) {
      const remaining = courses.filter(c => c.id !== id);
      setSelectedCourse(remaining.length > 0 ? remaining[0] : null);
    }
  }, [courses, selectedCourse]);

  return (
    <CourseContext.Provider value={{
      courses,
      selectedCourse,
      loading,
      selectCourse,
      createCourse,
      updateCourse,
      deleteCourse,
      refreshCourses
    }}>
      {children}
    </CourseContext.Provider>
  );
};

// Legacy export for backward compatibility
export type CourseType = string;