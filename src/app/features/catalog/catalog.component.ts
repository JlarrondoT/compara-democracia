import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PresidentService } from '../../core/services/president.service';
import { PresidentSummary } from '../../core/models/president.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.css'
})
export class CatalogComponent implements OnInit {
  readonly presidentService = inject(PresidentService);

  readonly catalog = signal<PresidentSummary[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedCoalition = signal<string>('all');
  readonly feedbackToast = signal<string | null>(null);

  /** Lista de coaliciones únicas presentes en el catálogo */
  readonly availableCoalitions = computed(() => {
    const items = this.catalog();
    const coalitions = new Set<string>(items.map(item => item.coalition));
    return Array.from(coalitions);
  });

  /** Catálogo filtrado reactivamente según el buscador global y el filtro de coalición */
  readonly filteredCatalog = computed(() => {
    const query = this.presidentService.searchQuery().trim().toLowerCase();
    const coalition = this.selectedCoalition();

    return this.catalog().filter(item => {
      const matchesCoalition = coalition === 'all' || item.coalition === coalition;
      if (!matchesCoalition) {
        return false;
      }

      if (!query) {
        return true;
      }

      const endYearStr = item.endYear ? String(item.endYear) : 'presente';
      const searchableText = `${item.presidentName} ${item.coalition} ${item.startYear} ${endYearStr}`.toLowerCase();
      return searchableText.includes(query);
    });
  });

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.presidentService.getPresidentsCatalog().subscribe({
      next: data => {
        this.catalog.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('No se pudo cargar el catálogo de administraciones presidenciales.');
        this.isLoading.set(false);
      }
    });
  }

  onToggleCompare(summary: PresidentSummary): void {
    const result = this.presidentService.toggleCompareSelection(summary.id);
    if (result.limitReached) {
      this.showToast('El comparador admite un máximo de 4 administraciones simultáneas.');
      return;
    }

    if (result.added) {
      this.showToast(`"${summary.presidentName}" agregado al comparador.`);
    } else {
      this.showToast(`"${summary.presidentName}" removido del comparador.`);
    }
  }

  setCoalitionFilter(coalition: string): void {
    this.selectedCoalition.set(coalition);
  }

  resetFilters(): void {
    this.selectedCoalition.set('all');
    this.presidentService.setSearchQuery('');
  }

  private showToast(message: string): void {
    this.feedbackToast.set(message);
    setTimeout(() => {
      if (this.feedbackToast() === message) {
        this.feedbackToast.set(null);
      }
    }, 3200);
  }
}

