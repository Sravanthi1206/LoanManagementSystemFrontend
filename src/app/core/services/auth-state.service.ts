import { Injectable, signal } from '@angular/core';
import { User, UserRole } from '../../shared/types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private state = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  // Public signals
  user = signal<User | null>(null);
  token = signal<string | null>(null);
  isAuthenticated = signal<boolean>(false);
  role = signal<UserRole | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.setAuth(token, user);
      } catch (e) {
        this.clearAuth();
      }
    }
  }

  setAuth(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    this.token.set(token);
    this.user.set(user);
    this.role.set(user.role);
    this.isAuthenticated.set(true);
  }

  clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.token.set(null);
    this.user.set(null);
    this.role.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return this.token();
  }

  getUser(): User | null {
    return this.user();
  }

  getRole(): UserRole | null {
    return this.role();
  }

  hasRole(role: UserRole): boolean {
    const currentRole = this.role();
    if (currentRole === role) return true;
    // ROOT_ADMIN has all ADMIN privileges
    if (currentRole === 'ROOT_ADMIN' && role === 'ADMIN') return true;
    return false;
  }

  isAdmin(): boolean {
    const role = this.role();
    return role === 'ADMIN' || role === 'ROOT_ADMIN';
  }
}
