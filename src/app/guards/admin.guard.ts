import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            if (user && user.role === 'admin') {
                return true;
            }

            // Redirect to login or home if not admin
            if (user) {
                router.navigate(['/accueil']);
            } else {
                router.navigate(['/login']);
            }
            return false;
        })
    );
};
