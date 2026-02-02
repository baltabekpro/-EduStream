import React, { createContext, useContext, useState } from 'react';

export type CourseType = string;

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
  // Initialize with empty string, Sidebar will fetch and select the first one
  const [selectedCourse, setCourse] = useState<CourseType>(''); 

  return (
    <CourseContext.Provider value={{ selectedCourse, setCourse }}>
      {children}
    </CourseContext.Provider>
  );
};