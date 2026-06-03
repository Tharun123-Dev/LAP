import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    root.classList.remove('dark');
    body.classList.remove('dark');
    root.style.colorScheme = 'light';
    
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Disabled
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
};