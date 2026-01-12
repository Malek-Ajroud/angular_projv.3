import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';


export interface ChatMessage {
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AiChatService {

    private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(private http: HttpClient) { }

    sendMessage(userMessage: string): Observable<ChatMessage> {

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${environment.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:4200',
            'X-Title': 'Angular Chatbot'
        });

        const body = {
            model: 'xiaomi/mimo-v2-flash:free',
            messages: [
                { role: 'user', content: userMessage }
            ]
        };

        return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
            map(response => {
                const aiText = response.choices?.[0]?.message?.content || "Désolé, je n'ai pas compris.";
                return {
                    text: aiText,
                    sender: 'ai',
                    timestamp: new Date()
                };
            })
        );
    }

}
