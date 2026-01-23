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
<<<<<<< HEAD
                    const user = response.data.user;

                    if (user.role === 'admin') {
=======
                    console.log('Login success:', response);
                    if (this.authService.isAdmin()) {
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
                        this.router.navigate(['/admin']);
                    } else {
                        this.router.navigate(['/accueil']);
                    }
<<<<<<< HEAD
=======
                } else {
                    this.errorMessage = response.message || 'Erreur de connexion';
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
                }
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Login error details:', error);
                this.errorMessage = error.error?.message || `Erreur de connexion (${error.status}: ${error.statusText || 'Serveur injoignable'})`;
            }
        });
    }
}
