// src/hooks/useLoginPopup.ts
import { useState } from 'react';

export const useLoginPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openLoginPopup = () => setIsOpen(true);
  const closeLoginPopup = () => setIsOpen(false);
  
  return {
    isOpen,
    openLoginPopup,
    closeLoginPopup
  };
};