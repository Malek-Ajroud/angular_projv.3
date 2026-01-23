/**
 * PURPOSE: Attaches authentication tokens to outgoing API requests.
 * CONTENT: Automatically adds the 'Authorization: Bearer' header to PHP backend requests.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Use Injector to break circular dependency: HttpClient -> Interceptor -> AuthService -> HttpClient
    const injector = inject(Injector);
    const authService = injector.get(AuthService);
    const token = authService.getToken();

    // Only add token to PHP API requests, not Ollama requests
    // We check for the PHP_API_URL part
    if (token && (req.url.includes('/api/php/') || req.url.includes('/backend/api/'))) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }

    return next(req);
};
