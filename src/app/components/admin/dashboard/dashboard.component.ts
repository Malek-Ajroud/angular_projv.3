import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  searchTerm: string = '';
  stats = {
    users: 0,
    children: 0,
    conversations: 0
  };
  private apiUrl = environment.PHP_API_URL;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminService: AdminService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.http.get<any>(`${this.apiUrl}/admin/stats.php`).subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
        }
      }
    });
  }

  onSearch(): void {
    this.adminService.setSearchTerm(this.searchTerm);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
