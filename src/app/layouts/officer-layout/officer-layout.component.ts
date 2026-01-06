import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { NotificationDropdownComponent } from '../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-officer-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ConfirmationModalComponent, NotificationDropdownComponent],
  templateUrl: './officer-layout.component.html',
  styleUrl: './officer-layout.component.css'
})
export class OfficerLayoutComponent {
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
