'use client';
// src/lib/auth.ts — Auth context and hooks (localStorage-based for demo, Supabase-ready)

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  initials: string;
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('pt_user');
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pt_user', JSON.stringify(user));
}

export function clearUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pt_user');
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}

// Role checks
export function canEdit(user: AuthUser | null): boolean {
  return !!user && ['officer', 'manager', 'admin', 'Procurement Lead', 'Procurement Officer', 'Procurement Manager'].includes(user.role);
}

export function canApprove(user: AuthUser | null): boolean {
  return !!user && ['manager', 'admin', 'Procurement Manager'].includes(user.role);
}

export function isManager(user: AuthUser | null): boolean {
  return !!user && ['manager', 'admin', 'Procurement Manager', 'Procurement Lead'].includes(user.role);
}
