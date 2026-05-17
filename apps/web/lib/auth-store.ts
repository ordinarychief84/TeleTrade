'use client';

import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
