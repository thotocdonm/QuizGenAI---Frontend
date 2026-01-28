
import axios from 'axios';

/**
 * API Configuration
 * The base URL is now pulled from the .env file via process.env
 */
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle common errors like 401
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '#/auth';
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const response = await axiosInstance.post('/auth/login', { email, password });
      return response.data;
    },
    
    register: async (name: string, email: string, password: string): Promise<User> => {
      const response = await axiosInstance.post('/auth/register', { name, email, password });
      return response.data;
    },
    
    logout: async (): Promise<void> => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },
  
  quiz: {
    generate: async (data: any) => {
      const response = await axiosInstance.post('/quizzes/generate', data);
      return response.data;
    },
    
    getQuizzes: async () => {
      const response = await axiosInstance.get('/quizzes');
      return response.data;
    }
  }
};
