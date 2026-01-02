import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanApiService } from '../../services/loan-api.service';
import { EmiSchedule } from '../../../../shared/types/models';

@Component({
  selector: 'app-emi-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Pay EMI</h5>
            <button type="button" class="btn-close" (click)="close()"></button>
          </div>
          <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div *ngIf="emi()" class="mb-3">
                <div class="card bg-light">
                  <div class="card-body">
                    <h6>EMI Details</h6>
                    <p class="mb-1"><strong>Loan ID:</strong> #{{ emi()!.loanId }}</p>
                    <p class="mb-1"><strong>Installment:</strong> {{ emi()!.installmentNumber }}</p>
                    <p class="mb-1"><strong>Due Date:</strong> {{ emi()!.dueDate | date }}</p>
                    <p class="mb-0"><strong>Amount:</strong> ₹{{ emi()!.amount | number }}</p>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Payment Method</label>
                <select class="form-control" formControlName="paymentMethod">
                  <option value="WALLET">Wallet</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Debit/Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div class="mb-3" *ngIf="paymentForm.get('paymentMethod')?.value === 'UPI'">
                <label class="form-label">UPI ID</label>
                <input type="text" class="form-control" formControlName="upiId" 
                       placeholder="yourname@upi">
              </div>

              <div *ngIf="errorMessage()" class="alert alert-danger">
                {{ errorMessage() }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn btn-success" [disabled]="paymentForm.invalid || loading()">
                <span *ngIf="!loading()">Pay ₹{{ emi()?.amount | number }}</span>
                <span *ngIf="loading()">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
    }
    .modal-dialog {
      max-width: 500px;
      width: 90%;
    }
    .modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #dee2e6;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  `]
})
export class EmiPaymentComponent {
  private fb = inject(FormBuilder);
  private loanApi = inject(LoanApiService);

  isOpen = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  emi = signal<EmiSchedule | null>(null);
  onSuccess?: () => void;

  paymentForm: FormGroup;

  constructor() {
    this.paymentForm = this.fb.group({
      paymentMethod: ['WALLET', Validators.required],
      upiId: ['']
    });
  }

  open(emi: EmiSchedule, onSuccess?: () => void): void {
    this.isOpen.set(true);
    this.emi.set(emi);
    this.onSuccess = onSuccess;
    this.paymentForm.reset({ paymentMethod: 'WALLET' });
    this.errorMessage.set('');
  }

  close(): void {
    this.isOpen.set(false);
    this.emi.set(null);
  }

  onSubmit(): void {
    if (this.paymentForm.valid && this.emi()) {
      this.loading.set(true);
      this.errorMessage.set('');

      const paymentData = {
        loanId: this.emi()!.loanId,
        userId: this.emi()!.userId,
        amount: this.emi()!.amount,
        emiId: this.emi()!.id,
        paymentMethod: this.paymentForm.get('paymentMethod')?.value
      };

      this.loanApi.repayLoan(paymentData).subscribe({
        next: () => {
          this.loading.set(false);
          alert('Payment successful!');
          this.close();
          if (this.onSuccess) this.onSuccess();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.message || 'Payment failed');
        }
      });
    }
  }
}
