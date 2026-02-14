import React from 'react';

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="w-full h-full flex flex-col">
            {children}
        </div>
    );
};