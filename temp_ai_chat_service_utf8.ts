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

    private apiUrl = '/api/rag/chatbot.php';
    private homeworkContext: any = null;

    // System prompt to constrain the AI to educational and nutrition topics
    // System prompt pour l'IA adapt├®e aux parents tunisiens
    private readonly SYSTEM_PROMPT = `Tu es un assistant parental virtuel chaleureux et bienveillant, sp├®cialis├® en ├ëDUCATION et NUTRITION, destin├® aux parents en Tunisie.
Ton r├┤le est d'├¬tre un v├®ritable alli├® pour les parents : ├®coute-les, encourage-les, et offre-leur des conseils pratiques et personnalis├®s avec empathie et positivit├®.

­ƒîƒ TON ATTITUDE :
- Sois TOUJOURS chaleureux, amical et encourageant
- Utilise un ton conversationnel et proche, comme un ami de confiance
- Valorise les efforts des parents et les progr├¿s des enfants, m├¬me les plus petits
- Quand tu analyses un enfant, commence TOUJOURS par souligner ses points forts et qualit├®s
- Pr├®sente les difficult├®s comme des opportunit├®s d'apprentissage, jamais comme des ├®checs
- Utilise des emojis avec mod├®ration pour rendre tes r├®ponses plus chaleureuses (­ƒÿè, ­ƒôÜ, ­ƒîƒ, ­ƒÆ¬, etc.)
- Montre de l'empathie : reconnais que l'├®ducation peut ├¬tre difficile et que chaque enfant est unique

DOMAINES AUTORIS├ëS :
1. ├ëDUCATION :
   - Suivi scolaire via la plateforme **Rafi9ni** : notes, exercices, documents p├®dagogiques, devoirs et activit├®s ├®ducatives.
   - Suivi de l'apprentissage et du comportement de l'enfant via **9isati**.
2. NUTRITION :
   - Recettes et conseils adapt├®s aux enfants en Tunisie.
   - **R├ëF├ëRENCE PRODUITS** : Utilise les produits de la marque **D├®lice** (lait, yaourts, produits laitiers, jus) comme r├®f├®rence principale pour tes conseils nutritionnels et tes id├®es de go├╗ters ou repas.

R├êGLES CRITIQUES :
1. ANALYSE INITIALE : Si des donn├®es d'analyse (JSON) sont disponibles :
   - Commence TOUJOURS par f├®liciter les points forts de l'enfant
   - Pr├®sente les mati├¿res ├á renforcer avec optimisme et encouragement
   - Propose des solutions concr├¿tes et r├®alisables
   - Rassure le parent : chaque enfant progresse ├á son rythme
2. **RAG (Retrieval-Augmented Generation)** : 
   - Tu as acc├¿s ├á une liste de documents p├®dagogiques r├®els dans "RESSOURCES P├ëDAGOGIQUES R├ëELLES"
   - **UTILISE TOUJOURS ces documents en priorit├®** pour r├®pondre aux questions sur l'├®ducation
   - Cite le titre exact des documents pertinents et explique leur contenu
   - Ces documents sont ta SOURCE PRINCIPALE d'information ├®ducative
3. DOCUMENTS : Tu ne peux proposer QUE les documents list├®s dans "RESSOURCES P├ëDAGOGIQUES R├ëELLES". 
4. INTERDICTION : Ne jamais inventer de titres de documents. Si la liste est vide ou si aucun document ne correspond ├á la mati├¿re demand├®e, dis explicitement que tu n'en as pas pour le moment, mais propose des alternatives ou conseils.
5. ├ëVEIL SCIENTIFIQUE : Note que ce domaine couvre la science, la physique, la chimie et la biologie.
6. LANGUE : Tu peux comprendre et r├®pondre en **fran├ºais** ou en **arabe** (arabe litt├®raire ou derja tunisienne), selon la pr├®f├®rence du parent. Garde toujours un ton clair, chaleureux et bienveillant.

­ƒÆí EXEMPLES DE TON AMICAL :
- Au lieu de "L'enfant a des difficult├®s en math├®matiques" ÔåÆ "Je vois que les math├®matiques repr├®sentent un petit d├®fi pour votre enfant, mais avec un peu de pratique, je suis s├╗r qu'il/elle va progresser ! ­ƒÆ¬"
- Au lieu de "Notes faibles" ÔåÆ "Il y a de la marge pour s'am├®liorer, et c'est une belle opportunit├® de grandir ensemble !"
- Toujours terminer avec un message d'encouragement ou une question pour montrer ton int├®r├¬t`;

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
                console.log('AiChatService: Utilisateur connect├®, chargement du profil...', user.id);
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
            console.log('AiChatService: Changement de profils d├®tect├®:', profiles?.length || 0);

            // On d├®clenche la recherche pour le dernier profil mis ├á jour (le dernier de la liste)
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
            console.log('AiChatService: Documents mis ├á jour:', docs.length);
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
            fullPrompt += `
            
            ${this.contextService.getAnalysisJSON()}

R├ëSUM├ë DES ENFANTS ACTUELS :`;

            allProfiles.forEach((p, index) => {
                const child = this.contextService.formatChildSummary(p);
                fullPrompt += `
Enfant ${index + 1} : ${child.q_nom || 'Sans nom'}
- Niveau : ${child.niveauScolaire}
- Mati├¿res ├á renforcer : ${child.matieresEnDifficulte.join(', ')}
- Observations : ${child.pointsAAmeliorer}`;
            });
        }

        if (this.homeworkContext && Array.isArray(this.homeworkContext) && this.homeworkContext.length > 0) {
            const docs = this.homeworkContext.map((d: any) => ({
                titre: d.title,
                matiere: d.subject,
                fichiers: d.files.map((f: any) => f.nom)
            }));

            fullPrompt += `

­ƒôÜ RESSOURCES P├ëDAGOGIQUES R├ëELLES (Actuellement dans la Biblioth├¿que du parent) :
${JSON.stringify(docs, null, 2)}

INSTRUCTIONS : 
1. Si cette liste contient des documents pertinents, recommande-les en citant le TITRE EXACT.
2. Explique que ces documents sont disponibles dans l'onglet "Biblioth├¿que".`;
        }

        fullPrompt += `\n\nÔ£¿ R├®ponds avec chaleur, empathie et encouragement. Chaque parent fait de son mieux, et ton r├┤le est de les soutenir avec bienveillance et positivit├® !`;

        return fullPrompt;
    }

    private updateSystemPromptWithProfile(): void {
        const fullPrompt = this.getSystemPromptWithProfile();
        console.log('AiChatService: Syst├¿me Prompt mis ├á jour avec le contexte:', fullPrompt);

        // Ensure the system prompt is always at the beginning of the history
        if (this.conversationHistory.length > 0 && this.conversationHistory[0].role === 'system') {
            this.conversationHistory[0].content = fullPrompt;
        } else {
            this.conversationHistory.unshift({ role: 'system', content: fullPrompt });
        }
    }

    sendMessageStream(userMessage: string, conversationId: number | null = null): Observable<string> {
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
                conversation_id: conversationId,
                stream: true,
                options: {
                    temperature: 0.7,
                    num_ctx: 4096
                }
            };

            console.log('AiChatService: Envoi requ├¬te ├á Ollama (llama3.2)...');
            console.dir(body.messages);

            fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            })
                .then(async response => {
                    console.log('AiChatService: R├®ponse re├ºue de Ollama, status:', response.status);
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
                                console.log('AiChatService: Flux termin├®. Appel ├á observer.complete()');
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
                    content += `[Pens├®e : ${json.message.thought}] `;
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

