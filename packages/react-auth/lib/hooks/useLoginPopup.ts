// src/hooks/useLoginPopup.ts
import { useAuth } from "./useAuth";

export const useLoginPopup = () => {
  const { isOpenLoginPopup, toggleOpenLoginPopup } = useAuth();

  const openLoginPopup = () => toggleOpenLoginPopup(true);
  const closeLoginPopup = () => toggleOpenLoginPopup(false);

  return {
    isOpen: isOpenLoginPopup,
    openLoginPopup,
    closeLoginPopup,
  };
};
