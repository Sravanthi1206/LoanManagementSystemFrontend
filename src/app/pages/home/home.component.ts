import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent {
    private authState = inject(AuthStateService);

    isLoggedIn(): boolean {
        return !!this.authState.getToken();
    }

    getDashboardLink(): string {
        const user = this.authState.getUser();
        if (!user) return '/auth/login';

        switch (user.role) {
            case 'ADMIN':
            case 'ROOT_ADMIN':
                return '/admin/dashboard';
            case 'LOAN_OFFICER':
                return '/officer/dashboard';
            case 'CUSTOMER':
                return '/customer/dashboard';
            default:
                return '/auth/login';
        }
    }

    loanProducts = [
        {
            icon: '🏠',
            title: 'Home Loan',
            rate: '8.5%',
            description: 'Fulfill your dream of owning a home',
            maxAmount: '₹1 Crore'
        },
        {
            icon: '👤',
            title: 'Personal Loan',
            rate: '10.5%',
            description: 'Quick funds for your personal needs',
            maxAmount: '₹10 Lakh'
        },
        {
            icon: '🚗',
            title: 'Vehicle Loan',
            rate: '9.5%',
            description: 'Drive your dream car today',
            maxAmount: '₹50 Lakh'
        },
        {
            icon: '🎓',
            title: 'Education Loan',
            rate: '10%',
            description: 'Invest in your future education',
            maxAmount: '₹30 Lakh'
        },
        {
            icon: '💼',
            title: 'Business Loan',
            rate: '11%',
            description: 'Grow your business with ease',
            maxAmount: '₹50 Lakh'
        }
    ];

    features = [
        {
            icon: '⚡',
            title: 'Instant Approval',
            description: 'Get your loan approved within 24 hours with minimal documentation'
        },
        {
            icon: '🔒',
            title: 'Safe & Secure',
            description: 'Your data is protected with bank-grade security measures'
        },
        {
            icon: '📊',
            title: 'Compare & Choose',
            description: 'Compare different loan options and choose the best for you'
        },
        {
            icon: '💯',
            title: 'Transparent Process',
            description: 'No hidden charges, complete transparency in all dealings'
        }
    ];

    stats = [
        { value: '₹500Cr+', label: 'Loans Disbursed' },
        { value: '50,000+', label: 'Happy Customers' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.8★', label: 'Customer Rating' }
    ];
}
