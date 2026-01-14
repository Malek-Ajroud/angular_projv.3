/**
 * PURPOSE: Handles user login and session initialization.
 * CONTENT: Login form, credential validation, and redirection to the dashboard.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    email = '';
    password = '';
    errorMessage = '';
    isLoading = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit(): void {
        if (!this.email || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.success) {
                    this.router.navigate(['/chat']);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.error?.message || 'Erreur de connexion. Veuillez réessayer.';
            }
        });
    }
}
