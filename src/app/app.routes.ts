import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadComponent: () => import('./layouts/auth-layout/auth-layout.component')
            .then(m => m.AuthLayoutComponent),
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/authentication/pages/login/login.component')
                    .then(m => m.LoginComponent)
            },
            {
                loadComponent: () => import('./features/authentication/pages/register/register.component')
                    .then(m => m.RegisterComponent)
            },
            {
                path: 'change-password',
                loadComponent: () => import('./features/authentication/pages/change-password/change-password.component')
                    .then(m => m.ChangePasswordComponent)
            }
        ]
    },
    {
        path: 'customer',
        canActivate: [authGuard, roleGuard],
        data: { role: 'CUSTOMER' },
        loadComponent: () => import('./layouts/customer-layout/customer-layout.component')
            .then(m => m.CustomerLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/customer/pages/customer-dashboard/customer-dashboard.component')
                    .then(m => m.CustomerDashboardComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'officer',
        canActivate: [authGuard, roleGuard],
        data: { role: 'LOAN_OFFICER' },
        loadComponent: () => import('./layouts/officer-layout/officer-layout.component')
            .then(m => m.OfficerLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/officer/pages/officer-dashboard/officer-dashboard.component')
                    .then(m => m.OfficerDashboardComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'admin',
        canActivate: [authGuard, roleGuard],
        data: { role: 'ADMIN' },
        loadComponent: () => import('./layouts/admin-layout/admin-layout.component')
            .then(m => m.AdminLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/admin/pages/admin-dashboard/admin-dashboard.component')
                    .then(m => m.AdminDashboardComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];
