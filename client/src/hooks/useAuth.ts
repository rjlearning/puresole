import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      // Try multi-auth first
      const res1 = await fetch('/api/auth/me', { credentials: 'include' });
      if (res1.ok) return await res1.json();

      // Fallback
      const res2 = await fetch('/api/auth/user', { credentials: 'include' });
      if (res2.ok) return await res2.json();

      return null;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth'], null);
    },
  });

  const user = data?.user || data;

  return {
    user,
    isLoading: isPending,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
  };
}
