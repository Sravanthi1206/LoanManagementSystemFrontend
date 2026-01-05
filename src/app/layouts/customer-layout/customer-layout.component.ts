import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { NotificationDropdownComponent } from '../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, ConfirmationModalComponent, NotificationDropdownComponent],
  template: `
    <div class="layout-wrapper">
      <nav class="navbar navbar-customer">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <a class="navbar-brand" routerLink="/customer/dashboard">LMS • Customer Portal</a>
          <div class="d-flex align-items-center gap-3">
            <a routerLink="/customer/profile" class="nav-icon" title="My Profile">👤</a>
            <app-notification-dropdown></app-notification-dropdown>
            <button class="btn btn-outline-light btn-sm" (click)="initiateLogout()">Logout</button>
          </div>
        </div>
      </nav>
      <div class="container-fluid mt-4">
        <router-outlet></router-outlet>
      </div>
    
      <app-confirmation-modal
        [isOpen]="showLogoutModal"
        title="Logout"
        message="Are you sure you want to end your session?"
        (confirm)="onLogoutConfirm()"
        (cancel)="onLogoutCancel()">
      </app-confirmation-modal>
    </div>
  `,
  styles: [`
    .navbar-customer {
      background-color: #1a1a1a;
      padding: 1rem 1.5rem;
    }
    .navbar-customer .navbar-brand {
      color: white;
      font-weight: 600;
      font-size: 1.25rem;
      text-decoration: none;
    }
    .nav-icon {
      font-size: 1.25rem;
      text-decoration: none;
      cursor: pointer;
    }
    .nav-icon:hover {
      opacity: 0.8;
    }
  `]
})
export class CustomerLayoutComponent {
  showLogoutModal = false;

  initiateLogout(): void {
    this.showLogoutModal = true;
  }

  onLogoutConfirm(): void {
    localStorage.clear();
    window.location.href = '/auth/login';
    this.showLogoutModal = false;
  }

  onLogoutCancel(): void {
    this.showLogoutModal = false;
  }
}
