import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChildService, Child } from '../../services/child.service';

@Component({
    selector: 'app-ajouter-enfant',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ajouter-enfant.component.html',
    styleUrls: ['./ajouter-enfant.component.css']
})
export class AjouterEnfantComponent implements OnInit {
    // Using partial because for new child ID is not present initially
    child: any = {
        gender: 'boy'
    };
    isSubmitting = false;
    successMessage = '';
    isEditMode = false;
    futureDateError = false;

    constructor(
        private childService: ChildService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.childService.getChild(id).subscribe({
                next: (data) => {
                    this.child = data;
                    // Format date for input[type=date] which needs yyyy-MM-dd
                    if (this.child.birthDate) {
                        const d = new Date(this.child.birthDate);
                        const year = d.getFullYear();
                        const month = ('0' + (d.getMonth() + 1)).slice(-2);
                        const day = ('0' + d.getDate()).slice(-2);
                        this.child.birthDate = `${year}-${month}-${day}`;
                    }
                },
                error: (err) => {
                    console.error("Erreur chargement enfant:", err);
                    this.router.navigate(['/mes-enfants']);
                }
            });
        }
    }

    validateDate(): void {
        if (!this.child.birthDate) return;
        const date = new Date(this.child.birthDate);
        const now = new Date();
        if (date > now) {
            this.futureDateError = true;
        } else {
            this.futureDateError = false;
        }
    }

    submitForm(form: any): void {
        if (form.valid && !this.futureDateError) {
            this.isSubmitting = true;

            // Ensure birthDate is Date object for service if needed, 
            // but service takes object. Service logic might need adjustment if it expects Date vs string.
            // Our service implementation:
            // if (typeof child.birthDate === 'string') child.birthDate = new Date(child.birthDate);
            // So string from input is fine.

            let obs;
            if (this.isEditMode) {
                obs = this.childService.updateChild(this.child);
            } else {
                obs = this.childService.addChild(this.child);
            }

            obs.subscribe({
                next: () => {
                    this.successMessage = this.isEditMode ? "Modifications enregistrées !" : "Enfant ajouté avec succès !";
                    this.isSubmitting = false;
                    setTimeout(() => {
                        this.router.navigate(['/mes-enfants']);
                    }, 1500);
                },
                error: (err) => {
                    console.error("Erreur:", err);
                    this.isSubmitting = false;
                }
            });
        }
    }
}
