import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PresidentService } from '../../core/services/president.service';
import {
  MetricValue,
  PresidentAdministration,
  PresidentSummary
} from '../../core/models/president.model';

export interface ComparisonMetricRow {
  id: string;
  group: 'Macroeconomía y Finanzas Públicas' | 'Indicadores Sociales y Distributivos';
  label: string;
  description: string;
  inversePolarity?: boolean;
  extractor: (admin: PresidentAdministration) => MetricValue;
}

@Component({
  selector: 'app-comparator',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './comparator.component.html',
  styleUrl: './comparator.component.css'
})
export class ComparatorComponent implements OnInit {
  readonly presidentService = inject(PresidentService);

  readonly catalog = signal<PresidentSummary[]>([]);
  readonly selectedAdministrations = signal<PresidentAdministration[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly warningBanner = signal<string | null>(null);

  /** Definición tipada de las filas comparativas sincronizadas */
  readonly metricRows: readonly ComparisonMetricRow[] = [
    {
      id: 'gdp',
      group: 'Macroeconomía y Finanzas Públicas',
      label: 'Crecimiento del PIB Anual',
      description: 'Tasa promedio anual de crecimiento del PIB real',
      extractor: admin => admin.macroEconomy.gdpGrowthRate
    },
    {
      id: 'inflation',
      group: 'Macroeconomía y Finanzas Públicas',
      label: 'Inflación (IPC)',
      description: 'Tasa inicial vs. final y promedio anual del período',
      inversePolarity: true,
      extractor: admin => admin.macroEconomy.inflationRate
    },
    {
      id: 'debt',
      group: 'Macroeconomía y Finanzas Públicas',
      label: 'Deuda Pública Bruta (% PIB)',
      description: 'Deuda bruta del Gobierno Central como porcentaje del PIB',
      inversePolarity: true,
      extractor: admin => admin.macroEconomy.grossPublicDebtPibRatio
    },
    {
      id: 'unemployment',
      group: 'Macroeconomía y Finanzas Públicas',
      label: 'Tasa de Desempleo Nacional',
      description: 'Desocupación al inicio y término del mandato',
      inversePolarity: true,
      extractor: admin => admin.macroEconomy.unemploymentRate
    },
    {
      id: 'copper',
      group: 'Macroeconomía y Finanzas Públicas',
      label: 'Precio Promedio del Cobre',
      description: 'Cotización internacional promedio en USD por libra',
      extractor: admin => admin.macroEconomy.copperPriceAverageUSD
    },
    {
      id: 'poverty',
      group: 'Indicadores Sociales y Distributivos',
      label: 'Pobreza por Ingresos (CASEN)',
      description: 'Porcentaje de población en situación de pobreza al inicio y término',
      inversePolarity: true,
      extractor: admin => admin.social.povertyRate
    },
    {
      id: 'extreme-poverty',
      group: 'Indicadores Sociales y Distributivos',
      label: 'Pobreza Extrema / Indigencia',
      description: 'Porcentaje de población en extrema pobreza',
      inversePolarity: true,
      extractor: admin => admin.social.extremePovertyRate
    },
    {
      id: 'minimum-wage',
      group: 'Indicadores Sociales y Distributivos',
      label: 'Salario Mínimo (Variación Real)',
      description: 'Crecimiento porcentual real acumulado durante el mandato',
      extractor: admin => admin.social.minimumWageRealChange
    },
    {
      id: 'gini',
      group: 'Indicadores Sociales y Distributivos',
      label: 'Coeficiente de Gini',
      description: 'Desigualdad de ingresos (0 = igualdad perfecta, 1 = desigualdad máxima)',
      inversePolarity: true,
      extractor: admin => admin.social.giniCoefficient
    }
  ];

  readonly macroRows = computed(() =>
    this.metricRows.filter(r => r.group === 'Macroeconomía y Finanzas Públicas')
  );

  readonly socialRows = computed(() =>
    this.metricRows.filter(r => r.group === 'Indicadores Sociales y Distributivos')
  );

  constructor() {
    effect(() => {
      const ids = this.presidentService.selectedCompareIds();
      this.loadSelectedDetails(ids);
    });
  }

  ngOnInit(): void {
    this.presidentService.getPresidentsCatalog().subscribe({
      next: summaries => {
        this.catalog.set(summaries);
      }
    });
  }

  private loadSelectedDetails(ids: string[]): void {
    if (ids.length === 0) {
      this.selectedAdministrations.set([]);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.presidentService.getPresidentsByIds(ids).subscribe({
      next: admins => {
        const sorted = [...admins].sort((a, b) => a.period.startYear - b.period.startYear);
        this.selectedAdministrations.set(sorted);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onTogglePresident(id: string): void {
    this.warningBanner.set(null);
    const result = this.presidentService.toggleCompareSelection(id);
    if (result.limitReached) {
      this.warningBanner.set(
        'Has alcanzado el máximo de 4 administraciones simultáneas. Desmarca una para seleccionar otra.'
      );
    }
  }

  selectAllAvailableUpToFour(): void {
    this.warningBanner.set(null);
    const firstFour = this.catalog()
      .slice(0, 4)
      .map(item => item.id);
    this.presidentService.selectedCompareIds.set(firstFour);
  }

  clearSelection(): void {
    this.warningBanner.set(null);
    this.presidentService.clearCompareSelection();
  }

  formatValue(value: number | undefined, unit: MetricValue['unit']): string {
    if (value === undefined) {
      return '—';
    }
    switch (unit) {
      case '%':
        return `${value}%`;
      case 'USD':
        return `USD ${value.toFixed(2)}`;
      case 'CLP':
        return `$${value.toLocaleString('es-CL')}`;
      case 'ratio':
        return value.toFixed(2);
      case 'puntos':
        return `${value} pts`;
      case 'tasa_por_100k':
        return `${value}`;
    }
  }

  getDeltaInfo(
    metric: MetricValue
  ): { label: string; numericDelta: number } | null {
    if (metric.initial === undefined || metric.final === undefined) {
      return null;
    }
    const diff = Number((metric.final - metric.initial).toFixed(2));
    const sign = diff > 0 ? '+' : '';
    const suffix = metric.unit === '%' ? ' pp' : '';
    return {
      label: `${sign}${diff}${suffix}`,
      numericDelta: diff
    };
  }

  getMajorityLabel(majority: 'oposicion' | 'oficialismo' | 'dividido'): string {
    switch (majority) {
      case 'oficialismo':
        return 'Oficialismo';
      case 'oposicion':
        return 'Oposición';
      case 'dividido':
        return 'Dividido';
    }
  }
}

