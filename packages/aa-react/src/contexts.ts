import { createContext } from 'react';
import { APIClient } from './utils/api';

export const APIClientContext = createContext<APIClient | null>(null);
