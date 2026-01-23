import { HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Use Injector to break circular dependency: HttpClient -> Interceptor -> AuthService -> HttpClient
    const injector = inject(Injector);
    const authService = injector.get(AuthService);
    const token = authService.getToken();

<<<<<<< HEAD
    console.log('Request URL:', req.url);
    console.log('Token exists:', !!token);

    // Only add token to PHP API requests and External API via Proxy
    // We check for the PHP_API_URL and Proxy paths
    if (token && (
        req.url.includes('/api/php') ||
        req.url.includes('/backend/api') ||
        req.url.includes('/api/external') ||
        req.url.includes('/api/direct')
    )) {
        console.log('Injecting headers for:', req.url);
=======
    // Only add token to PHP API requests, not Ollama requests
    // We check for the PHP_API_URL part
    if (token && (req.url.includes('/api/php/') || req.url.includes('/backend/api/'))) {
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
        const cloned = req.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`,
                'X-Authorization': `Bearer ${token}`,
                'X-Token': token
            }
        });
        return next(cloned);
    }

    return next(req);
};
