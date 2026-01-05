import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanApiService } from '../../../features/customer/services/loan-api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { Notification } from '../../types/models';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <!-- Notification Bell -->
      <div class="notification-wrapper" (click)="toggleNotifications()">
        <span class="notification-bell">🔔</span>
        <span *ngIf="unreadCount() > 0" class="notification-badge">{{ unreadCount() }}</span>
      </div>

      <!-- Notification Dropdown -->
      <div class="notification-dropdown" *ngIf="showNotifications()" (click)="$event.stopPropagation()">
        <div class="notification-header">
          <strong>Notifications</strong>
          <button class="btn-close-small" (click)="showNotifications.set(false)">✕</button>
        </div>
        <div class="notification-list">
          <div *ngIf="notifications().length === 0" class="notification-empty">
            No notifications
          </div>
          <div *ngFor="let notif of notifications()" 
               class="notification-item" 
               [class.unread]="!notif.read"
               (click)="markAsRead(notif)">
            <div class="notification-subject">{{ notif.subject }}</div>
            <div class="notification-message">{{ notif.message }}</div>
            <div class="notification-time">{{ notif.createdAt | date: 'short' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: relative;
    }
    .notification-wrapper {
      cursor: pointer;
      font-size: 1.25rem;
      position: relative;
    }
    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 0.65rem;
      font-weight: bold;
      min-width: 18px;
      text-align: center;
    }
    .notification-dropdown {
      position: absolute;
      top: 40px;
      right: 0;
      width: 320px;
      max-height: 400px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }
    .btn-close-small {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: #666;
    }
    .btn-close-small:hover {
      color: #333;
    }
    .notification-list {
      max-height: 340px;
      overflow-y: auto;
    }
    .notification-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
    }
    .notification-item:hover {
      background: #f8f9fa;
    }
    .notification-item.unread {
      background: #e7f3ff;
      border-left: 3px solid #007bff;
    }
    .notification-subject {
      font-weight: 600;
      font-size: 0.9rem;
      color: #333;
    }
    .notification-message {
      font-size: 0.85rem;
      color: #666;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .notification-time {
      font-size: 0.75rem;
      color: #999;
      margin-top: 4px;
    }
    .notification-empty {
      padding: 24px;
      text-align: center;
      color: #999;
    }
  `]
})
export class NotificationDropdownComponent implements OnInit {
  private loanApi = inject(LoanApiService);
  private authState = inject(AuthStateService);

  showNotifications = signal(false);
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const user = this.authState.getUser();
    if (user) {
      this.loanApi.getUnreadNotifications(user.id).subscribe({
        next: (notifs: Notification[]) => {
          this.notifications.set(notifs);
          this.unreadCount.set(notifs.filter((n: Notification) => !n.read).length);
        },
        error: () => this.notifications.set([])
      });
    }
  }

  toggleNotifications(): void {
    this.showNotifications.set(!this.showNotifications());
  }

  markAsRead(notif: Notification): void {
    if (!notif.read) {
      this.loanApi.markNotificationAsRead(notif.id).subscribe({
        next: () => {
          notif.read = true;
          this.unreadCount.set(Math.max(0, this.unreadCount() - 1));
        }
      });
    }
  }
}
