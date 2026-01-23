import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ContextService } from './services/context.service';
import { HomeworkService } from './services/homework.service';
import { AiChatService } from './services/ai-chat.service';
import { LibraryService } from './services/library.service';

import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  mobileMenuOpen = false;

  constructor(
    private contextService: ContextService,
    private homeworkService: HomeworkService,
    private aiChatService: AiChatService,
    private libraryService: LibraryService
  ) { }

  ngOnInit(): void {
    // TEMPORAIRE : Simule la réception du questionnaire pour vérification
    console.log("AppComponent: Simulation du profil enfant...");
    this.contextService.simulateMockData();

    // Chaînage API 1 (Recherche) -> API 2 (Détails) -> Step 6 (IA)
    const profile = this.contextService.getProfile();
    if (profile) {
      console.log("AppComponent: Démarrage de la recherche automatique de devoirs...");
      this.homeworkService.searchHomework(profile).pipe(
        switchMap(res => {
          console.log("AppComponent: [ÉTAPE 4] Réponse API 1 (TYPE):", typeof res);
          console.log("AppComponent: [ÉTAPE 4] Réponse API 1 (VALEUR):", JSON.stringify(res, null, 2));

          // Recherche de l'ID du devoir (ou idMatiere selon le retour utilisateur)

          const homeworks = res?.results?.homeWork || [];
          let targetHomework = homeworks[0];

          // Tentative de filtrage par matière si renseignée
          if (profile.rawMatiere && homeworks.length > 0) {
            const subject = profile.rawMatiere.toLowerCase();
            const match = homeworks.find((h: any) =>
              (h.title && h.title.toLowerCase().includes(subject)) ||
              (h.matiere && h.matiere.toLowerCase().includes(subject)) ||
              (h.subject && h.subject.toLowerCase().includes(subject))
            );
            if (match) {
              console.log(`AppComponent: Devoir trouvé correspondant à la matière '${profile.rawMatiere}':`, match);
              targetHomework = match;
            }
          }

          const firstHomework = targetHomework;

          if (firstHomework) {
            console.log("AppComponent: Clés disponibles dans l'objet devoir:", Object.keys(firstHomework));
          }

          // Priorité à l'ID de la matière si présent, sinon fallback sur les autres IDs
          // Le user indique: "prendre l'id de la matiere"
          const homeworkId = firstHomework?.idMatiere || firstHomework?.idSubject || firstHomework?.idHomeWork || firstHomework?.id;

          if (homeworkId) {
            console.log("AppComponent: [ÉTAPE 5] ID trouvé (cible=matiere) :", homeworkId, ". Appel API 2...");
            return this.homeworkService.getHomeworkDetail(homeworkId);
          } else {
            console.warn("AppComponent: Aucun document trouvé pour ce profil. La bibliothèque restera vide.");
            return []; // Return empty array to stop chain gracefully
          }
        })
      ).subscribe({
        next: (detail: any) => {
          if (!detail || Object.keys(detail).length === 0) return;

          console.log("AppComponent: [ÉTAPE 5] Succès API 2 ->", detail);

          this.aiChatService.setHomeworkContext(detail);
          const profile = this.contextService.getProfile();
          const hw = detail.homeWork || detail;

          // ÉTAPE 7 : Sauvegarder dans la bibliothèque (PDF uniquement)
          const title = hw.name || hw.titre || 'Document Pédagogique';

          const files = (hw.homeworkfiles?.fileEducanet || []).map((f: any) => ({
            nom: f.title || f.fileName,
            lien: f.path
          }));

          if (files.length > 0) {
            const entry = {
              homeworkTitle: title,
              files: files,
              childProfile: profile
            };

            this.libraryService.addEntry(entry);
            console.log("AppComponent: Document ajouté à la bibliothèque:", title);
          } else {
            console.log("AppComponent: Aucun fichier PDF trouvé dans ce document.");
          }

          // Déclencher l'IA (Optionnel : peut-être un message plus discret ?)
          console.log("AppComponent: Initialisation de l'Assistant IA...");
          this.aiChatService.sendMessageStream("Bonjour ! J'ai trouvé un document pour votre enfant. Comment puis-je vous aider aujourd'hui ?").subscribe({
            next: (chunk: string) => { /* chunk logic if needed */ },
            error: (err) => console.error("IA Erreur :", err)
          });
        },
        error: (err) => {
          console.error("AppComponent: Erreur lors de la récupération automatique des documents.", err);
          // We don't block the app, just log the error.
        }
      });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
