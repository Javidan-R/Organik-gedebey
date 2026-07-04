// src/hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return data.users;
    },
  });
}