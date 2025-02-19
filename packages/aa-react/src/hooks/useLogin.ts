import { useCallback } from 'react';
import { LoginPayload } from '../types/api';
import { useAPIClient } from './useAPIClient';

export const useLogin = () => {
  const apiClient = useAPIClient();

  return useCallback(
    async (payload: LoginPayload) => {
      if (!apiClient) return;

      return apiClient.login(payload);
    },
    [apiClient]
  );
};
