import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { LoanUtilsService } from '../../../../shared/services/loan-utils.service';
import { User, Loan } from '../../../../shared/types/models';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-details.component.html',
    styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private adminApi = inject(AdminApiService);
    protected loanUtils = inject(LoanUtilsService);

    user = signal<User | null>(null);
    userLoans = signal<Loan[]>([]);
    loading = signal(true);
    loadingLoans = signal(true);
    errorMessage = signal('');

    ngOnInit(): void {
        const userId = this.route.snapshot.paramMap.get('id');
        if (userId) {
            this.loadUserDetails(Number(userId));
        }
    }

    loadUserDetails(userId: number): void {
        this.loading.set(true);
        this.adminApi.getUserById(userId).subscribe({
            next: (user) => {
                this.user.set(user);
                this.loading.set(false);
                this.loadUserLoans(userId);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Failed to load user details');
            }
        });
    }

    loadUserLoans(userId: number): void {
        this.loadingLoans.set(true);
        this.adminApi.getLoansByUserId(userId).subscribe({
            next: (loans) => {
                this.userLoans.set(loans);
                this.loadingLoans.set(false);
            },
            error: () => {
                this.loadingLoans.set(false);
                this.userLoans.set([]);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/admin/dashboard']);
    }

    getRoleBadgeClass(role: string): string {
        switch (role) {
            case 'ADMIN': return 'bg-danger';
            case 'LOAN_OFFICER': return 'bg-primary';
            case 'CUSTOMER': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getTotalLoanAmount(): number {
        return this.userLoans().reduce((sum, loan) => sum + (loan.amountRequested || 0), 0);
    }

    getActiveLoanCount(): number {
        return this.userLoans().filter(l =>
            l.status === 'DISBURSED' || l.status === 'APPROVED'
        ).length;
    }
}
