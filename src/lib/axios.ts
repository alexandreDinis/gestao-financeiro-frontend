import axios, { AxiosError } from "axios";
import { getCookie, deleteCookie, setCookie } from "./cookies";
import { toast } from "./toast";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  withCredentials: true, // Prepares for HTTPOnly cookies and cross-domain sessions
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

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

// Request Interceptor: Add JWT Token from Cookies
api.interceptors.request.use(
  (config) => {
    // Attempt to read from cookies first
    const token = getCookie("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized & Auth Retries
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Assume backend has a /auth/refresh endpoint for robust token rotation
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newToken = refreshResponse.data.data.token || refreshResponse.data.token;
        if (newToken) {
          setCookie("access_token", newToken);
          api.defaults.headers.common["Authorization"] = "Bearer " + newToken;
          originalRequest.headers.Authorization = "Bearer " + newToken;
        }
        
        processQueue(null, newToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        
        // Fully logout
        deleteCookie("access_token");
        deleteCookie("refresh_token");
        
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 403) {
      console.warn("[Axios] Access denied. Insufficient permissions.");
      toast.error("Acesso Negado", "Você não tem permissão para realizar esta ação.");
    }

    return Promise.reject(error);
  }
);
