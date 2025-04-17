import { useAuth } from './useAuth';

export const useLogout = () => {
  const { logout, isLoading } = useAuth();
  
  return {
    logout,
    isLoading
  };
};
