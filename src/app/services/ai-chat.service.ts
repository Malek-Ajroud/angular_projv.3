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
    private readonly SYSTEM_PROMPT = `Tu es un assistant parental virtuel expert en ÉDUCATION et NUTRITION des enfants.

CONTEXTE PRIORITAIRE :
Si un "PROFIL ENFANT ANALYSÉ" t'est fourni en format JSON, ce profil devient ta source d'information principale. Toute question portant sur les résultats, les difficultés, le comportement ou le niveau scolaire de cet enfant est DIRECTEMENT liée à ta mission d'éducation.

RÈGLES DE RÉPONSE :
1. Analyse le JSON fourni pour identifier les forces et les besoins de l'enfant.
2. Si le parent pose une question sur son enfant (ex: "quelles sont ses difficultés ?"), utilise les données du JSON (notes basses, observations) pour répondre de manière précise et bienveillante.
3. Continue de refuser les sujets totalement hors thématique (politique, sport, divertissement, technologie hors éducation) avec la phrase : "Je suis un assistant spécialisé uniquement dans l'éducation et la nutrition des enfants. Je ne peux pas répondre à cette demande. Avez-vous une question concernant le développement ou l'alimentation de votre enfant ?"
4. Reste professionnel, empathique et constructif.`;

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
        private contextService: ContextService
    ) { }

    sendMessageStream(userMessage: string): Observable<string> {
        // Enforce context if available (always sync the system prompt with latest data)
        const analysisJson = this.contextService.hasData() ? this.contextService.getAnalysisJSON() : null;
        const contextPrompt = analysisJson ? `\n\nPROFIL ENFANT ANALYSÉ (JSON):\n${analysisJson}\n\nUtilise ce profil pour personnaliser tes conseils et recommander des documents pédagogiques adaptés.` : '';

        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = this.SYSTEM_PROMPT + contextPrompt;
        } else if (this.conversationHistory.length === 0) {
            this.conversationHistory.push({ role: 'system', content: this.SYSTEM_PROMPT + contextPrompt });
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

    setHistory(messages: Array<{ role: string; content: string }>): void {
        const analysisJson = this.contextService.hasData() ? this.contextService.getAnalysisJSON() : null;
        const contextPrompt = analysisJson ? `\n\nPROFIL ENFANT ANALYSÉ (JSON):\n${analysisJson}\n\nUtilise ce profil pour personnaliser tes conseils et recommander des documents pédagogiques adaptés.` : '';

        this.conversationHistory = [
            { role: 'system', content: this.SYSTEM_PROMPT + contextPrompt },
            ...messages
        ];
    }

    clearHistory(): void {
        const analysisJson = this.contextService.hasData() ? this.contextService.getAnalysisJSON() : null;
        const contextPrompt = analysisJson ? `\n\nPROFIL ENFANT ANALYSÉ (JSON):\n${analysisJson}\n\nUtilise ce profil pour personnaliser tes conseils et recommander des documents pédagogiques adaptés.` : '';

        this.conversationHistory = [
            { role: 'system', content: this.SYSTEM_PROMPT + contextPrompt }
        ];
    }
}
