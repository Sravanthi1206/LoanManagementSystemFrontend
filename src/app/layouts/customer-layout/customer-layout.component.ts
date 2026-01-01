import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmationModalComponent],
  template: `
    <div class="layout-wrapper">
      <nav class="navbar navbar-customer">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <a class="navbar-brand" href="#">LMS • Customer Portal</a>
          <button class="btn btn-outline-light btn-sm" (click)="initiateLogout()">Logout</button>
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
