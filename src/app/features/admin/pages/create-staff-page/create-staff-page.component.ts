import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
    selector: 'app-create-staff-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './create-staff-page.component.html',
    styleUrl: './create-staff-page.component.css'
})
export class CreateStaffPageComponent {
    private fb = inject(FormBuilder);
    private adminApi = inject(AdminApiService);
    private router = inject(Router);

    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    createStaffForm: FormGroup;

    constructor() {
        this.createStaffForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.createStaffForm.invalid) {
            Object.keys(this.createStaffForm.controls).forEach(key => {
                this.createStaffForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        this.adminApi.createStaffAccount(this.createStaffForm.value).subscribe({
            next: (response) => {
                this.loading.set(false);
                this.successMessage.set(`Staff account created successfully! User ID: ${response.id}`);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Failed to create staff account.');
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/dashboard']);
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.createStaffForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }
}
