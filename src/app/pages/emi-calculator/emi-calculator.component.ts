import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-emi-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './emi-calculator.component.html',
    styleUrl: './emi-calculator.component.css'
})
export class EmiCalculatorComponent {
    // Form inputs
    loanAmount = signal(500000);
    interestRate = signal(10);
    tenure = signal(12);
    tenureType = signal<'months' | 'years'>('months');

    // Results
    monthlyEmi = signal(0);
    totalInterest = signal(0);
    totalPayment = signal(0);
    schedule = signal<EmiScheduleItem[]>([]);

    // UI state
    showSchedule = signal(false);

    constructor() {
        this.calculate();
    }

    onAmountChange(value: number): void {
        this.loanAmount.set(value);
        this.calculate();
    }

    onRateChange(value: number): void {
        this.interestRate.set(value);
        this.calculate();
    }

    onTenureChange(value: number): void {
        this.tenure.set(value);
        this.calculate();
    }

    toggleTenureType(): void {
        if (this.tenureType() === 'months') {
            this.tenureType.set('years');
            this.tenure.set(Math.round(this.tenure() / 12) || 1);
        } else {
            this.tenureType.set('months');
            this.tenure.set(this.tenure() * 12);
        }
        this.calculate();
    }

    calculate(): void {
        const principal = this.loanAmount();
        const annualRate = this.interestRate();
        const tenureMonths = this.tenureType() === 'years' ? this.tenure() * 12 : this.tenure();

        if (!principal || !annualRate || !tenureMonths || tenureMonths <= 0) {
            this.monthlyEmi.set(0);
            this.totalInterest.set(0);
            this.totalPayment.set(0);
            this.schedule.set([]);
            return;
        }

        const monthlyRate = annualRate / 12 / 100;
        const n = tenureMonths;

        // EMI formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
        let emi: number;
        if (monthlyRate === 0) {
            emi = principal / n;
        } else {
            emi = principal * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
        }

        const totalPay = emi * n;
        const totalInt = totalPay - principal;

        this.monthlyEmi.set(Math.round(emi));
        this.totalInterest.set(Math.round(totalInt));
        this.totalPayment.set(Math.round(totalPay));

        // Generate schedule
        this.generateSchedule(principal, monthlyRate, n, emi);
    }

    generateSchedule(principal: number, monthlyRate: number, months: number, emi: number): void {
        const items: EmiScheduleItem[] = [];
        let balance = principal;

        for (let i = 1; i <= months; i++) {
            const interest = balance * monthlyRate;
            const principalPaid = emi - interest;
            balance -= principalPaid;

            items.push({
                month: i,
                emi: Math.round(emi),
                principal: Math.round(principalPaid),
                interest: Math.round(interest),
                balance: Math.max(0, Math.round(balance))
            });
        }

        this.schedule.set(items);
    }

    toggleSchedule(): void {
        this.showSchedule.set(!this.showSchedule());
    }

    formatCurrency(value: number): string {
        if (value >= 10000000) {
            return '₹' + (value / 10000000).toFixed(2) + ' Cr';
        } else if (value >= 100000) {
            return '₹' + (value / 100000).toFixed(2) + ' L';
        }
        return '₹' + value.toLocaleString('en-IN');
    }
}

interface EmiScheduleItem {
    month: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
}
