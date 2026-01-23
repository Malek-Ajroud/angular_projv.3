import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LibraryService, LibraryEntry } from '../../services/library.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bibliotheque',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bibliotheque-container">
      <header class="page-header">
        <h1>📚 Mes Documents Pédagogiques</h1>
        <p>Vos ressources PDF prêtes à être téléchargées.</p>
      </header>

      <div class="library-grid">
        <div *ngIf="(library$ | async)?.length === 0" class="empty-state">
          <div class="empty-content">
            <i class="fa fa-folder-open"></i>
            <p>Aucun document dans votre bibliothèque pour le moment.</p>
            <div class="empty-actions">
              <button class="btn-primary" (click)="loadExamples()">
                <i class="fa fa-magic"></i> Charger des exemples
              </button>
            </div>
          </div>
        </div>

        <div class="library-card" *ngFor="let entry of library$ | async">
          <div class="card-header">
            <span class="date">{{ entry.date | date:'dd/MM/yyyy HH:mm' }}</span>
            <button class="btn-delete" (click)="deleteEntry(entry.id)" title="Supprimer">
              <i class="fa fa-trash"></i>
            </button>
          </div>

          <h2 class="doc-title">{{ entry.homeworkTitle }}</h2>

          <div class="resources-section">
            <ul class="file-list">
              <li *ngFor="let file of entry.files">
                <a
                  href="javascript:void(0)"
                  class="download-button"
                  (click)="downloadDocument(file.fileId, file.nom)"
                >
                  <i class="fa fa-download"></i> Télécharger
                </a>
                <span class="file-name">{{ file.nom }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bibliotheque-container {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 3rem;
      text-align: center;
    }
    .page-header h1 {
      color: #2c3e50;
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }
    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .library-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      border: 1px solid #eee;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 0.8rem;
      color: #95a5a6;
    }
    .doc-title {
      font-size: 1.1rem;
      color: #2c3e50;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }
    .file-list {
      list-style: none;
      padding: 0;
    }
    .file-list li {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .download-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      background: #4a90e2;
      color: white;
      text-decoration: none;
      padding: 0.8rem;
      border-radius: 8px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .download-button:hover {
      background: #357abd;
      transform: translateY(-2px);
    }
    .file-name {
      font-size: 0.85rem;
      color: #7f8c8d;
      text-align: center;
      word-break: break-all;
    }
    .btn-delete {
      background: #fff5f5;
      border: none;
      color: #ff7675;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
    }
    .btn-delete:hover {
      background: #ff7675;
      color: white;
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 5rem 2rem;
      background: #f8f9fa;
      border-radius: 20px;
      border: 2px dashed #e9ecef;
      color: #7f8c8d;
    }
  `]
})
export class BibliothequeComponent implements OnInit {

  library$: Observable<LibraryEntry[]>;
  isLoading = false;

  constructor(
    private libraryService: LibraryService,
    private http: HttpClient
  ) {
    this.library$ = this.libraryService.library$;
  }

  ngOnInit(): void {}

  /**
   * OPTION 2 — Téléchargement via proxy PHP
   * URL : /api/download.php?fileId=XXXX
   */
  downloadDocument(fileId: number, fileName: string): void {
    if (!fileId) return;

    this.isLoading = true;
    const url = `/api/download.php?fileId=${fileId}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.isLoading = false;
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = fileName || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur de téléchargement:', err);
        alert('Impossible de télécharger le document.');
      }
    });
  }

  /**
   * Données de test (exemples)
   * IMPORTANT : on utilise fileId, PAS path
   */
  loadExamples(): void {
    const examples: Partial<LibraryEntry>[] = [
      {
        homeworkTitle: 'Mathématiques - Fractions (CE2)',
        files: [
          { nom: 'Exercices Fractions CE2.pdf', fileId: 31529 }
        ]
      },
      {
        homeworkTitle: 'Français - Conjugaison',
        files: [
          { nom: 'Futur simple.pdf', fileId: 31530 }
        ]
      }
    ];

    examples.forEach(ex => this.libraryService.addEntry(ex as LibraryEntry));
  }

  deleteEntry(id: string): void {
    if (confirm('Voulez-vous supprimer ce document ?')) {
      this.libraryService.deleteEntry(id);
    }
  }
}
