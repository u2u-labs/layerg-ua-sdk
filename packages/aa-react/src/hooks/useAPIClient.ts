import { useContext } from 'react';
import { APIClientContext } from '../contexts';

export const useAPIClient = () => {
  return useContext(APIClientContext);
};
