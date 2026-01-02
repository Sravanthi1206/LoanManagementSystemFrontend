import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoanApiService } from '../../services/loan-api.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';

@Component({
  selector: 'app-create-service-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Apply for Loan</h5>
            <button type="button" class="btn-close" (click)="close()">&times;</button>
          </div>
          
          <!-- Success State -->
          <div *ngIf="successMessage()" class="modal-body text-center py-5">
            <div class="success-icon mb-3">✓</div>
            <h4 class="text-success mb-3">Application Submitted!</h4>
            <p class="text-muted mb-4">{{ successMessage() }}</p>
            <button type="button" class="btn btn-primary" (click)="close()">Done</button>
          </div>

          <!-- Form State -->
          <form *ngIf="!successMessage()" [formGroup]="loanForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <!-- Loan Type -->
              <div class="mb-3">
                <label class="form-label">Loan Type <span class="text-danger">*</span></label>
                <select class="form-control" formControlName="type" 
                        [class.is-invalid]="isFieldInvalid('type')">
                  <option value="">Select loan type</option>
                  <option value="HOME">Home Loan</option>
                  <option value="PERSONAL">Personal Loan</option>
                  <option value="VEHICLE">Vehicle Loan</option>
                  <option value="EDUCATION">Education Loan</option>
                  <option value="BUSINESS">Business Loan</option>
                </select>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('type')">
                  Please select a loan type
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label class="form-label">Loan Amount (₹) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" formControlName="amount" 
                       placeholder="Minimum ₹10,000"
                       [class.is-invalid]="isFieldInvalid('amount')">
                <div class="invalid-feedback" *ngIf="isFieldInvalid('amount')">
                  <span *ngIf="loanForm.get('amount')?.errors?.['required']">Please enter the loan amount</span>
                  <span *ngIf="loanForm.get('amount')?.errors?.['min']">Minimum loan amount is ₹10,000</span>
                </div>
              </div>

              <!-- Tenure -->
              <div class="mb-3">
                <label class="form-label">Tenure (Months) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" formControlName="tenure" 
                       placeholder="6 to 360 months"
                       [class.is-invalid]="isFieldInvalid('tenure')">
                <div class="invalid-feedback" *ngIf="isFieldInvalid('tenure')">
                  <span *ngIf="loanForm.get('tenure')?.errors?.['required']">Please enter the loan tenure</span>
                  <span *ngIf="loanForm.get('tenure')?.errors?.['min']">Minimum tenure is 6 months</span>
                  <span *ngIf="loanForm.get('tenure')?.errors?.['max']">Maximum tenure is 360 months</span>
                </div>
              </div>

              <!-- Purpose -->
              <div class="mb-3">
                <label class="form-label">Purpose <span class="text-danger">*</span></label>
                <textarea class="form-control" formControlName="purpose" rows="2"
                          placeholder="Briefly describe why you need this loan"
                          [class.is-invalid]="isFieldInvalid('purpose')"></textarea>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('purpose')">
                  <span *ngIf="loanForm.get('purpose')?.errors?.['required']">Please describe the loan purpose</span>
                  <span *ngIf="loanForm.get('purpose')?.errors?.['minlength']">Please provide at least 10 characters</span>
                </div>
              </div>

              <!-- Employment Type -->
              <div class="mb-3">
                <label class="form-label">Employment Type <span class="text-danger">*</span></label>
                <select class="form-control" formControlName="employmentType"
                        [class.is-invalid]="isFieldInvalid('employmentType')">
                  <option value="">Select employment type</option>
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED">Self Employed</option>
                  <option value="BUSINESS">Business Owner</option>
                </select>
                <div class="invalid-feedback" *ngIf="isFieldInvalid('employmentType')">
                  Please select your employment type
                </div>
              </div>

              <!-- Monthly Income -->
              <div class="mb-3">
                <label class="form-label">Monthly Income (₹) <span class="text-danger">*</span></label>
                <input type="number" class="form-control" formControlName="monthlyIncome" 
                       placeholder="Minimum ₹10,000"
                       [class.is-invalid]="isFieldInvalid('monthlyIncome')">
                <div class="invalid-feedback" *ngIf="isFieldInvalid('monthlyIncome')">
                  <span *ngIf="loanForm.get('monthlyIncome')?.errors?.['required']">Please enter your monthly income</span>
                  <span *ngIf="loanForm.get('monthlyIncome')?.errors?.['min']">Monthly income must be at least ₹10,000</span>
                </div>
              </div>

              <!-- Existing Loans -->
              <div class="mb-3">
                <label class="form-label">Do you have any existing loans?</label>
                <select class="form-control" formControlName="existingLoans">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Yes</option>
                </select>
              </div>

              <!-- EMI Calculator Result -->
              <div *ngIf="calculatedEmi()" class="alert alert-info">
                <strong>Estimated Monthly EMI:</strong> ₹{{ calculatedEmi() | number:'1.0-0' }}
                <button type="button" class="btn btn-sm btn-link p-0 ms-2" (click)="calculateEmi()">
                  Recalculate
                </button>
              </div>

              <!-- Error Message -->
              <div *ngIf="errorMessage()" class="alert alert-danger">
                {{ errorMessage() }}
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="close()">Cancel</button>
              <button type="button" class="btn btn-outline-primary me-2" (click)="calculateEmi()" 
                      [disabled]="!canCalculateEmi()">
                Calculate EMI
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="loading()">
                <span *ngIf="!loading()">Submit Application</span>
                <span *ngIf="loading()">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
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
      max-width: 550px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title {
      margin: 0;
      font-weight: 600;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
      line-height: 1;
    }
    .btn-close:hover {
      color: #000;
    }
    .form-label {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    .text-danger {
      color: #dc3545;
    }
    .invalid-feedback {
      display: block;
      font-size: 0.875rem;
    }
    .is-invalid {
      border-color: #dc3545 !important;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #28a745;
      color: white;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .text-success {
      color: #28a745;
    }
  `]
})
export class CreateServiceRequestComponent {
  private fb = inject(FormBuilder);
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  isOpen = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  calculatedEmi = signal<number | null>(null);
  onSuccess?: () => void;
  formSubmitted = false;

  loanForm: FormGroup;

  constructor() {
    this.loanForm = this.fb.group({
      type: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(10000)]],
      tenure: ['', [Validators.required, Validators.min(6), Validators.max(360)]],
      purpose: ['', [Validators.required, Validators.minLength(10)]],
      employmentType: ['', Validators.required],
      monthlyIncome: ['', [Validators.required, Validators.min(10000)]],
      existingLoans: [false]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loanForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || this.formSubmitted));
  }

  open(onSuccess?: () => void): void {
    this.isOpen.set(true);
    this.onSuccess = onSuccess;
    this.formSubmitted = false;
    this.loanForm.reset({ existingLoans: false });
    this.calculatedEmi.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  close(): void {
    const hadSuccess = !!this.successMessage();
    this.isOpen.set(false);
    this.loanForm.reset();
    this.formSubmitted = false;
    this.successMessage.set('');
    if (hadSuccess && this.onSuccess) {
      this.onSuccess();
    }
  }

  canCalculateEmi(): boolean {
    return !!(this.loanForm.get('amount')?.value && this.loanForm.get('tenure')?.value);
  }

  calculateEmi(): void {
    const amount = this.loanForm.get('amount')?.value;
    const tenure = this.loanForm.get('tenure')?.value;

    if (amount && tenure) {
      const type = this.loanForm.get('type')?.value;
      const rates: { [key: string]: number } = {
        'HOME': 8.5,
        'PERSONAL': 12.0,
        'VEHICLE': 9.5,
        'EDUCATION': 10.0,
        'BUSINESS': 11.0
      };
      const rate = rates[type] || 10.0;

      this.loanApi.calculateEmi(amount, rate, tenure).subscribe({
        next: (response) => {
          this.calculatedEmi.set(response.monthlyEmi);
        },
        error: () => { }
      });
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage.set('');

    if (this.loanForm.invalid) {
      Object.keys(this.loanForm.controls).forEach(key => {
        this.loanForm.get(key)?.markAsTouched();
      });
      this.errorMessage.set('Please fill in all required fields correctly.');
      return;
    }

    this.loading.set(true);

    const user = this.authState.getUser();
    if (!user) {
      this.errorMessage.set('Please log in to apply for a loan.');
      this.loading.set(false);
      return;
    }

    const formValue = this.loanForm.value;
    const request = {
      userId: user.id,
      ...formValue,
      // Auto-calculate annual income from monthly income (required by backend)
      annualIncome: formValue.monthlyIncome * 12
    };

    this.loanApi.applyLoan(request).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(`Your loan application #${response.loanId} has been submitted successfully. We will review it and get back to you soon.`);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Unable to submit your application. Please try again.');
      }
    });
  }
}
