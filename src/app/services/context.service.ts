import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ContextService {
    private childProfileSubject = new BehaviorSubject<any>(null);
    childProfile$ = this.childProfileSubject.asObservable();

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

    updateChildProfile(profile: any): void {
        const cleanProfile = this.filterEmptyFields(profile);
        this.childProfileSubject.next(cleanProfile);
        localStorage.setItem('child_profile', JSON.stringify(cleanProfile));
    }

    getChildProfile(): any {
        return this.childProfileSubject.value;
    }

    hasData(): boolean {
        const profile = this.getChildProfile();
        return profile && Object.keys(profile).length > 0;
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

    getFormattedContext(): string {
        const profile = this.getChildProfile();
        if (!profile || Object.keys(profile).length === 0) {
            return '';
        }

        let context = '\n\nCONTEXTE DE L\'ENFANT (fourni par le parent via un questionnaire) :\n';
        if (profile.q_age) context += `- Âge : ${profile.q_age} ans\n`;
        if (profile.q_niveau) context += `- Niveau d'études : ${this.formatNiveau(profile.q_niveau)}\n`;
        if (profile.q_moyenne) context += `- Moyenne générale : ${profile.q_moyenne}/20\n`;
        if (profile.q_math) context += `- Note en mathématiques : ${profile.q_math}/20\n`;
        if (profile.q_science) context += `- Note en éveil scientifique : ${profile.q_science}/20\n`;
        if (profile.q_anglais) context += `- Note en Anglais : ${profile.q_anglais}/20\n`;
        if (profile.q_obs) context += `- Observations des enseignants : ${profile.q_obs}\n`;

        return context;
    }

    private formatNiveau(val: string): string {
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

    /**
     * Analyse le profil de l'enfant pour en extraire des insights exploitables.
     */
    analyzeProfile(): any {
        const profile = this.getChildProfile();
        if (!profile) return null;

        const subjects = [
            { id: 'math', name: 'Mathématiques', score: profile.q_math },
            { id: 'science', name: 'Éveil scientifique', score: profile.q_science },
            { id: 'anglais', name: 'Anglais', score: profile.q_anglais }
        ];

        // Identifier les matières nécessitant un renforcement (score < 10 ou 12 selon les critères)
        const weakSubjects = subjects
            .filter(s => s.score !== undefined && s.score < 10)
            .map(s => s.name);

        const analysis = {
            niveau_scolaire: this.formatNiveau(profile.q_niveau),
            matieres_a_renforcer: weakSubjects,
            besoin_aide: weakSubjects.length > 0,
            params_api_educative: {
                level: profile.q_niveau,
                subjects: weakSubjects,
                age: profile.q_age
            }
        };

        return analysis;
    }

    /**
     * Retourne un JSON propre et léger pour le chatbot.
     */
    getAnalysisJSON(): string {
        const profile = this.getChildProfile();
        const analysis = this.analyzeProfile();

        return JSON.stringify({
            donnees_parents: profile,
            analyse_automatique: analysis
        }, null, 2);
    }
}
