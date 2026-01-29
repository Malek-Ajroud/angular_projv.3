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
import { HomeworkService, Homework } from './homework.service';

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
    private homeworkContext: any = null;

    // System prompt to constrain the AI to educational and nutrition topics
    // System prompt pour l'IA adaptée aux parents tunisiens
    private readonly SYSTEM_PROMPT = `أنت المساعد التربوي الرسمي لمنصة Rafi9ni و 9isati.
Tu es l'assistant pédagogique STRICT et OFFICIEL des plateformes Rafi9ni et 9isati.

⚠️ RÈGLES DE FER (CRITIQUES) :
1. 🌍 LANGUE OBLIGATOIRE : 
   - SI LE PARENT ÉCRIT EN ARABE (العربية) -> RÉPONDS **EXCLUSIVEMENT** EN ARABE.
   - إذا كتب الولي بالعربية، يجب أن تجيب بالعربية فقط!
   - SI LE PARENT ÉCRIT EN FRANÇAIS -> RÉPONDS **EXCLUSIVEMENT** EN FRANÇAIS.
   - NE JAMAIS RÉPONDRE EN FRANÇAIS À UNE QUESTION EN ARABE.

2. 👤 ADRESSE AU PARENT :
   - Commence TOUJOURS ta réponse par "**عزيزي الولي**" (si en arabe) ou "**Cher parent**" (si en français).
   - NE JAMAIS mélanger les langues dans la salutation (ex: pas de "Hello Cher Parent").
   - NE JAMAIS s'adresser à l'enfant. Parle de lui à la troisième personne (votre fils/fille).

3. 🚫 RESSOURCES EXTERNES INTERDITES :
   - INTERDICTION TOTALE de recommander YouTube, Netflix, Disney, Google, ou des livres externes.
   - Propose UNIQUEMENT les documents listés dans la "BIBLIOTHÈQUE" ci-dessous.
   - Si rien n'est disponible, dis : "Je n'ai pas de documents spécifiques pour le moment".

4. 📚 CONTEXTE :
   - Rafi9ni (Scolaire), 9isati (Comportement), Délice (Goûter).
   - Base tes conseils sur l'âge, le niveau et les notes du profil.`;

    private conversationHistory: Array<{ role: string; content: string }> = [
        { role: 'system', content: this.SYSTEM_PROMPT }
    ];

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private contextService: ContextService,
        private homeworkService: HomeworkService,
        private ngZone: NgZone
    ) {
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                console.log('AiChatService: Utilisateur connecté, chargement du profil...', user.id);
                this.contextService.loadProfileForUser(user.id);
                this.homeworkService.loadLibrary(user.id);
                this.updateSystemPromptWithProfile();
            } else {
                this.homeworkService.clearLibrary();
                this.clearHistory();
            }
        });

        // 1. React to Profile Changes -> Trigger Search for each child if needed
        this.contextService.childProfile$.subscribe(profiles => {
            console.log('AiChatService: Changement de profils détecté:', profiles?.length || 0);

            // On déclenche la recherche pour le dernier profil mis à jour (le dernier de la liste)
            if (profiles && profiles.length > 0) {
                const latestProfile = this.contextService.getProfile();
                if (latestProfile) {
                    this.homeworkService.performSearch(latestProfile);
                }
            }

            this.updateSystemPromptWithProfile();
        });

        // 2. React to Documents Found -> Update Prompt
        this.homeworkService.recommendedDocuments$.subscribe((docs: Homework[]) => {
            console.log('AiChatService: Documents mis à jour:', docs.length);
            this.homeworkContext = docs;
            this.updateSystemPromptWithProfile();
        });
    }

    setHomeworkContext(homeworkData: any): void {
        // Legacy support if needed, but now we use subscription
        this.homeworkContext = homeworkData;
        this.updateSystemPromptWithProfile();
    }

    private getSystemPromptWithProfile(): string {
        let fullPrompt = this.SYSTEM_PROMPT;
        const allProfiles = this.contextService.getAllProfiles();

        if (allProfiles && allProfiles.length > 0) {
            fullPrompt += `\n\n### DONNÉES OBLIGATOIRES À UTILISER :`;
            allProfiles.forEach((p, index) => {
                const child = this.contextService.formatChildSummary(p);
                const name = p.q_nom || child.q_nom || `Enfant ${index + 1}`;
                fullPrompt += `\n- ENFANT: ${name} (${p.q_age} ans), Niveau: ${child.niveauScolaire}, Difficultés: ${child.matieresEnDifficulte.join(', ')}`;
            });

            if (this.homeworkContext?.length > 0) {
                fullPrompt += `\n\n### SEULES RESSOURCES AUTORISÉES (BIBLIOTHÈQUE) :`;
                this.homeworkContext.forEach((d: any) => {
                    fullPrompt += `\n- TITRE: "${d.title}" (Matière: ${d.subject})`;
                });
            } else {
                fullPrompt += `\n\n⚠️ AUCUNE RESSOURCE DISPONIBLE. Ne propose RIEN d'autre.`;
            }
        }

        fullPrompt += `\n\n### INTERDICTIONS STRICTES :
- NE JAMAIS citer YouTube, Netflix, Disney, Harry Potter, Le Petit Prince ou tout livre/site externe.
- SI TU CITES UN ÉLÉMENT EXTERNE, TU ÉCHOUES À TA MISSION.
- Réponds UNIQUEMENT sur la base de Rafi9ni (scolaire) et 9isati (comportement).
- Adresse-toi TOUJOURS au parent en disant "**عزيزي الولي**" (en arabe) ou "**Cher parent**" (en français). Ne nomme l'enfant que pour donner des informations sur son suivi.`;

        return fullPrompt;
    }

    private updateSystemPromptWithProfile(): void {
        const fullPrompt = this.getSystemPromptWithProfile();
        // Prompt logging disabled for performance and readability

        // Ensure the system prompt is always at the beginning of the history
        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = fullPrompt;
        } else {
            this.conversationHistory.unshift({ role: 'system', content: fullPrompt });
        }
    }

    sendMessageStream(userMessage: string): Observable<string> {
        this.updateSystemPromptWithProfile();

        console.log('AiChatService: Ajout du message utilisateur à l\'historique...');
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
                    num_ctx: 2048,
                    num_predict: 512
                }
            };

            console.log('AiChatService: Envoi requête POST vers', this.apiUrl);
            console.log('AiChatService: Corps de la requête:', JSON.stringify(body, null, 2));

            fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
                .then(async response => {
                    console.log('AiChatService: Réponse HTTP reçue, statut:', response.status);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('AiChatService: Erreur Ollama reçue:', errorText);
                        throw new Error(`Ollama error (${response.status}): ${errorText}`);
                    }

                    if (!response.body) {
                        console.error('AiChatService: Corps de réponse vide !');
                        throw new Error('ReadableStream not supported or empty body');
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let fullResponse = '';
                    let buffer = '';

                    const readChunk = (): void => {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                console.log('AiChatService: Flux terminé.');
                                if (buffer.trim()) {
                                    this.processJsonLines(buffer, (content) => {
                                        fullResponse += content;
                                        this.ngZone.run(() => observer.next(content));
                                    });
                                }
                                this.conversationHistory.push({ role: 'assistant', content: fullResponse });
                                this.ngZone.run(() => observer.complete());
                                return;
                            }

                            const chunk = decoder.decode(value, { stream: true });
                            console.log('AiChatService: Chunk reçu (longueur:', chunk.length, ')');
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
                            console.error('AiChatService: Erreur lors de la lecture du flux:', error);
                            this.ngZone.run(() => observer.error(error));
                        });
                    };

                    readChunk();
                })
                .catch(error => {
                    console.error('AiChatService: Erreur Fetch fatale:', error);
                    this.ngZone.run(() => observer.error(error));
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
                if (json.done) {
                    console.log('AiChatService: Signal "done" reçu dans le JSON.');
                }
            } catch (e) {
                console.warn('AiChatService: Erreur de parsing JSON sur la ligne:', line);
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
