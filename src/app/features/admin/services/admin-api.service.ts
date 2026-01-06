import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User, DashboardStats, PageResponse, Loan } from '../../../shared/types/models';

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

  getLoansByStatus(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/dashboard/loans-by-status`);
  }

  getTotalDisbursed(): Observable<{ totalDisbursed: number }> {
    return this.http.get<{ totalDisbursed: number }>(`${this.apiUrl}/dashboard/total-disbursed`);
  }

  // User Management APIs
  getAllUsers(page: number = 0, size: number = 100): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'id,desc');
    return this.http.get<PageResponse<User>>(`${this.apiUrl}/users`, { params });
  }

  searchUsers(query: string, page: number = 0, size: number = 20): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<User>>(`${this.apiUrl}/users/search`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  getLoansByUserId(userId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/loans/user/${userId}`);
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

  // ============ Loan Admin APIs ============

  getAllLoans(page: number = 0, size: number = 20): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin`, { params });
  }

  getLoansUnderReview(page: number = 0, size: number = 20): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/under-review`, { params });
  }

  reassignLoan(loanId: number, officerId: number): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/reassign/${officerId}`, {});
  }

  releaseLoan(loanId: number): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/release`, {});
  }

  getOfficerPendingCount(officerId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/loans/admin/officer/${officerId}/pending-count`);
  }

  getOfficerUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users/officers`);
  }

  // ============ ROOT_ADMIN APIs ============

  getPendingAdminApprovals(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/pending-approvals`);
  }

  approveAdmin(userId: number): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/approve/${userId}`, {});
  }

  rejectAdmin(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/reject/${userId}`);
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
