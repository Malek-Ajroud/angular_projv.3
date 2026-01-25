import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextService } from '../../services/context.service';

@Component({
    selector: 'app-questionnaire',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.css']
})
export class QuestionnaireComponent {
    currentLang: 'fr' | 'ar' = 'fr';

    formData: any = {
        q_age: null,
        q_niveau: '',
        q_moyenne: null,
        q_math: null,
        q_science: null,
        q_anglais: null,
        q_obs: '',
        q_comportement: ''
    };

    constructor(
        private contextService: ContextService,
        private router: Router
    ) {
        // Load existing data if any
        const existing = this.contextService.getChildProfile();
        if (existing) {
            this.formData = { ...this.formData, ...existing };
        }
    }

    toggleLanguage(): void {
        this.currentLang = this.currentLang === 'fr' ? 'ar' : 'fr';
    }

    onSubmit(): void {
        console.log('Questionnaire soumis avec les données:', this.formData);
        this.contextService.updateChildProfile(this.formData);
        alert('Questionnaire enregistré avec succès !');
        this.router.navigate(['/chat']); // Navigate to chat to see the context in action
    }
}
