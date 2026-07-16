'use client';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  initials: string;
  isSuperUser?: boolean;
  actualRole?: string;
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

// Role permission checks
export function canEdit(user: AuthUser | null): boolean {
  if (!user) return false;
  return ['Procurement Lead', 'Procurement Officer', 'Procurement Manager'].includes(user.role);
}

export function canApprove(user: AuthUser | null): boolean {
  if (!user) return false;
  return ['Procurement Manager'].includes(user.role);
}

export function isManager(user: AuthUser | null): boolean {
  if (!user) return false;
  return ['Procurement Manager', 'Procurement Lead'].includes(user.role);
}
