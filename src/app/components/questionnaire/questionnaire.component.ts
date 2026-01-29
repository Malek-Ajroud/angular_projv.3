import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextService } from '../../services/context.service';
import { AuthService } from '../../services/auth.service';

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
        q_nom: '',
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
        private authService: AuthService,
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

    // Validation du nom de l'enfant
    onSubmit(): void {
        // Vérifier le nom
        if (!this.formData.q_nom || this.formData.q_nom.trim() === '') {
            alert(this.currentLang === 'fr'
                ? 'Veuillez saisir le nom de l\'enfant.'
                : 'يرجى إدخال اسم الطفل');
            return;
        }

        // Vérifier l'âge
        if (this.formData.q_age === null || this.formData.q_age < 5 || this.formData.q_age > 15) {
            alert(this.currentLang === 'fr'
                ? 'L\'âge doit être compris strictement entre 5 et 15 ans.'
                : 'يجب أن يكون العمر بين 5 و15 سنة');
            return;
        }

        // Vérifier les notes
        if (this.formData.q_anglais < 0 || this.formData.q_anglais > 20 ||
            this.formData.q_math < 0 || this.formData.q_math > 20 ||
            this.formData.q_science < 0 || this.formData.q_science > 20 ||
            this.formData.q_moyenne < 0 || this.formData.q_moyenne > 20) {
            alert(this.currentLang === 'fr'
                ? 'Les notes doivent être comprises entre 0 et 20.'
                : 'يجب أن تكون الملاحظات بين 0 و 20');
            return;
        }

        console.log('Questionnaire soumis avec les données:', this.formData);

        // Récupérer l'ID utilisateur et sauvegarder
        const currentUser = this.authService.getCurrentUser();
        const userId = currentUser?.id;

        this.contextService.updateChildProfile(this.formData, userId);

        const childName = this.formData.q_nom;
        alert(this.currentLang === 'fr'
            ? `Profil de ${childName} enregistré avec succès ! L'assistant va analyser ses besoins.`
            : `تم تسجيل ملف ${childName} بنجاح! سيقوم المساعد بتحليل احتياجاته.`);

        this.router.navigate(['/chat']);
    }
}
