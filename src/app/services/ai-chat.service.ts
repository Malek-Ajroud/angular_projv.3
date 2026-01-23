/**
 * PURPOSE: Controls the AI Assistant (Chatbot).
 * CONTENT: Sends messages to Ollama, manages system prompts (educational/nutrition focus), and handles streaming responses.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
<<<<<<< HEAD
import { AuthService } from './auth.service';
import { ContextService, ChildProfile } from './context.service';
=======
import { ContextService } from './context.service';
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

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
<<<<<<< HEAD
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
- Adapte tes recommandations en fonction du niveau de l'enfant (CE2) et du contenu du document.
- Réponds en français.`;
=======
    private readonly SYSTEM_PROMPT = `Tu es un assistant parental virtuel expert en ÉDUCATION et NUTRITION des enfants.

CONTEXTE PRIORITAIRE :
Si un "PROFIL ENFANT ANALYSÉ" t'est fourni en format JSON, ce profil devient ta source d'information principale. Toute question portant sur les résultats, les difficultés, le comportement ou le niveau scolaire de cet enfant est DIRECTEMENT liée à ta mission d'éducation.

RÈGLES DE RÉPONSE :
1. Analyse le JSON fourni pour identifier les forces et les besoins de l'enfant.
2. Si le parent pose une question sur son enfant (ex: "quelles sont ses difficultés ?"), utilise les données du JSON (notes basses, observations) pour répondre de manière précise et bienveillante.
3. Continue de refuser les sujets totalement hors thématique (politique, sport, divertissement, technologie hors éducation) avec la phrase : "Je suis un assistant spécialisé uniquement dans l'éducation et la nutrition des enfants. Je ne peux pas répondre à cette demande. Avez-vous une question concernant le développement ou l'alimentation de votre enfant ?"
4. Reste professionnel, empathique et constructif.`;
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
<<<<<<< HEAD
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
            this.currentProfile = profile;
            this.updateSystemPromptWithProfile();
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
        // Update system prompt in history if it exists as the first message
        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = fullPrompt;
        }
    }
=======
        private contextService: ContextService
    ) { }
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

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
                model: 'llama3.2:latest',
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
        ];
    }
}
