import axios from 'axios';
import { store } from '@/store';
import { logout } from '@/store/slices/authSlice';
import { WEB_CONSTANTS } from '@/constants/app.constants';

const apiClient = axios.create({
  baseURL: WEB_CONSTANTS.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already trying to login
      const isLoginRequest = error.config.url?.includes('/auth/login');
      
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      store.dispatch(logout());
      
      if (typeof window !== 'undefined' && !isLoginRequest) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
