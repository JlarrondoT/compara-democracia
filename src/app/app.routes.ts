import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'presidents',
    pathMatch: 'full'
  },
  {
    path: 'presidents',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
    title: 'Catálogo Cronológico (1990–Presente) | Compara Democracia'
  },
  {
    path: 'presidents/:id',
    loadComponent: () =>
      import('./features/president-detail/president-detail.component').then(
        m => m.PresidentDetailComponent
      ),
    title: 'Ficha Presidencial | Compara Democracia'
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./features/comparator/comparator.component').then(m => m.ComparatorComponent),
    title: 'Comparador Multidimensional | Compara Democracia'
  },
  {
    path: '**',
    redirectTo: 'presidents'
  }
];

