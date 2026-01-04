import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, DashboardStats, PageResponse } from '../../../shared/types/models';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Dashboard APIs
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getLoansByType(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/dashboard/loans-by-type`);
  }

  // User Management APIs
  getAllUsers(page: number = 0, size: number = 100): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,desc');
    return this.http.get<PageResponse<User>>(`${this.apiUrl}/users`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  createStaffAccount(data: any): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/admin/users`, data);
  }

  deactivateUser(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/deactivate`, {});
  }

  activateUser(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/activate`, {});
  }

  // Payment APIs
  recordDisbursement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/disburse`, data);
  }

  // Notification APIs
  sendNotification(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications/send`, data);
  }
}
