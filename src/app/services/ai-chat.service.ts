/**
 * PURPOSE: Controls the AI Assistant (Chatbot).
 * CONTENT: Sends messages to Ollama, manages system prompts (educational/nutrition focus), and handles streaming responses.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AiChatService {

    private apiUrl = environment.OLLAMA_API_URL;

    // System prompt to constrain the AI to educational and nutrition topics
    private readonly SYSTEM_PROMPT = `Tu es un assistant parental virtuel STRICTEMENT limité aux domaines de l'ÉDUCATION et de la NUTRITION des enfants.

INTERDICTIONS ABSOLUES :
- Interdiction de répondre à des questions de culture générale, politique, sport, divertissement, technologie (hors éducation), ou tout autre sujet hors thématique.
- Interdiction de générer du code informatique, des poèmes (hors contexte éducatif enfantin), ou des analyses complexes de sujets non parentaux.
- Interdiction d'aider pour des tâches non liées à l'enfance.

RÈGLES DE RÉPONSE :
1. Si la question concerne l'éducation (devoirs, développement, comportement) ou la nutrition (recettes, santé, allergies) infantiles : Réponds de manière bienveillante et pratique.
2. SI LA QUESTION EST HORS SUJET : Tu DOIS refuser systématiquement de répondre. Ta réponse unique doit être : "Je suis un assistant spécialisé uniquement dans l'éducation et la nutrition des enfants. Je ne peux pas répondre à cette demande. Avez-vous une question concernant le développement ou l'alimentation de votre enfant ?"
3. Ne justifie pas ton refus au-delà de la phrase imposée.
4. Reste professionnel, court (si nécessaire pour le refus) et en français.`;

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.authService.currentUser$.subscribe(user => {
            if (!user) {
                this.clearHistory();
            }
        });
    }

    sendMessageStream(userMessage: string): Observable<string> {
        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        return new Observable(observer => {
            const body = {
                model: 'gemma3:8b',
                messages: this.conversationHistory,
                stream: true,
                options: {
                    temperature: 0.3,
                    top_p: 0.85,
                    num_ctx: 128000,
                    num_predict: 1000
                },
                keep_alive: "1h"
            };

            fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    let fullResponse = '';
                    let buffer = '';

                    const readChunk = (): void => {
                        reader?.read().then(({ done, value }) => {
                            if (done) {
                                // Process any remaining content in buffer
                                if (buffer.trim()) {
                                    this.processJsonLines(buffer, (content) => {
                                        fullResponse += content;
                                        observer.next(content);
                                    });
                                }

                                // Add AI response to conversation history
                                this.conversationHistory.push({
                                    role: 'assistant',
                                    content: fullResponse
                                });
                                observer.complete();
                                return;
                            }

                            const chunk = decoder.decode(value, { stream: true });
                            buffer += chunk;

                            const lastNewlineIndex = buffer.lastIndexOf('\n');
                            if (lastNewlineIndex !== -1) {
                                const linesToProcess = buffer.substring(0, lastNewlineIndex);
                                buffer = buffer.substring(lastNewlineIndex + 1);

                                this.processJsonLines(linesToProcess, (content) => {
                                    fullResponse += content;
                                    observer.next(content);
                                });
                            }

                            readChunk();
                        }).catch(error => {
                            observer.error(error);
                        });
                    };

                    readChunk();
                })
                .catch(error => {
                    observer.error(error);
                });
        });
    }

    private processJsonLines(text: string, onContent: (content: string) => void): void {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    onContent(json.message.content);
                }
            } catch (e) {
                // Skip invalid JSON lines (might be partial)
            }
        }
    }

    clearHistory(): void {
        this.conversationHistory = [
            { role: 'system', content: this.SYSTEM_PROMPT }
        ];
    }

    setHistory(messages: Array<{ role: string; content: string }>): void {
        this.conversationHistory = [
            { role: 'system', content: this.SYSTEM_PROMPT },
            ...messages
        ];
    }
}
