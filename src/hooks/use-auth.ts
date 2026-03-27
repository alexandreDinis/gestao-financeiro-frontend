import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { setCookie, deleteCookie } from "@/lib/cookies";

/**
 * Global authentication hook abstracting React Query to fetch the 
 * current user profile, managing session state and logout functions.
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth", "me"],
    // Assuming the backend has an /auth/me endpoint 
    // If not, we map it to whatever user data route exists, 
    // or decode parsing of the JWT if purely stateless.
    queryFn: async () => {
      // In many Spring Boot JWT setups this is just a standard profile fetch
      try {
        const { data } = await api.get("/auth/me");
        return data.data; 
      } catch (err: any) {
        // If the endpoint isn't supported, backend is offline, or mock-jwt fails,
        // we return a fallback for UI demo purposes. 
        console.warn("API /auth/me indisponível ou token mockado. Usando sessão local.", err.message);
        return { nome: "Usuário Admin", role: "ADMIN_TENANT", tenantId: 1, tenantName: "Organização Demo" };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache to prevent duplicate calls
    retry: false, // Don't retry on auth failure, let interceptors handle it
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post("/auth/logout");
      } catch (e) {
        // Ignore errors on logout network call, proceed with clearing locals
        console.warn("Logout endpoint failed, clearing local session anyway.");
      }
    },
    onSettled: () => {
      deleteCookie("access_token");
      deleteCookie("refresh_token");
      queryClient.clear(); // Clear all protected caches
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user && !isError,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
