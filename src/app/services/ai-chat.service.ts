/**
 * PURPOSE: Controls the AI Assistant (Chatbot).
 * CONTENT: Sends messages to Ollama, manages system prompts (educational/nutrition focus), and handles streaming responses.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ContextService, ChildProfile } from './context.service';

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
    private currentProfile: ChildProfile | null = null;
    private homeworkContext: any = null;

    // System prompt to constrain the AI to educational and nutrition topics
    private readonly SYSTEM_PROMPT = `Tu es un assistant parental virtuel spécialisé en ÉDUCATION et NUTRITION.
Ton but est d'aider les parents avec des conseils pratiques, bienveillants et personnalisés.

DOMAINES AUTORISÉS :
1. ÉDUCATION : Devoirs, difficultés scolaires, comportement, développement de l'enfant, activités éducatives.
2. NUTRITION : Recettes pour enfants, équilibre alimentaire, santé, allergies.
3. CONTEXTE ENFANT : Tu dois impérativement utiliser les informations du "CONTEXTE ENFANT ACTUEL" et des "RESSOURCES PÉDAGOGIQUES" fournies ci-dessous. 

RÈGLES CRITIQUES :
- Si la section "RESSOURCES PÉDAGOGIQUES" contient des informations, tu DOIS les inclure dans ton résumé.
- Ne dis jamais que tu n'as pas trouvé de ressources si des données sont présentes.
- Cite le titre exact du document et propose les liens de téléchargement.
- Adapte tes recommandations en fonction du niveau de l'enfant et du contenu du document.
- Réponds en français.`;

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private contextService: ContextService,
        private ngZone: NgZone
    ) {
        this.authService.currentUser$.subscribe(user => {
            if (!user) {
                this.clearHistory();
            }
        });

        this.contextService.childProfile$.subscribe(profile => {
            console.log('AiChatService: Profil reçu:', profile);
            this.currentProfile = this.contextService.getProfile(); // Use the adapter to get mapped fields
            this.updateSystemPromptWithProfile();
            // Clear history to ensure the new context is picked up for the next message
            this.clearHistory();
        });
    }

    setHomeworkContext(homeworkData: any): void {
        this.homeworkContext = homeworkData;
        this.updateSystemPromptWithProfile();
    }

    private getSystemPromptWithProfile(): string {
        let fullPrompt = this.SYSTEM_PROMPT;

        if (this.currentProfile) {
            fullPrompt += `

CONTEXTE ENFANT ACTUEL :
- Niveau scolaire : ${this.currentProfile.niveauScolaire}
- Difficultés : ${this.currentProfile.matieresEnDifficulte}
- Points d'attention : ${this.currentProfile.pointsAAmeliorer}`;
        }

        if (this.homeworkContext) {
            // Extraction selon la structure réelle : { homeWork: { name: "...", homeworkfiles: { fileEducanet: [...] } } }
            const hw = this.homeworkContext.homeWork || this.homeworkContext;
            const cleanResources = {
                titre: hw.name || hw.titre || 'Ressource pédagogique',
                fichiers: (hw.homeworkfiles?.fileEducanet || []).map((f: any) => ({
                    nom: f.title || f.fileName,
                    lien: f.path
                }))
            };

            fullPrompt += `

RESSOURCES PÉDAGOGIQUES TROUVÉES (API) :
${JSON.stringify(cleanResources, null, 2)}

INSTRUCTION CRITIQUE : Ne fais PAS de long résumé. Donne juste le titre du document et le(s) lien(s) de téléchargement PDF de manière professionnelle.`;
        }

        fullPrompt += `\n\nUtilise impérativement ces informations pour tes conseils.`;

        return fullPrompt;
    }

    private updateSystemPromptWithProfile(): void {
        const fullPrompt = this.getSystemPromptWithProfile();
        console.log('AiChatService: Système Prompt mis à jour avec le contexte:', fullPrompt);

        // Ensure the system prompt is always at the beginning of the history
        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = fullPrompt;
        } else {
            this.conversationHistory.unshift({ role: 'system', content: fullPrompt });
        }
    }

    sendMessageStream(userMessage: string): Observable<string> {
        // The system prompt is already managed by updateSystemPromptWithProfile() 
        // which is called when the profile or homework context changes.
        // We just need to ensure it's there.
        this.updateSystemPromptWithProfile();

        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        return new Observable(observer => {
            const body = {
                model: 'llama3.2',
                messages: this.conversationHistory,
                stream: true,
                options: {
                    temperature: 0.7,
                    num_ctx: 4096
                }
            };

            console.log('AiChatService: Envoi requête à Ollama (llama3.2)...');
            console.dir(body.messages);

            fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            })
                .then(async response => {
                    console.log('AiChatService: Réponse reçue de Ollama, status:', response.status);
                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`Ollama error (${response.status}): ${text}`);
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
                                        this.ngZone.run(() => observer.next(content));
                                    });
                                }

                                // Add AI response to conversation history
                                this.conversationHistory.push({
                                    role: 'assistant',
                                    content: fullResponse
                                });
                                console.log('AiChatService: Flux terminé. Appel à observer.complete()');
                                this.ngZone.run(() => observer.complete());
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
                                    this.ngZone.run(() => observer.next(content));
                                });
                            }

                            readChunk();
                        }).catch(error => {
                            this.ngZone.run(() => observer.error(error));
                        });
                    };

                    readChunk();
                })
                .catch(error => {
                    this.ngZone.run(() => observer.error(error));
                });
        });
    }

    private processJsonLines(text: string, onContent: (content: string) => void): void {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                let content = '';

                // standard chat content
                if (json.message?.content) {
                    content += json.message.content;
                }

                // reasoning/thought content if model supports it
                if (json.message?.thought) {
                    content += `[Pensée : ${json.message.thought}] `;
                }

                if (content) {
                    onContent(content);
                }
            } catch (e) {
                // Skip invalid JSON lines (might be partial)
            }
        }
    }

    clearHistory(): void {
        this.conversationHistory = [
            { role: 'system', content: this.getSystemPromptWithProfile() }
        ];
    }

    setHistory(messages: Array<{ role: string; content: string }>): void {
        this.conversationHistory = [
            { role: 'system', content: this.getSystemPromptWithProfile() },
            ...messages
        ];
    }
}
