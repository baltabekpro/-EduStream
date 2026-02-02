import React, { createContext, useContext, useState } from 'react';

export type CourseType = '9A' | '10B';

interface CourseContextType {
  selectedCourse: CourseType;
  setCourse: (course: CourseType) => void;
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
  const [selectedCourse, setCourse] = useState<CourseType>('9A');

  return (
    <CourseContext.Provider value={{ selectedCourse, setCourse }}>
      {children}
    </CourseContext.Provider>
  );
};