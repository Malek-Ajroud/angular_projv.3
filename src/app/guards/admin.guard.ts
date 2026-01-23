import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
<<<<<<< HEAD
import { map, take } from 'rxjs/operators';
=======
import { map, take } from 'rxjs';
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            if (user && user.role === 'admin') {
                return true;
            }

<<<<<<< HEAD
            // Redirect to login or home if not admin
            if (user) {
                router.navigate(['/accueil']);
            } else {
                router.navigate(['/login']);
            }
            return false;
=======
            // Redirect based on status
            if (user) {
                // Logged in but not admin
                return router.createUrlTree(['/accueil']);
            } else {
                // Not logged in
                return router.createUrlTree(['/login']);
            }
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
        })
    );
};
