export interface SourceReference {
  name: string;        // Ej: "Banco Central de Chile", "DIPRES", "INE", "BCN"
  url?: string;
  reportTitle?: string;// Ej: "Cuentas Nacionales 1990-1994", "Encuesta CASEN 2000"
}

export interface MetricValue {
  initial?: number;          // Valor al asumir
  final?: number;            // Valor al entregar el mando (o actual si está en curso)
  average?: number;          // Promedio del periodo (útil para PIB o inflación anual)
  accumulated?: number;      // Acumulado del periodo (útil para inflación)
  unit: '%' | 'USD' | 'CLP' | 'puntos' | 'tasa_por_100k' | 'ratio';
  notes?: string;            // Matiz metodológico (ej: "Cambio de base CASEN en 2013")
  sources: SourceReference[];
}

export interface QualitativeMilestone {
  title: string;
  year: number;
  description: string;
  category: 'reforma_legal' | 'institucionalidad' | 'programa_social' | 'infraestructura' | 'derechos_humanos';
  impact: string;            // Descripción objetiva y verificable del alcance
  lawNumber?: string;        // Ej: "Ley N° 19.966" (AUGE), "Ley N° 20.845" (Inclusión)
  sources: SourceReference[];
}

export interface MacroEconomy {
  gdpGrowthRate: MetricValue;        // Crecimiento PIB anual promedio
  inflationRate: MetricValue;        // Inflación promedio y acumulada
  unemploymentRate: MetricValue;     // Desempleo inicio vs. fin
  grossPublicDebtPibRatio: MetricValue; // Deuda pública bruta (% PIB)
  copperPriceAverageUSD: MetricValue;// Variable exógena clave para Chile (USD/lb)
}

export interface SocialIndicators {
  povertyRate: MetricValue;          // Pobreza por ingresos (CASEN)
  extremePovertyRate: MetricValue;   // Extrema pobreza
  giniCoefficient: MetricValue;       // Desigualdad de ingresos
  minimumWageRealChange: MetricValue;// Variación real del salario mínimo
}

export interface ExogenousContext {
  globalShocks: string[];            // Ej: "Crisis Asiática (1998)", "Pandemia COVID-19", etc.
  naturalDisasters: string[];        // Ej: "Terremoto 27F (2010)"
  legislativeComposition: {
    senateMajority: 'oposicion' | 'oficialismo' | 'dividido';
    chamberMajority: 'oposicion' | 'oficialismo' | 'dividido';
  };
}

export interface PresidentAdministration {
  id: string;                        // Slug único: ej. "patricio-aylwin-1990", "sebastian-pinera-2010"
  presidentName: string;
  termNumber: number;                // 1 para primer mandato, 2 para segundo mandato
  period: {
    startYear: number;
    endYear: number | null;          // null si es el mandato en ejercicio
    startDate: string;               // YYYY-MM-DD
    endDate: string | null;          // YYYY-MM-DD
    isCurrentTerm: boolean;
  };
  politicalAffiliation: {
    party: string;                   // Ej: "Partido Demócrata Cristiano"
    coalition: string;               // Ej: "Concertación de Partidos por la Democracia"
    spectrum: 'centro-izquierda' | 'centro' | 'centro-derecha' | 'izquierda' | 'derecha';
  };
  portraitUrl: string;

  // Contexto país y fuerzas externas
  context: ExogenousContext;

  // Métricas duras estandarizadas (ideales para gráficos comparativos de 2 a 4 mandatos)
  macroEconomy: MacroEconomy;
  social: SocialIndicators;

  // Hitos cualitativos documentados con fuente legislativa
  milestones: QualitativeMilestone[];
}

// Interfaz liviana para el índice / catálogo y selectores de comparación
export interface PresidentSummary {
  id: string;
  presidentName: string;
  termNumber: number;
  startYear: number;
  endYear: number | null;
  coalition: string;
  portraitUrl: string;
  isCurrentTerm: boolean;
}

