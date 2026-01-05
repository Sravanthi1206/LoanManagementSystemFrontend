// Shared Types and Interfaces

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    panCard?: string;
    role: UserRole;
    active: boolean;
    enabled?: boolean;
    passwordChangeRequired?: boolean;
    createdAt?: string;
}

export type UserRole = 'CUSTOMER' | 'LOAN_OFFICER' | 'ADMIN' | 'ROOT_ADMIN';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth?: string;
    panCard?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    user: User;
}

export interface Loan {
    loanId: number;
    userId: number;
    type: LoanType;
    amountRequested: number;
    amountApproved?: number;
    interestRate?: number;
    tenureMonths?: number;
    status: LoanStatus;
    appliedOn: string;
    approvedOn?: string;
    remarks?: string;
    creditScore?: number;
    purpose?: string;
    employmentType?: string;
    monthlyIncome?: number;
    annualIncome?: number;
    employerName?: string;
    existingLoans?: boolean;
    riskCategory?: string;
    assignedOfficerId?: number;
    assignedOfficerName?: string;  // For displaying officer name
}

export type LoanType = 'HOME_LOAN' | 'PERSONAL_LOAN' | 'CAR_LOAN' | 'EDUCATION_LOAN' | 'BUSINESS_LOAN';

export type LoanStatus = 'APPLIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED' | 'WITHDRAWN';

export interface LoanApplicationRequest {
    userId: number;
    type: LoanType;
    amountRequested: number;
    purpose: string;
    tenureMonths: number;
    employmentType: string;
    monthlyIncome: number;
    existingLoans: number;
}

export interface EmiSchedule {
    id: number;
    loanId: number;
    installmentNo: number;
    dueDate: string;
    totalEmi: number;
    principalAmount: number;
    interestAmount: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE';
    paidDate?: string;
}

export interface Payment {
    id: number;
    loanId: number;
    userId: number;
    amount: number;
    paymentType: 'DISBURSEMENT' | 'REPAYMENT';
    paymentDate: string;
    transactionId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

export interface Notification {
    id: string;
    userId: number;
    type: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export interface WalletBalance {
    userId: number;
    balance: number;
    lastUpdated: string;
}

export interface DashboardStats {
    totalLoans: number;
    appliedLoans: number;
    underReviewLoans: number;
    approvedLoans: number;
    rejectedLoans: number;
    disbursedLoans: number;
    activeLoans: number;
    closedLoans: number;
    totalDisbursedAmount: number;
    loansByType: { [key: string]: number };
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}
