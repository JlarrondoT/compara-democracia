import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { PresidentAdministration, PresidentSummary } from '../models/president.model';

@Injectable({
  providedIn: 'root'
})
export class PresidentService {
  private readonly http = inject(HttpClient);

  /**
   * URL base desacoplada para lectura de datos.
   * Para migrar a una API REST (ej. `https://api.comparademocracia.cl/v1/presidents`),
   * basta con reemplazar esta constante y ajustar los endpoints sin alterar ningún componente UI.
   */
  private readonly baseUrl = 'assets/data';

  /** Caché reactiva en memoria para evitar peticiones redundantes */
  private catalogCache$: Observable<PresidentSummary[]> | null = null;
  private readonly detailCache = new Map<string, Observable<PresidentAdministration>>();

  /** Estado reactivo global de búsqueda rápida en la barra de navegación */
  readonly searchQuery = signal<string>('');

  /**
   * Estado reactivo global del Comparador Multidimensional (entre 2 y 4 mandatos recomendados).
   * Inicializamos con 2 administraciones por defecto para validar la comparativa desde el día 1.
   */
  readonly selectedCompareIds = signal<string[]>([
    'patricio-aylwin-1990',
    'eduardo-frei-1994'
  ]);

  readonly compareCount = computed(() => this.selectedCompareIds().length);
  readonly canAddMoreToCompare = computed(() => this.selectedCompareIds().length < 4);
  readonly isReadyToCompare = computed(() => this.selectedCompareIds().length >= 2);

  /**
   * Obtiene el catálogo resumido de mandatos presidenciales.
   * Contrato estricto requerido: `getPresidentsCatalog(): Observable<PresidentSummary[]>`
   */
  getPresidentsCatalog(): Observable<PresidentSummary[]> {
    if (!this.catalogCache$) {
      this.catalogCache$ = this.http
        .get<PresidentSummary[]>(`${this.baseUrl}/presidents-catalog.json`)
        .pipe(
          map(items => [...items].sort((a, b) => a.startYear - b.startYear)),
          shareReplay(1)
        );
    }
    return this.catalogCache$;
  }

  /**
   * Obtiene la ficha técnica completa de una administración por su slug identificador.
   * Contrato estricto requerido: `getPresidentById(id: string): Observable<PresidentAdministration>`
   */
  getPresidentById(id: string): Observable<PresidentAdministration> {
    const cached = this.detailCache.get(id);
    if (cached) {
      return cached;
    }

    const request$ = this.http
      .get<PresidentAdministration>(`${this.baseUrl}/${id}.json`)
      .pipe(shareReplay(1));

    this.detailCache.set(id, request$);
    return request$;
  }

  /**
   * Carga en paralelo múltiples administraciones presidenciales para el Comparador Multidimensional.
   */
  getPresidentsByIds(ids: string[]): Observable<PresidentAdministration[]> {
    if (ids.length === 0) {
      return of([]);
    }
    return forkJoin(ids.map(id => this.getPresidentById(id)));
  }

  /**
   * Verifica si una administración está actualmente seleccionada en el comparador.
   */
  isSelectedForCompare(id: string): boolean {
    return this.selectedCompareIds().includes(id);
  }

  /**
   * Agrega o quita una administración de la selección de comparación (máximo 4 mandatos).
   */
  toggleCompareSelection(id: string): { added: boolean; limitReached: boolean } {
    const current = this.selectedCompareIds();
    if (current.includes(id)) {
      this.selectedCompareIds.set(current.filter(item => item !== id));
      return { added: false, limitReached: false };
    }

    if (current.length >= 4) {
      return { added: false, limitReached: true };
    }

    this.selectedCompareIds.set([...current, id]);
    return { added: true, limitReached: false };
  }

  /**
   * Limpia o restablece la selección del comparador.
   */
  clearCompareSelection(): void {
    this.selectedCompareIds.set([]);
  }

  /**
   * Actualiza el filtro de búsqueda global.
   */
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }
}

