import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-create-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-staff.component.html',
  styleUrl: './create-staff.component.css'
})
export class CreateStaffComponent {
  private fb = inject(FormBuilder);
  private adminApi = inject(AdminApiService);

  isOpen = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  onSuccess?: () => void;

  staffForm: FormGroup;

  constructor() {
    this.staffForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      address: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  open(onSuccess?: () => void): void {
    this.isOpen.set(true);
    this.onSuccess = onSuccess;
    this.staffForm.reset();
    this.errorMessage.set('');
  }

  close(): void {
    this.isOpen.set(false);
    this.staffForm.reset();
  }

  onSubmit(): void {
    if (this.staffForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.adminApi.createStaffAccount(this.staffForm.value).subscribe({
        next: (response) => {
          this.loading.set(false);
          alert(`Staff account created successfully! User ID: ${response.id}`);
          this.close();
          if (this.onSuccess) this.onSuccess();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.message || 'Failed to create staff account');
        }
      });
    }
  }
}
