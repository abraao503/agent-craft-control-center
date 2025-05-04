import React, { createContext, useContext } from "react";

// Contexto para compartilhar a referência do container principal
export const MainContainerRefContext =
  createContext<React.RefObject<HTMLDivElement> | null>(null);

export const useMainContainerRef = () => {
  const context = useContext(MainContainerRefContext);
  if (!context) {
    throw new Error(
      "useMainContainerRef must be used within a MainContainerRefProvider"
    );
  }
  return context;
}; 