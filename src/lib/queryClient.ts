import { QueryClient } from '@tanstack/react-query';

let _client: QueryClient | null = null;

export function getQueryClient() {
  if (!_client) {
    _client = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 30_000,
        },
        mutations: { 
          retry: 0 
        },
      },
    });
  }
  return _client;
}
