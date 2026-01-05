import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Loan,
  LoanApplicationRequest,
  EmiSchedule,
  Payment,
  WalletBalance,
  PageResponse
} from '../../../shared/types/models';

@Injectable({
  providedIn: 'root'
})
export class LoanApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Loan Application APIs
  applyLoan(request: LoanApplicationRequest): Observable<{ loanId: number }> {
    return this.http.post<{ loanId: number }>(`${this.apiUrl}/loans/apply`, request);
  }

  getMyLoans(userId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.apiUrl}/loans/my-loans?userId=${userId}`);
  }

  getLoanById(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/loans/${id}`);
  }

  withdrawLoan(id: number, userId: number): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/loans/${id}/withdraw`, {}, {
      headers: { 'X-User-Id': userId.toString() }
    });
  }

  // EMI APIs
  calculateEmi(principal: number, rate: number, tenure: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/emi/calculate`, {
      principalAmount: principal,
      annualInterestRate: rate,
      tenureMonths: tenure
    });
  }

  getEmiSchedule(loanId: number): Observable<EmiSchedule[]> {
    return this.http.get<EmiSchedule[]>(`${this.apiUrl}/emi/schedule/${loanId}`);
  }

  getUpcomingEmis(userId: number): Observable<EmiSchedule[]> {
    return this.http.get<EmiSchedule[]>(`${this.apiUrl}/emi/upcoming/${userId}`);
  }

  // Payment APIs
  repayLoan(data: any): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/repay`, data);
  }

  getPaymentsByLoan(loanId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/payments/loan/${loanId}`);
  }

  getPaymentsByUser(userId: number, page: number = 0, size: number = 10): Observable<PageResponse<Payment>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<Payment>>(`${this.apiUrl}/payments/user/${userId}`, { params });
  }

  // Wallet APIs
  getWalletBalance(userId: number): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.apiUrl}/wallet/balance?userId=${userId}`);
  }

  getWalletTransactions(page: number = 0, size: number = 20): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<any>>(`${this.apiUrl}/wallet/transactions`, { params });
  }

  // Document APIs
  uploadDocument(applicationId: number, documentType: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return this.http.post(`${this.apiUrl}/loans/${applicationId}/documents`, formData);
  }

  getDocuments(applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/loans/${applicationId}/documents`);
  }

  // Notification APIs
  getNotifications(userId: number): Observable<PageResponse<any>> {
    return this.http.get<PageResponse<any>>(`${this.apiUrl}/notifications/user/${userId}`);
  }

  getUnreadNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/user/${userId}/unread`);
  }

  markNotificationAsRead(id: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  // Profile APIs
  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/profile`);
  }

  updateUserProfile(userId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${userId}`, data);
  }
}
