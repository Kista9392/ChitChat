import axios from 'axios';
import { safeStorage } from './storage';

const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'}/api/v1`,
});

// We add a "middleman" that injects our Security Token into every request automatically
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = safeStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = safeStorage.getItem('refreshToken');
      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Use plain axios to avoid interceptor loop!
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken } = response.data;
        
        safeStorage.setItem('accessToken', accessToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        
        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (typeof window !== 'undefined') {
          safeStorage.clear();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
