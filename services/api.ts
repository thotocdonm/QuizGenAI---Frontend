import { ApiResponse } from "@/types/apiResponse";
import { LoginResponse, User } from "@/types/auth";
import {
  clearToken,
  getAccessToken,
  getRefreshToken,
  setToken,
} from "@/utils/authUtils";
import axios from "axios";

/**
 * API Configuration
 * The base URL is now pulled from the .env file via process.env
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Bearer Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle common errors like 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearToken();
        window.location.href = "#/auth";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        setToken(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        clearToken();
        window.location.href = "#/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  auth: {
    login: async (
      email: string,
      password: string,
    ): Promise<ApiResponse<LoginResponse>> => {
      const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        { email, password },
      );
      setToken(response.data.data.accessToken, response.data.data.refreshToken);
      return response.data;
    },

    register: async (
      name: string,
      email: string,
      password: string,
    ): Promise<ApiResponse<User>> => {
      const response = await axiosInstance.post<ApiResponse<User>>(
        "/auth/register",
        { fullName: name, email, password },
      );
      return response.data;
    },
  },

  quiz: {
    // Cập nhật endpoint từ /quizzes thành /quiz để khớp với backend
    generate: async (data: any) => {
      // axiosInstance sẽ tự động thêm Authorization: Bearer <token> nhờ Interceptor ở trên
      const response = await axiosInstance.post("/quiz/generate", data);
      return response.data;
    },

    // Thêm hàm lấy chi tiết Quiz theo ID để dùng cho trang QuizPlay
    getById: async (id: string) => {
      const response = await axiosInstance.get(`/quiz/${id}`);
      return response.data;
    },
    getPublic: async (id: string) => {
      const response = await axiosInstance.get(`/quiz/public/${id}`);
      return response.data;
    },
    submit: async (id: string, answers: any, duration?: number) => {
      const response = await axiosInstance.post(`/quiz/submit/${id}`, {
        answers,
        ...(typeof duration === "number" ? { duration } : {}),
      });
      return response.data;
    },
    start: async (id: string) => {
      const response = await axiosInstance.post(`/quiz/start/${id}`);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await axiosInstance.put(`/quiz/${id}`, data);
      return response.data;
    },

    getQuizzes: async () => {
      const response = await axiosInstance.get("/quiz");
      return response.data;
    },


     delete: async (id: string) => {
    const response = await axiosInstance.delete(`/quiz/${id}`);
    return response.data;
  },

    getHistory: async () => {
    const response = await axiosInstance.get('/quiz/history/me');
    return response.data;
  },



  },
  attempt: {
    getUserAttempts: async () => {
      const response = await axiosInstance.get("/attempt");
      return response.data;
    },
  
   // THÊM HÀM NÀY VÀO ĐÂY:
    getAttemptByNumber: async (quizId: string, attemptNumber: number) => {
      // Đường dẫn này phải khớp với router.get("/:id/:number", ...) ở Backend
      const response = await axiosInstance.get(`/attempt/${quizId}/${attemptNumber}`);
      return response.data;
    }
  }
  
};
