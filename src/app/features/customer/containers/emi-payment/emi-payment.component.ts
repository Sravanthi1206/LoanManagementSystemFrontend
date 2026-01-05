import { Component, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { EmiSchedule } from '../../../../shared/types/models';

@Component({
  selector: 'app-emi-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './emi-payment.component.html',
  styleUrl: './emi-payment.component.css'
})
export class EmiPaymentComponent {
  private fb = inject(FormBuilder);
  private loanApi = inject(LoanApiService);

  private authState = inject(AuthStateService);

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

      const currentUser = this.authState.getUser();
      if (!currentUser) {
        this.loading.set(false);
        this.errorMessage.set('User not authenticated');
        return;
      }

      const paymentData = {
        loanId: this.emi()!.loanId,
        userId: currentUser.id,
        amount: this.emi()!.totalEmi,
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
