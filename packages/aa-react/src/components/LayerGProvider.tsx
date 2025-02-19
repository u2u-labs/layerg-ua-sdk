import { LayerGAPIParams } from '@layerg-ua-sdk/aa-sdk';
import { ReactNode, useEffect, useState } from 'react';
import { APIClientContext } from '../contexts';
import { APIClient } from '../utils/api';

type Props = {
  apiParams: LayerGAPIParams;
  children: ReactNode;
};

export const LayerGProvider = ({ children, apiParams }: Props) => {
  const [apiClient, setAPIClient] = useState<APIClient | null>(null);

  useEffect(() => {
    const apiClient = new APIClient(apiParams);
    apiClient.generateUAHeaders().then(() => setAPIClient(apiClient));
  }, [apiParams]);

  return (
    <APIClientContext.Provider value={apiClient}>
      {children}
    </APIClientContext.Provider>
  );
};
