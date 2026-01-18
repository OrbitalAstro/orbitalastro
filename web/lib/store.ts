// Store using zustand with localStorage persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  apiKey?: string;
  language?: string;
  theme?: string;
  defaultBirthDate?: string;
  defaultBirthTime?: string;
  defaultFirstName?: string;
  defaultLastName?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
  defaultTimezone?: string;
  houseSystem?: string;
  includeExtraObjects?: boolean;
  useTopocentricMoon?: boolean;
  includeAspects?: boolean;
  narrativeTone?: string;
  narrativeDepth?: string;
  narrativeFocus?: string[];
  interpretationPrompt?: string;
  chartStyle?: string;
  chartSize?: number;
  updateSettings?: (updates: Partial<SettingsState>) => void;
  resetSettings?: () => void;
}

interface ChartHistoryState {
  history: unknown[];
  addChart: (chart: unknown) => void;
  removeChart: (id: string) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      defaultBirthDate: '',
      defaultBirthTime: '12:00',
      defaultFirstName: '',
      defaultLastName: '',
      defaultLatitude: 0,
      defaultLongitude: 0,
      defaultTimezone: 'UTC',
      houseSystem: 'placidus',
      includeExtraObjects: false,
      useTopocentricMoon: false,
      includeAspects: true,
      narrativeTone: 'mythic',
      narrativeDepth: 'standard',
      narrativeFocus: [],
      chartSize: 800,
      updateSettings: (updates) => set((state) => ({ ...state, ...updates })),
      resetSettings: () => set({
        language: 'fr',
        defaultBirthDate: '',
        defaultBirthTime: '12:00',
        defaultFirstName: '',
        defaultLastName: '',
        defaultLatitude: 0,
        defaultLongitude: 0,
        defaultTimezone: 'UTC',
        houseSystem: 'placidus',
        includeExtraObjects: false,
        useTopocentricMoon: false,
        includeAspects: true,
        narrativeTone: 'mythic',
        narrativeDepth: 'standard',
        narrativeFocus: [],
        chartSize: 800,
      }),
    }),
    {
      name: 'orbitalastro-settings',
      // Only persist sensitive data like API keys
      partialize: (state) => ({
        language: state.language,
        defaultTimezone: state.defaultTimezone,
        houseSystem: state.houseSystem,
        includeExtraObjects: state.includeExtraObjects,
        useTopocentricMoon: state.useTopocentricMoon,
        includeAspects: state.includeAspects,
        narrativeTone: state.narrativeTone,
        narrativeDepth: state.narrativeDepth,
        narrativeFocus: state.narrativeFocus,
        interpretationPrompt: state.interpretationPrompt,
        chartStyle: state.chartStyle,
        chartSize: state.chartSize,
      }),
    }
  )
);

export const useChartHistory = create<ChartHistoryState>((set) => ({
  history: [],
  addChart: (chart) => set((state) => ({ history: [...state.history, chart] })),
  removeChart: (id) => set((state) => ({ 
    history: state.history.filter((c: { id?: string }) => c.id !== id) 
  })),
  clearHistory: () => set({ history: [] }),
  removeFromHistory: (id) => set((state) => ({ 
    history: state.history.filter((c: { id?: string }) => c.id !== id) 
  }))
}));

export const useStore = create(() => ({}));
