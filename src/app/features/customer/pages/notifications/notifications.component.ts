import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Notification {
    id: number;
    userId: number;
    loanId?: number;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.apiUrl;

    notifications = signal<Notification[]>([]);
    loading = signal(true);
    filter = signal<'all' | 'unread'>('all');

    ngOnInit(): void {
        this.loadNotifications();
    }

    loadNotifications(): void {
        this.loading.set(true);
        this.http.get<any>(`${this.apiUrl}/notifications`).subscribe({
            next: (response) => {
                const data = response.content || response || [];
                this.notifications.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.notifications.set([]);
                this.loading.set(false);
            }
        });
    }

    filteredNotifications(): Notification[] {
        if (this.filter() === 'unread') {
            return this.notifications().filter(n => !n.read);
        }
        return this.notifications();
    }

    unreadCount(): number {
        return this.notifications().filter(n => !n.read).length;
    }

    markAsRead(notification: Notification): void {
        if (notification.read) return;

        this.http.put(`${this.apiUrl}/notifications/${notification.id}/read`, {}).subscribe({
            next: () => {
                notification.read = true;
                this.notifications.set([...this.notifications()]);
            }
        });
    }

    markAllAsRead(): void {
        this.http.put(`${this.apiUrl}/notifications/read-all`, {}).subscribe({
            next: () => {
                this.notifications.set(
                    this.notifications().map(n => ({ ...n, read: true }))
                );
            }
        });
    }

    getTypeIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'LOAN_APPLIED': '📝',
            'LOAN_APPROVED': '✅',
            'LOAN_REJECTED': '❌',
            'LOAN_DISBURSED': '💰',
            'EMI_DUE': '⏰',
            'EMI_PAID': '💸',
            'WALLET_TOPUP': '💳',
            'WALLET_DEBIT': '📤',
            'SYSTEM': '🔔'
        };
        return icons[type] || '📬';
    }

    getTypeLabel(type: string): string {
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    goBack(): void {
        this.router.navigate(['/customer/dashboard']);
    }
}
