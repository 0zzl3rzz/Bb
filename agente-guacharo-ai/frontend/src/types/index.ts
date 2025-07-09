import React from 'react';

// Tipos para mensajes de chat
export interface ChatMessage {
  id: string;
  message: string;
  type: 'user' | 'ai' | 'system' | 'error';
  timestamp: string;
  charts?: ChartData[];
  recommendations?: Recommendation[];
  conversationContext?: any;
}

// Tipos para gráficos
export interface ChartData {
  type: 'bar' | 'line' | 'doughnut' | 'pie' | 'radar';
  title?: string;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: any;
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

// Tipos para recomendaciones
export interface Recommendation {
  animal: string;
  confidence: number;
  reason: string;
  priority?: number;
}

// Tipos para predicciones
export interface Prediction {
  animal: string;
  probability: number;
  confidence: number;
  reasons?: string[];
  algorithms?: string[];
}

export interface PredictionsResponse {
  next_draw: Prediction[];
  recommendations: Recommendation[];
  trend: string;
  model_confidence: number;
  analysis_timestamp: string;
}

// Tipos para análisis de frecuencias
export interface AnimalStats {
  animal_name: string;
  count: number;
  percentage: number;
  last_appearance?: string;
}

// Tipos para patrones
export interface Pattern {
  detected: string[];
  insights: string[];
  charts: ChartData[];
  cycles: Cycle[];
}

export interface Cycle {
  animal: string;
  type: '3-day' | 'weekly' | 'monthly';
  confidence: number;
  next_expected?: string;
}

// Tipos para resultados de sorteos
export interface DrawResult {
  id: number;
  draw_date: string;
  draw_time: string;
  animal_name: string;
  animal_number: string;
  draw_number: string;
  created_at: string;
}

// Tipos para animales
export interface Animal {
  id: number;
  name: string;
  number: string;
  characteristics: string[];
  lucky_days: string[];
  color_association: string;
  element: string;
}

// Tipos para contexto de chat
export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  suggestions: string[];
  getSuggestions: () => Promise<void>;
}

// Tipos para API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

// Tipos para análisis de datos
export interface AnalysisData {
  timeframe: string;
  statistics: AnimalStats[];
  total_draws: number;
  analysis_timestamp: string;
}

export interface PatternAnalysis {
  timeframe: string;
  animal?: string;
  patterns: string[];
  insights: string[];
  charts: ChartData[];
  cycles: Cycle[];
  analysis_timestamp: string;
}

// Tipos para configuración
export interface AppConfig {
  apiUrl: string;
  socketUrl: string;
  features: {
    nlp: boolean;
    predictions: boolean;
    patterns: boolean;
    charts: boolean;
    openai: boolean;
  };
}

// Tipos para estados de loading
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Tipos para filtros de análisis
export interface AnalysisFilters {
  timeframe: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'recent_days';
  animal?: string;
  sortBy?: 'frequency' | 'date' | 'confidence';
  orderBy?: 'asc' | 'desc';
}

// Tipos para usuarios
export interface User {
  id: string;
  name?: string;
  preferences?: {
    theme: 'light' | 'dark';
    language: 'es' | 'en';
    notifications: boolean;
  };
}

// Tipos para WebSocket
export interface SocketMessage {
  type: 'chat-message' | 'ai-response' | 'error' | 'status';
  data: any;
  timestamp: string;
}

// Tipos para componentes
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface ChartComponentProps extends BaseComponentProps {
  data: ChartData;
  height?: number;
  responsive?: boolean;
}

// Constantes de timeframes
export const TIMEFRAMES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  RECENT_DAYS: 'recent_days'
} as const;

export type TimeframeKey = keyof typeof TIMEFRAMES;
export type TimeframeValue = typeof TIMEFRAMES[TimeframeKey];

// Constantes de animales
export const ANIMAL_EMOJIS: Record<string, string> = {
  'Danta': '🦏',
  'Águila': '🦅',
  'Burro': '🫏',
  'Alacrán': '🦂',
  'León': '🦁',
  'Rana': '🐸',
  'Ratón': '🐭',
  'Tigre': '🐅',
  'Gato': '🐱',
  'Elefante': '🐘',
  'Caimán': '🐊',
  'Gallo': '🐓',
  'Caballo': '🐎',
  'Mono': '🐵',
  'Venado': '🦌',
  'Zorro': '🦊',
  'Oso': '🐻',
  'Pavo': '🦃',
  'Burra': '🫏',
  'Chivo': '🐐',
  'Cochino': '🐷',
  'Culebra': '🐍',
  'Mariposa': '🦋',
  'Perro': '🐕',
  'Zamuro': '🦅',
  'Gallina': '🐔',
  'Iguana': '🦎',
  'Pescado': '🐟',
  'Chucho': '🐟',
  'Perico': '🦜',
  'Morrocoy': '🐢',
  'Lapa': '🐹',
  'Ardilla': '🐿️',
  'Cangrejo': '🦀',
  'Delfín': '🐬',
  'Gavilán': '🦅'
};

// Utilidad para obtener emoji de animal
export const getAnimalEmoji = (animalName: string): string => {
  return ANIMAL_EMOJIS[animalName] || '🔸';
};