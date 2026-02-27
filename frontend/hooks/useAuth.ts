'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { setTokens, clearTokens, type User } from '@/lib/auth';

type AuthResponse = {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};

async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    token: null,
  });
  return data;
}

async function fetchMe(token: string | null): Promise<User | null> {
  if (!token) return null;
  try {
    const data = await apiRequest<{ user: User }>('/api/auth/me', { token });
    return data.user;
  } catch {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('gigmatch_refresh') : null;
    if (refresh) {
      const refreshed = await refreshToken(refresh);
      setTokens(refreshed.accessToken, refreshed.refreshToken);
      return refreshed.user;
    }
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: () => {
      const t = typeof window !== 'undefined' ? localStorage.getItem('gigmatch_access') : null;
      return fetchMe(t);
    },
    staleTime: 5 * 60 * 1000,
    enabled: typeof window !== 'undefined',
  });

  const logout = () => {
    clearTokens();
    queryClient.setQueryData(['auth'], null);
    router.push('/');
  };

  return { user: user ?? null, isLoading, logout };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const data = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        token: null,
      });
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['auth'], data.user);
      router.push('/dashboard');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (body: { email: string; password: string; role: 'MUSICIAN' | 'VENUE' }) => {
      const data = await apiRequest<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
        token: null,
      });
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['auth'], data.user);
      router.push('/dashboard');
    },
  });
}
