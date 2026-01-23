import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface representing the processed child profile used for AI context.
 * Kept for compatibility with HomeworkService.
 */
export interface ChildProfile {
    niveauScolaire: string;
    matieresEnDifficulte: string;
    pointsAAmeliorer: string;
    // Raw fields for API calls
    rawNiveau?: string;
    rawMatiere?: string;
    rawDifficulte?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContextService {
    private childProfileSubject = new BehaviorSubject<any>(null);
    public childProfile$ = this.childProfileSubject.asObservable();

    constructor() {
        // Load from localStorage if available
        const savedProfile = localStorage.getItem('child_profile');
        if (savedProfile) {
            try {
                this.childProfileSubject.next(JSON.parse(savedProfile));
            } catch (e) {
                console.error('Error parsing saved child profile', e);
            }
        }
    }

    /**
     * Processes raw questionnaire data (Legacy/Mock adapter)
     */
    setProfileFromForm(rawData: any): void {
        this.updateChildProfile(rawData);
    }

    updateChildProfile(profile: any): void {
        const cleanProfile = this.filterEmptyFields(profile);
        this.childProfileSubject.next(cleanProfile);
        localStorage.setItem('child_profile', JSON.stringify(cleanProfile));
        console.log('Profil mis à jour (ContextService):', cleanProfile);
    }

    private filterEmptyFields(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        return Object.keys(obj).reduce((acc: any, key: string) => {
            const value = obj[key];
            if (value !== null && value !== undefined && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {});
    }

    getChildProfile(): any {
        return this.childProfileSubject.value;
    }

    /**
     * Adapter: Returns a compatible ChildProfile for the HomeworkService.
     * Maps the new "Questionnaire" data (q_niveau, etc.) to the old format.
     */
    getProfile(): ChildProfile | null {
        const p = this.getChildProfile();
        if (!p) return null;

        // Use the analysis logic to determine weak subjects
        const analysis = this.analyzeProfile();
        const matiere = (analysis?.matieres_a_renforcer && analysis.matieres_a_renforcer.length > 0)
            ? analysis.matieres_a_renforcer[0]
            : (p.matiere || 'Général');

        const niveau = p.q_niveau ? this.formatNiveau(p.q_niveau) : (p.niveau || 'CE1');

        return {
            niveauScolaire: niveau,
            matieresEnDifficulte: matiere,
            pointsAAmeliorer: p.q_obs || 'Aucune observation',
            rawNiveau: niveau,
            rawMatiere: matiere,
            rawDifficulte: p.difficulte
        };
    }

    /**
     * For verification: Simulates receiving the mock data provided by the user.
     */
    simulateMockData(): void {
        const mockData = {
            "q_age": 8,
            "q_niveau": "4", // CE1/CE2 approx
            "q_math": 8, // Faible en math -> devrait déclencher la recherche Math
            "q_science": 14,
            "q_anglais": 12,
            "q_obs": "Manque de concentration"
        };
        this.updateChildProfile(mockData);
    }

    formatNiveau(val: string): string {
        const niveaux: { [key: string]: string } = {
            '0': 'Maternelle',
            '1': '1ère année',
            '2': '2ème année',
            '3': '3ème année',
            '4': '4ème année',
            '5': '5ème année',
            '6': '6ème année',
            '7': '7ème année',
            '8': '8ème année',
            '9': '9ème année'
        };
        return niveaux[val] || val;
    }

    analyzeProfile(): any {
        const profile = this.getChildProfile();
        if (!profile) return null;

        // Support both old keys (math) and new keys (q_math) if needed, but prioritizing new
        const getScore = (key: string) => profile[key] !== undefined ? Number(profile[key]) : undefined;

        const subjects = [
            { id: 'math', name: 'Mathématiques', score: getScore('q_math') },
            { id: 'science', name: 'Éveil scientifique', score: getScore('q_science') },
            { id: 'anglais', name: 'Anglais', score: getScore('q_anglais') }
        ];

        // Identifier les matières nécessitant un renforcement (score < 12)
        const weakSubjects = subjects
            .filter(s => s.score !== undefined && s.score < 12)
            .map(s => s.name);

        return {
            niveau_scolaire: profile.q_niveau ? this.formatNiveau(profile.q_niveau) : '',
            matieres_a_renforcer: weakSubjects,
            besoin_aide: weakSubjects.length > 0
        };
    }
}
