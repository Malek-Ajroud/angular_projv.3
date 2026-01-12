import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
    fullName: string;
    email: string;
    phone: string;
    notifications: {
        email: boolean;
        sms: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private user: User | null = {
        fullName: 'Marie Dupont',
        email: 'marie.dupont@example.com',
        phone: '06 12 34 56 78',
        notifications: {
            email: true,
            sms: false
        }
    };

    getAccount(): Observable<User | null> {
        // Simulate network delay
        return of(this.user ? { ...this.user } : null).pipe(delay(400));
    }

    updateAccount(updatedUser: User): Observable<User> {
        return new Observable(observer => {
            setTimeout(() => {
                this.user = { ...updatedUser };
                observer.next(this.user);
                observer.complete();
            }, 800);
        });
    }

    deleteAccount(): Observable<void> {
        return new Observable(observer => {
            setTimeout(() => {
                this.user = null;
                observer.next();
                observer.complete();
            }, 1000);
        });
    }
}
