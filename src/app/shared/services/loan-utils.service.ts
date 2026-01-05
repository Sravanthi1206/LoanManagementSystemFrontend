import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoanUtilsService {

    getLoanTypeDisplay(type: string | undefined): string {
        if (!type) return '';
        const types: { [key: string]: string } = {
            'HOME': 'Home Loan',
            'PERSONAL': 'Personal Loan',
            'VEHICLE': 'Vehicle Loan',
            'EDUCATION': 'Education Loan',
            'BUSINESS': 'Business Loan',
            'HOME_LOAN': 'Home Loan',
            'PERSONAL_LOAN': 'Personal Loan',
            'CAR_LOAN': 'Vehicle Loan',
            'EDUCATION_LOAN': 'Education Loan',
            'BUSINESS_LOAN': 'Business Loan'
        };
        return types[type] || type;
    }

    getStatusDisplay(status: string | undefined): string {
        if (!status) return '';
        const displays: { [key: string]: string } = {
            'APPLIED': 'Applied',
            'UNDER_REVIEW': 'Under Review',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'DISBURSED': 'Disbursed',
            'CLOSED': 'Closed',
            'WITHDRAWN': 'Withdrawn',
            'PENDING': 'Pending',
            'PAID': 'Paid',
            'OVERDUE': 'Overdue'
        };
        return displays[status] || status;
    }

    getStatusBadgeClass(status: string | undefined): string {
        if (!status) return 'bg-secondary';
        const classes: { [key: string]: string } = {
            'APPLIED': 'bg-info',
            'UNDER_REVIEW': 'bg-warning',
            'APPROVED': 'bg-success',
            'REJECTED': 'bg-danger',
            'DISBURSED': 'bg-success',
            'CLOSED': 'bg-secondary',
            'WITHDRAWN': 'bg-secondary',
            'PENDING': 'bg-warning',
            'PAID': 'bg-success',
            'OVERDUE': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    formatCurrency(amount: number | undefined): string {
        if (amount === undefined || amount === null) return '₹0';
        return '₹' + amount.toLocaleString('en-IN');
    }
}
