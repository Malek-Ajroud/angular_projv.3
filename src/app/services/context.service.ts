import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Interface representing the processed child profile used for AI context.
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
    private childProfileSubject = new BehaviorSubject<ChildProfile | null>(null);
    public childProfile$ = this.childProfileSubject.asObservable();

    constructor() { }

    /**
     * Processes raw questionnaire data to build a ChildProfile.
     * Filters out empty fields and combines relevant information.
     * @param rawData The raw object from the questionnaire form.
     */
    setProfileFromForm(rawData: any): void {
        if (!rawData) return;

        // Filter empty fields (null, undefined, or empty string)
        const cleanData = Object.keys(rawData)
            .filter(key => rawData[key] !== null && rawData[key] !== undefined && rawData[key].toString().trim() !== '')
            .reduce((obj: any, key) => {
                obj[key] = rawData[key];
                return obj;
            }, {});

        // Construct the profile
        const profile: ChildProfile = {
            niveauScolaire: cleanData.niveau || '',
            matieresEnDifficulte: this.formatMatieres(cleanData),
            pointsAAmeliorer: this.formatPointsAAmeliorer(cleanData),
            rawNiveau: cleanData.niveau,
            rawMatiere: cleanData.matiere,
            rawDifficulte: cleanData.difficulte
        };

        console.log('Profil Enfant construit :', profile);
        this.childProfileSubject.next(profile);
    }

    private formatMatieres(data: any): string {
        const parts = [];
        if (data.matiere) parts.push(data.matiere);
        if (data.difficulte) parts.push(`(${data.difficulte})`);
        return parts.join(' ');
    }

    private formatPointsAAmeliorer(data: any): string {
        const parts = [];
        if (data.objectif) parts.push(`Objectif : ${data.objectif}`);
        if (data.comportement) parts.push(`Comportement : ${data.comportement}`);
        return parts.join(' | ');
    }

    /**
     * Returns the current profile value.
     */
    getProfile(): ChildProfile | null {
        return this.childProfileSubject.value;
    }

    /**
     * For verification: Simulates receiving the mock data provided by the user.
     */
    simulateMockData(): void {
        const mockData = {
            "age": 8,
            "niveau": "CE2",
            "matiere": "Mathématiques",
            "difficulte": "Fractions",
            "objectif": "Améliorer la compréhension et la pratique",
            "comportement": "Manque de concentration"
        };
        this.setProfileFromForm(mockData);
    }
}
