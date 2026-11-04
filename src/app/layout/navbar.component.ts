import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PresidentService } from '../core/services/president.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  readonly presidentService = inject(PresidentService);
  private readonly router = inject(Router);

  onSearchInput(value: string): void {
    this.presidentService.setSearchQuery(value);
    if (value.trim().length > 0 && !this.router.url.startsWith('/presidents')) {
      void this.router.navigate(['/presidents']);
    }
  }

  clearSearch(): void {
    this.presidentService.setSearchQuery('');
  }
}

