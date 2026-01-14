/**
 * PURPOSE: Persists chat data.
 * CONTENT: Temporary workaround using localStorage instead of PHP database to bypass backend connectivity issues.
 */
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay } from 'rxjs/operators';

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
    private isBrowser: boolean;
    private readonly STORAGE_KEY_CONVS = 'chat_conversations';
    private readonly STORAGE_KEY_MSGS = 'chat_messages';

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: any
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.initStorage();
        }
    }

    private initStorage(): void {
        const convs = localStorage.getItem(this.STORAGE_KEY_CONVS);
        if (convs) {
            this.conversationsSubject.next(JSON.parse(convs));
        } else {
            localStorage.setItem(this.STORAGE_KEY_CONVS, JSON.stringify([]));
        }

        const msgs = localStorage.getItem(this.STORAGE_KEY_MSGS);
        if (!msgs) {
            localStorage.setItem(this.STORAGE_KEY_MSGS, JSON.stringify([]));
        }
    }

    /**
     * Fetch all conversations (from localStorage)
     */
    loadConversations(): Observable<any> {
        if (!this.isBrowser) return of({ success: true, data: [] });
        const convs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_CONVS) || '[]');
        this.conversationsSubject.next(convs);
        return of({ success: true, data: convs }).pipe(delay(200));
    }

    /**
     * Create a new conversation
     */
    createConversation(title: string = 'Nouvelle conversation'): Observable<any> {
        if (!this.isBrowser) return of({ success: false });

        const convs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_CONVS) || '[]');
        const newConv: ChatConversation = {
            id: Date.now(),
            user_id: 1, // Mock user ID
            title: title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updatedConvs = [newConv, ...convs];
        localStorage.setItem(this.STORAGE_KEY_CONVS, JSON.stringify(updatedConvs));
        this.conversationsSubject.next(updatedConvs);

        return of({ success: true, data: newConv }).pipe(delay(200));
    }

    /**
     * Get messages for a specific conversation
     */
    getMessages(conversationId: number): Observable<any> {
        if (!this.isBrowser) return of({ success: true, data: [] });
        const msgs: StoredMessage[] = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MSGS) || '[]');
        const filteredMsgs = msgs.filter(m => m.conversation_id === conversationId);
        return of({ success: true, data: filteredMsgs }).pipe(delay(200));
    }

    /**
     * Save a message to a conversation
     */
    saveMessage(conversationId: number, role: 'user' | 'ai' | 'system', content: string): Observable<any> {
        if (!this.isBrowser) return of({ success: false });

        const msgs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MSGS) || '[]');
        const newMessage: StoredMessage = {
            id: Date.now(),
            conversation_id: conversationId,
            role,
            content,
            timestamp: new Date().toISOString()
        };

        msgs.push(newMessage);
        localStorage.setItem(this.STORAGE_KEY_MSGS, JSON.stringify(msgs));

        return of({ success: true, data: newMessage }).pipe(delay(100));
    }

    /**
     * Delete a conversation
     */
    deleteConversation(id: number): Observable<any> {
        if (!this.isBrowser) return of({ success: false });

        const convs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_CONVS) || '[]');
        const updatedConvs = convs.filter((c: ChatConversation) => c.id !== id);
        localStorage.setItem(this.STORAGE_KEY_CONVS, JSON.stringify(updatedConvs));
        this.conversationsSubject.next(updatedConvs);

        // Also delete related messages
        const msgs = JSON.parse(localStorage.getItem(this.STORAGE_KEY_MSGS) || '[]');
        const updatedMsgs = msgs.filter((m: StoredMessage) => m.conversation_id !== id);
        localStorage.setItem(this.STORAGE_KEY_MSGS, JSON.stringify(updatedMsgs));

        return of({ success: true }).pipe(delay(200));
    }

    /**
     * Clear local state
     */
    clearState(): void {
        this.conversationsSubject.next([]);
    }
}
