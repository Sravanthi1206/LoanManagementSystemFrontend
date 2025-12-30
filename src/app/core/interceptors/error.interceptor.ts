import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Translates technical error messages into customer-friendly messages
 */
function getCustomerFriendlyMessage(error: HttpErrorResponse): string {
  // Check for validation errors (array of messages)
  if (error.error?.errors && Array.isArray(error.error.errors)) {
    return error.error.errors.map((e: any) => e.defaultMessage || e.message || e).join('. ');
  }

  // Check for single message in error response
  if (error.error?.message) {
    const msg = error.error.message;
    // Translate common technical messages
    if (msg.includes('type is required')) return 'Please select a loan type.';
    if (msg.includes('amount is required')) return 'Please enter the loan amount.';
    if (msg.includes('tenure is required')) return 'Please enter the loan tenure.';
    if (msg.includes('purpose is required')) return 'Please describe the purpose of the loan.';
    if (msg.includes('employment type is required')) return 'Please select your employment type.';
    if (msg.includes('income is required')) return 'Please enter your income details.';
    if (msg.includes('Minimum loan amount')) return 'Loan amount must be at least ₹10,000.';
    if (msg.includes('Maximum loan amount')) return 'Loan amount cannot exceed ₹1,00,00,000.';
    if (msg.includes('Minimum tenure')) return 'Tenure must be at least 6 months.';
    if (msg.includes('Maximum tenure')) return 'Tenure cannot exceed 360 months (30 years).';
    if (msg.includes('Minimum monthly income')) return 'Monthly income must be at least ₹10,000.';
    if (msg.includes('Minimum annual income')) return 'Annual income must be at least ₹1,20,000.';
    if (msg.includes('Purpose must be')) return 'Please provide more details about the loan purpose (at least 10 characters).';
    return msg;
  }

  return '';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authState = inject(AuthStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Something went wrong. Please try again.';

      if (error.error instanceof ErrorEvent) {
        // Client-side/network error
        errorMessage = 'Unable to connect. Please check your internet connection.';
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to the server. Please check if the application is running.';
            break;
          case 400:
            // Bad Request - validation errors
            const friendlyMessage = getCustomerFriendlyMessage(error);
            errorMessage = friendlyMessage || 'Please check your input and try again.';
            break;
          case 401:
            const token = authState.getToken();
            if (!token) {
              authState.clearAuth();
              router.navigate(['/auth/login']);
              errorMessage = 'Please log in to continue.';
            } else {
              errorMessage = 'Your session has expired. Please log in again.';
              authState.clearAuth();
              router.navigate(['/auth/login']);
            }
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'The requested information could not be found.';
            break;
          case 409:
            errorMessage = getCustomerFriendlyMessage(error) || 'This action conflicts with existing data.';
            break;
          case 422:
            errorMessage = getCustomerFriendlyMessage(error) || 'Please verify your information and try again.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Our servers are temporarily unavailable. Please try again in a few minutes.';
            break;
          default:
            const customMessage = getCustomerFriendlyMessage(error);
            errorMessage = customMessage || 'An unexpected error occurred. Please try again.';
        }
      }

      console.error('HTTP Error:', errorMessage, error);

      return throwError(() => ({
        message: errorMessage,
        status: error.status,
        originalError: error
      }));
    })
  );
};
