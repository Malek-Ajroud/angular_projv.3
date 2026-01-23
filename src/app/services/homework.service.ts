import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ChildProfile } from './context.service';

export interface HomeworkFile {
  nom: string;
  fileId: number;
}

export interface Homework {
  id: number;
  title: string;
  files: HomeworkFile[];
}

export interface SearchResponse {
  results: {
    homeWork: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class HomeworkService {

  /**
   * Mapping niveau scolaire → levelId Educanet
   */
  private levelMapping: { [key: string]: number } = {
    '1ère année': 3,
    'CP': 3,
    '2ème année': 4,
    'CE1': 4,
    '3ème année': 5,
    'CE2': 5,
    '4ème année': 6,
    'CM1': 6,
    '5ème année': 7,
    'CM2': 7,
    '6ème année': 8,
    '6ème': 8,
    'prepa': 30,
    'prépa': 30
  };

  constructor(private http: HttpClient) { }

  /**
   * 🔍 Search homework
   * Angular → PHP → Educanet
   */
  searchHomework(profile: ChildProfile): Observable<SearchResponse> {
    const levelId = this.mapLevelToId(profile.rawNiveau);
    const idrole = 3;
    const count = 10;

    const url = `/api/php/searchHomework.php?levelId=${levelId}&idrole=${idrole}&count=${count}`;

    console.log('Appel backend PHP:', url);

    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Réponse PHP:', response);
        // On retourne la réponse brute pour que AppComponent puisse l'analyser
        // (gestion idMatiere, idHomeWork, etc.)
        return response;
      })
    );
  }

  /**
   * 📄 Get homework details
   * Angular → PHP → Educanet
   */
  getHomeworkDetail(homeworkId: number): Observable<any> {
    const url = `/api/getHomeworkDetail.php?homeworkId=${homeworkId}`;

    console.log('Appel détail devoir:', url);

    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Détails devoir:', response);
        return response;
      })
    );
  }

  /**
   * ⬇️ Download file (PDF)
   * Angular → PHP → Educanet
   */
  downloadFile(fileId: number): Observable<Blob> {
    const url = `/api/download.php?fileId=${fileId}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  /**
   * Convert niveau texte → levelId
   */
  private mapLevelToId(niveau?: string): number {
    if (!niveau) return 0;

    const normalized = niveau.trim();

    if (!isNaN(Number(normalized))) {
      return Number(normalized);
    }

    return (
      this.levelMapping[normalized] ||
      this.levelMapping[normalized.toUpperCase()] ||
      0
    );
  }
}
