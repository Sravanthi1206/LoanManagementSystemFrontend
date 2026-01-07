import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../core/services/auth-state.service';
import { UserRole } from '../shared/types/models';

export const roleGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const requiredRole = route.data['role'] as UserRole;
  const userRole = authState.getRole();

  // ROOT_ADMIN can access ADMIN routes
  if (userRole === requiredRole ||
    (userRole === 'ROOT_ADMIN' && requiredRole === 'ADMIN')) {
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
    case 'ROOT_ADMIN':
      router.navigate(['/admin/dashboard']);
      break;
    default:
      router.navigate(['/auth/login']);
  }

  return false;
};
