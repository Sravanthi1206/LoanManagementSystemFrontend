import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest, RegisterRequest, LoginResponse } from '../../../shared/types/models';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.authState.setAuth(response.accessToken, response.user);

        if (response.user.passwordChangeRequired) {
          this.router.navigate(['/auth/change-password']);
          return;
        }

        this.redirectToDashboard(response.user.role);
      })
    );
  }

  register(userData: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        this.authState.setAuth(response.accessToken, response.user);
        this.router.navigate(['/customer/dashboard']);
      })
    );
  }

  changePassword(userId: number, data: any): Observable<void> {
    const headers = new HttpHeaders().set('X-User-Id', userId.toString());
    return this.http.post<void>(`${this.apiUrl}/change-password`, data, { headers });
  }

  logout(): void {
    this.authState.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'CUSTOMER':
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'LOAN_OFFICER':
        this.router.navigate(['/officer/dashboard']);
        break;
      case 'ADMIN':
      case 'ROOT_ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/auth/login']);
    }
  }
}
