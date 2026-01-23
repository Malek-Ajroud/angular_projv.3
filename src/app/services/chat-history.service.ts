/**
 * PURPOSE: Persists chat data in the database via PHP backend.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ChatConversation {
    id: number;
    user_id: number;
    title: string;
    created_at: string;
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
    private apiUrl = `${environment.PHP_API_URL}/chat`;

    constructor(private http: HttpClient) { }

    /**
     * Fetch all conversations from backend
     */
    loadConversations(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/conversations.php`).pipe(
            tap(res => {
                if (res.success) {
                    this.conversationsSubject.next(res.data);
                }
            })
        );
    }

    /**
     * Create a new conversation
     */
    createConversation(title: string = 'Nouvelle conversation'): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/conversations.php`, { title }).pipe(
            tap(res => {
                if (res.success) {
                    const current = this.conversationsSubject.value;
                    this.conversationsSubject.next([res.data, ...current]);
                }
            })
        );
    }

    /**
     * Get messages for a specific conversation
     */
    getMessages(conversationId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/messages.php?conversation_id=${conversationId}`);
    }

    /**
     * Save a message to a conversation
     */
    saveMessage(conversationId: number, role: 'user' | 'ai' | 'system', content: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/messages.php`, {
            conversation_id: conversationId,
            role,
            content
        });
    }

    /**
     * Delete a conversation
     */
    deleteConversation(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/conversations.php?id=${id}`).pipe(
            tap(res => {
                if (res.success) {
                    const current = this.conversationsSubject.value;
                    this.conversationsSubject.next(current.filter(c => c.id !== id));
                }
            })
        );
    }

    /**
     * Clear local state
     */
    clearState(): void {
        this.conversationsSubject.next([]);
    }
}
