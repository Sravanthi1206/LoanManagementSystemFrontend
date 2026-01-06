import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { NotificationDropdownComponent } from '../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, ConfirmationModalComponent, NotificationDropdownComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
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
