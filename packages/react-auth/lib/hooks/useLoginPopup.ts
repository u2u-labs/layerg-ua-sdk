import { useAuthProvider } from './useAuth';

export const useLoginPopup = () => {
  const { isOpenLoginPopup, toggleOpenLoginPopup } = useAuthProvider();

  const openLoginPopup = () => toggleOpenLoginPopup(true);
  const closeLoginPopup = () => toggleOpenLoginPopup(false);

  return {
    isOpen: isOpenLoginPopup,
    openLoginPopup,
    closeLoginPopup,
  };
};
