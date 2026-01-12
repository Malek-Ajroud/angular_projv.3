import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService, User } from '../../services/account.service';

@Component({
    selector: 'app-gerer-compte',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './gerer-compte.component.html',
    styleUrls: ['./gerer-compte.component.css']
})
export class GererCompteComponent implements OnInit {
    user: any = {};
    loading = true;
    saving = false;
    deleting = false;
    message = {
        text: '',
        type: '' // 'success' or 'error'
    };

    constructor(
        private accountService: AccountService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.accountService.getAccount().subscribe(data => {
            this.user = data || {};
            this.loading = false;
        });
    }

    updateAccount(form: any): void {
        if (form.valid) {
            this.saving = true;
            this.message.text = '';

            this.accountService.updateAccount(this.user).subscribe({
                next: () => {
                    this.saving = false;
                    this.message.text = 'Modifications enregistrées avec succès.';
                    this.message.type = 'success';
                },
                error: () => {
                    this.saving = false;
                    this.message.text = 'Erreur lors de la sauvegarde.';
                    this.message.type = 'error';
                }
            });
        }
    }

    deleteAccount(): void {
        if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            this.deleting = true;
            this.accountService.deleteAccount().subscribe(() => {
                alert('Votre compte a été supprimé.');
                this.router.navigate(['/']);
            });
        }
    }
}
