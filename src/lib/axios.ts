import axios from "axios";

// Create Axios Instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add JWT Token
api.interceptors.request.use(
  (config) => {
    // We will retrieve the token from localStorage or cookies
    // For now, let's assume localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("@Financeiro:token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof window !== "undefined") {
        localStorage.removeItem("@Financeiro:token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
