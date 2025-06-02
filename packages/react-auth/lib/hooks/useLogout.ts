import { useAuthProvider } from './useAuth';

export const useLogout = () => {
  const { logout, isLoading } = useAuthProvider();

  return {
    logout,
    isLoading,
  };
};
