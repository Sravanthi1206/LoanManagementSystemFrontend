import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../core/services/auth-state.service';
import { UserRole } from '../shared/types/models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as UserRole;
  const userRole = authState.getRole();

  if (userRole === requiredRole) {
    return true;
  }

  // Redirect to appropriate dashboard based on actual role
  switch (userRole) {
    case 'CUSTOMER':
      router.navigate(['/customer/dashboard']);
      break;
    case 'LOAN_OFFICER':
      router.navigate(['/officer/dashboard']);
      break;
    case 'ADMIN':
      router.navigate(['/admin/dashboard']);
      break;
    default:
      router.navigate(['/auth/login']);
  }

  return false;
};
