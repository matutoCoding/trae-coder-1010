import { create } from "zustand"
import type { Trail, Alert } from "@/types"
import {
  mockSnowMakers,
  mockCurrentWeather,
  mockWeatherHistory,
  mockTrails,
  mockGroomingRecords,
  mockLifts,
  mockTickets,
  mockRentals,
  mockInjuries,
  mockPatrols,
  mockSnowPlans,
  mockAlerts,
  mockHourlyFlow,
} from "@/data/mockData"

interface AppState {
  snowMakers: typeof mockSnowMakers
  currentWeather: typeof mockCurrentWeather
  weatherHistory: typeof mockWeatherHistory
  trails: Trail[]
  groomingRecords: typeof mockGroomingRecords
  lifts: typeof mockLifts
  tickets: typeof mockTickets
  rentals: typeof mockRentals
  injuries: typeof mockInjuries
  patrols: typeof mockPatrols
  snowPlans: typeof mockSnowPlans
  alerts: Alert[]
  hourlyFlow: typeof mockHourlyFlow
  sidebarCollapsed: boolean

  toggleTrailStatus: (id: string) => void
  resolveAlert: (id: string) => void
  setSidebarCollapsed: (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  snowMakers: mockSnowMakers,
  currentWeather: mockCurrentWeather,
  weatherHistory: mockWeatherHistory,
  trails: mockTrails,
  groomingRecords: mockGroomingRecords,
  lifts: mockLifts,
  tickets: mockTickets,
  rentals: mockRentals,
  injuries: mockInjuries,
  patrols: mockPatrols,
  snowPlans: mockSnowPlans,
  alerts: mockAlerts,
  hourlyFlow: mockHourlyFlow,
  sidebarCollapsed: false,

  toggleTrailStatus: (id) =>
    set((state) => ({
      trails: state.trails.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "open" ? "closed" : "open" }
          : t
      ),
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    })),

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}))
