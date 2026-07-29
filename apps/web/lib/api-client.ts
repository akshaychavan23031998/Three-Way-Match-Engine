import axios from 'axios';
import { authStorage } from './auth-storage';
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api',
});
apiClient.interceptors.request.use((config) => {
  const token = authStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    typeof window !== 'undefined'
  ) {
    authStorage.clear();
    window.location.assign('/login');
  }
  return Promise.reject(error instanceof Error ? error : new Error('API request failed'));
});
