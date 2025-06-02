import { useAuthProvider } from './useAuth';

export const useUser = () => {
  const { user, isAuthenticated, isLoading } = useAuthProvider();

  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
