import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { NotificationDropdownComponent } from '../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmationModalComponent, NotificationDropdownComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
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
