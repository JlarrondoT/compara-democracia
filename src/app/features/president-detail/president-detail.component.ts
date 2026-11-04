import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PresidentService } from '../../core/services/president.service';
import {
  MetricValue,
  PresidentAdministration,
  QualitativeMilestone
} from '../../core/models/president.model';

export interface DisplayMetricCard {
  key: string;
  label: string;
  subtitle: string;
  metric: MetricValue;
  inversePolarity?: boolean;
}

@Component({
  selector: 'app-president-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './president-detail.component.html',
  styleUrl: './president-detail.component.css'
})
export class PresidentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly presidentService = inject(PresidentService);

  readonly administration = signal<PresidentAdministration | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeMilestoneCategory = signal<QualitativeMilestone['category'] | 'all'>('all');

  readonly macroCards = computed<DisplayMetricCard[]>(() => {
    const admin = this.administration();
    if (!admin) {
      return [];
    }
    const m = admin.macroEconomy;
    return [
      {
        key: 'gdpGrowthRate',
        label: 'Crecimiento del PIB Anual',
        subtitle: 'Promedio anual de variación del PIB real',
        metric: m.gdpGrowthRate
      },
      {
        key: 'inflationRate',
        label: 'Tasa de Inflación (IPC)',
        subtitle: 'Variación anual de precios (Inicio vs. Fin y Promedio)',
        metric: m.inflationRate,
        inversePolarity: true
      },
      {
        key: 'unemploymentRate',
        label: 'Tasa de Desempleo Nacional',
        subtitle: 'Desocupación al inicio vs. cierre del mandato',
        metric: m.unemploymentRate,
        inversePolarity: true
      },
      {
        key: 'grossPublicDebtPibRatio',
        label: 'Deuda Pública Bruta (% PIB)',
        subtitle: 'Deuda bruta del Gobierno Central sobre el PIB',
        metric: m.grossPublicDebtPibRatio,
        inversePolarity: true
      },
      {
        key: 'copperPriceAverageUSD',
        label: 'Precio Promedio del Cobre',
        subtitle: 'Variable exógena clave en bolsa internacional (USD/lb)',
        metric: m.copperPriceAverageUSD
      }
    ];
  });

  readonly socialCards = computed<DisplayMetricCard[]>(() => {
    const admin = this.administration();
    if (!admin) {
      return [];
    }
    const s = admin.social;
    return [
      {
        key: 'povertyRate',
        label: 'Tasa de Pobreza por Ingresos',
        subtitle: 'Población bajo la línea de pobreza (Encuesta CASEN)',
        metric: s.povertyRate,
        inversePolarity: true
      },
      {
        key: 'extremePovertyRate',
        label: 'Pobreza Extrema / Indigencia',
        subtitle: 'Población en situación de extrema pobreza (CASEN)',
        metric: s.extremePovertyRate,
        inversePolarity: true
      },
      {
        key: 'giniCoefficient',
        label: 'Coeficiente de Gini',
        subtitle: 'Índice de concentración y desigualdad de ingresos (0 a 1)',
        metric: s.giniCoefficient,
        inversePolarity: true
      },
      {
        key: 'minimumWageRealChange',
        label: 'Variación Real del Salario Mínimo',
        subtitle: 'Crecimiento real descontada la inflación del período',
        metric: s.minimumWageRealChange
      }
    ];
  });

  readonly filteredMilestones = computed<QualitativeMilestone[]>(() => {
    const admin = this.administration();
    if (!admin) {
      return [];
    }
    const category = this.activeMilestoneCategory();
    if (category === 'all') {
      return admin.milestones;
    }
    return admin.milestones.filter(item => item.category === category);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAdministration(id);
      } else {
        this.errorMessage.set('Identificador de mandato no válido.');
        this.isLoading.set(false);
      }
    });
  }

  loadAdministration(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.presidentService.getPresidentById(id).subscribe({
      next: data => {
        this.administration.set(data);
        this.activeMilestoneCategory.set('all');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          `No se encontró el expediente técnico para el identificador "${id}".`
        );
        this.isLoading.set(false);
      }
    });
  }

  setMilestoneCategory(category: QualitativeMilestone['category'] | 'all'): void {
    this.activeMilestoneCategory.set(category);
  }

  toggleCompareCurrent(): void {
    const admin = this.administration();
    if (!admin) {
      return;
    }
    this.presidentService.toggleCompareSelection(admin.id);
  }

  formatUnit(value: number | undefined, unit: MetricValue['unit']): string {
    if (value === undefined) {
      return '—';
    }
    switch (unit) {
      case '%':
        return `${value}%`;
      case 'USD':
        return `USD ${value.toFixed(2)}`;
      case 'CLP':
        return `$${value.toLocaleString('es-CL')} CLP`;
      case 'ratio':
        return value.toFixed(2);
      case 'puntos':
        return `${value} pts`;
      case 'tasa_por_100k':
        return `${value} / 100k`;
    }
  }

  calculateDelta(metric: MetricValue): { text: string; deltaValue: number } | null {
    if (metric.initial === undefined || metric.final === undefined) {
      return null;
    }
    const rawDelta = Number((metric.final - metric.initial).toFixed(2));
    const sign = rawDelta > 0 ? '+' : '';
    const suffix = metric.unit === '%' ? ' pp' : '';
    return {
      text: `${sign}${rawDelta}${suffix}`,
      deltaValue: rawDelta
    };
  }

  getCategoryLabel(category: QualitativeMilestone['category']): string {
    switch (category) {
      case 'reforma_legal':
        return 'Reforma Legal / Constitucional';
      case 'institucionalidad':
        return 'Institucionalidad Pública';
      case 'programa_social':
        return 'Programa y Protección Social';
      case 'infraestructura':
        return 'Infraestructura y Obras Públicas';
      case 'derechos_humanos':
        return 'Derechos Humanos y Memoria';
    }
  }

  getMajorityLabel(majority: 'oposicion' | 'oficialismo' | 'dividido'): string {
    switch (majority) {
      case 'oficialismo':
        return 'Mayoría Oficialista';
      case 'oposicion':
        return 'Mayoría de Oposición';
      case 'dividido':
        return 'Composición Dividida / Paritaria';
    }
  }
}

