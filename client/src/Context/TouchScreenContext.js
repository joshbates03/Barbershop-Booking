import React, { createContext, useContext } from 'react';

const TouchScreenContext = createContext();

export const TouchScreenProvider = ({ children }) => {
  
  const isTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  return (
    <TouchScreenContext.Provider value={isTouchScreen}>
      {children}
    </TouchScreenContext.Provider>
  );
};

export const useTouch = () => useContext(TouchScreenContext);
