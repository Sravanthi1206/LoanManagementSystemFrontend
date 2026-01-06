import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Loan, DashboardStats, PageResponse } from '../../../shared/types/models';

@Injectable({
  providedIn: 'root'
})
export class OfficerApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Dashboard APIs
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getLoansByStatus(): Observable<{ [key: string]: number }> {
    return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/dashboard/loans-by-status`);
  }

  getCustomerSummary(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/customer-summary/${userId}`);
  }

  getCustomerLoans(userId: number): Observable<PageResponse<Loan>> {
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/user/${userId}`);
  }

  // Loan Processing APIs
  getAllLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin`, { params });
  }

  getLoanById(loanId: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/loans/${loanId}`);
  }

  getPendingLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/pending`, { params });
  }

  getUnderReviewLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/under-review`, { params });
  }

  getApprovedLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/by-status/APPROVED`, { params });
  }

  // Officer-specific APIs
  getMyLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/my-loans`, { params });
  }

  getMyLoansByStatus(status: string, page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/my-loans/${status}`, { params });
  }

  getAvailableLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/available`, { params });
  }

  startReview(loanId: number, officerId: number): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/review`, {}, {
      headers: { 'X-User-Id': officerId.toString() }
    });
  }

  performCreditCheck(loanId: number, creditScore: number, remarks: string): Observable<Loan> {
    return this.http.post<Loan>(`${this.apiUrl}/loans/admin/${loanId}/credit-check`, {
      creditScore,
      remarks
    });
  }

  approveLoan(loanId: number, data: any): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/approve`, data);
  }

  rejectLoan(loanId: number, remarks: string): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/reject`, { remarks });
  }

  disburseLoan(loanId: number): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/admin/${loanId}/disburse`, {});
  }

  getRejectedLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/by-status/REJECTED`, { params });
  }

  getDisbursedLoans(page: number = 0, size: number = 10): Observable<PageResponse<Loan>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Loan>>(`${this.apiUrl}/loans/admin/by-status/DISBURSED`, { params });
  }
}
