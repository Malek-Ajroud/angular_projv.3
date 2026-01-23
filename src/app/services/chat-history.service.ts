<<<<<<< HEAD
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { AuthService } from './auth.service';
=======
/**
 * PURPOSE: Persists chat data in the database via PHP backend.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
import { environment } from '../../environments/environment';

export interface ChatConversation {
    id: number;
    user_id: number;
    title: string;
    started_at: string;
    updated_at: string;
}

export interface StoredMessage {
    id?: number;
    conversation_id: number;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatHistoryService {
    private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
    public conversations$ = this.conversationsSubject.asObservable();
<<<<<<< HEAD

    private apiBase = environment.PHP_API_URL + '/chat';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.loadConversations().subscribe();
            } else {
                this.conversationsSubject.next([]);
            }
        });
    }

    loadConversations(): Observable<any> {
        return this.http.get<{ success: boolean, data: ChatConversation[] }>(`${this.apiBase}/conversations.php`).pipe(
=======
    private apiUrl = `${environment.PHP_API_URL}/chat`;

    constructor(private http: HttpClient) { }

    /**
     * Fetch all conversations from backend
     */
    loadConversations(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/conversations.php`).pipe(
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
            tap(res => {
                if (res.success) {
                    this.conversationsSubject.next(res.data);
                }
            })
        );
    }

    createConversation(title: string = 'Nouvelle conversation'): Observable<any> {
<<<<<<< HEAD
        return this.http.post<{ success: boolean, data: ChatConversation }>(`${this.apiBase}/conversations.php`, { title }).pipe(
=======
        return this.http.post<any>(`${this.apiUrl}/conversations.php`, { title }).pipe(
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
            tap(res => {
                if (res.success) {
                    const current = this.conversationsSubject.value;
                    this.conversationsSubject.next([res.data, ...current]);
                }
            })
        );
    }

    getMessages(conversationId: number): Observable<any> {
<<<<<<< HEAD
        return this.http.get<{ success: boolean, data: StoredMessage[] }>(`${this.apiBase}/messages.php?conversation_id=${conversationId}`);
=======
        return this.http.get<any>(`${this.apiUrl}/messages.php?conversation_id=${conversationId}`);
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
    }

    saveMessage(conversationId: number, role: 'user' | 'ai' | 'system', content: string): Observable<any> {
<<<<<<< HEAD
        return this.http.post<{ success: boolean, data: StoredMessage }>(`${this.apiBase}/messages.php`, {
=======
        return this.http.post<any>(`${this.apiUrl}/messages.php`, {
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
            conversation_id: conversationId,
            role,
            content
        });
    }

    deleteConversation(id: number): Observable<any> {
<<<<<<< HEAD
        return this.http.delete<any>(`${this.apiBase}/conversations.php?id=${id}`).pipe(
=======
        return this.http.delete<any>(`${this.apiUrl}/conversations.php?id=${id}`).pipe(
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
            tap(res => {
                if (res.success) {
                    const current = this.conversationsSubject.value;
                    this.conversationsSubject.next(current.filter(c => c.id !== id));
                }
            })
        );
    }

    clearState(): void {
        this.conversationsSubject.next([]);
    }
}
