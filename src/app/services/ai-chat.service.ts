/**
 * PURPOSE: Controls the AI Assistant (Chatbot).
 * CONTENT: Sends messages to Ollama, manages system prompts (educational/nutrition focus), and handles streaming responses.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContextService } from './context.service';

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
        private contextService: ContextService
    ) { }

    sendMessageStream(userMessage: string): Observable<string> {
        // Enforce context if available and not already added
        const analysisJson = this.contextService.getAnalysisJSON();
        if (analysisJson && this.conversationHistory.length === 1) {
            const contextPrompt = `\n\nPROFIL ENFANT ANALYSÉ (JSON):\n${analysisJson}\n\nUtilise ce profil pour personnaliser tes conseils et recommander des documents pédagogiques adaptés.`;
            this.conversationHistory[0].content = this.SYSTEM_PROMPT + contextPrompt;
        }

        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        return new Observable(observer => {
            const body = {
                model: 'llama3.2',
                messages: this.conversationHistory,
                stream: true
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

                    const readChunk = (): void => {
                        reader?.read().then(({ done, value }) => {
                            if (done) {
                                // Add AI response to conversation history
                                this.conversationHistory.push({
                                    role: 'assistant',
                                    content: fullResponse
                                });
                                observer.complete();
                                return;
                            }

                            const chunk = decoder.decode(value, { stream: true });
                            const lines = chunk.split('\n').filter(line => line.trim() !== '');

                            for (const line of lines) {
                                try {
                                    const json = JSON.parse(line);
                                    if (json.message?.content) {
                                        fullResponse += json.message.content;
                                        observer.next(json.message.content);
                                    }
                                } catch (e) {
                                    // Skip invalid JSON lines
                                }
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

    clearHistory(): void {
        this.conversationHistory = [
            { role: 'system', content: this.SYSTEM_PROMPT }
        ];
    }
}
