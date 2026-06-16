import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Trail, Alert, SnowMaker, SnowPlan, TicketRecord } from "@/types"
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

type TicketScanResult =
  | { success: true; ticket: TicketRecord }
  | { success: false; error: "not_found" | "already_used" | "expired"; ticket?: TicketRecord }

interface AppState {
  snowMakers: SnowMaker[]
  currentWeather: typeof mockCurrentWeather
  weatherHistory: typeof mockWeatherHistory
  trails: Trail[]
  groomingRecords: typeof mockGroomingRecords
  lifts: typeof mockLifts
  tickets: TicketRecord[]
  rentals: typeof mockRentals
  injuries: typeof mockInjuries
  patrols: typeof mockPatrols
  snowPlans: SnowPlan[]
  alerts: Alert[]
  hourlyFlow: typeof mockHourlyFlow
  sidebarCollapsed: boolean
  alertStatusFilter: string
  alertTypeFilter: string
  alertHandlerFilter: string

  setTrailStatus: (id: string, status: Trail["status"]) => void
  addSnowMaker: (data: Omit<SnowMaker, "id">) => void
  updateSnowMaker: (id: string, data: Partial<SnowMaker>) => void
  updateSnowMakerPosition: (id: string, x: number, y: number) => void
  addSnowPlan: (data: Omit<SnowPlan, "id">) => void
  updateSnowPlanStatus: (id: string, status: SnowPlan["status"]) => void
  resolveAlert: (id: string, handler: string, notes: string) => void
  scanTicket: (code: string, gate: string) => TicketScanResult
  setSidebarCollapsed: (v: boolean) => void
  setAlertStatusFilter: (v: string) => void
  setAlertTypeFilter: (v: string) => void
  setAlertHandlerFilter: (v: string) => void
  resetAllData: () => void
}

const STORAGE_KEY = "snow-resort-management-v1"

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      alertStatusFilter: "全部",
      alertTypeFilter: "全部",
      alertHandlerFilter: "全部",

      setTrailStatus: (id, status) =>
        set((state) => ({
          trails: state.trails.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      addSnowMaker: (data) => {
        const newId = `SM${Date.now().toString().slice(-6)}`
        set((state) => ({
          snowMakers: [...state.snowMakers, { ...data, id: newId }],
        }))
        return newId
      },

      updateSnowMaker: (id, data) =>
        set((state) => ({
          snowMakers: state.snowMakers.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      updateSnowMakerPosition: (id, x, y) =>
        set((state) => ({
          snowMakers: state.snowMakers.map((s) =>
            s.id === id ? { ...s, position: { x, y } } : s
          ),
        })),

      addSnowPlan: (data) => {
        const newId = `SP${Date.now().toString().slice(-6)}`
        set((state) => ({
          snowPlans: [{ ...data, id: newId }, ...state.snowPlans],
        }))
        return newId
      },

      updateSnowPlanStatus: (id, status) => {
        set((state) => {
          const plan = state.snowPlans.find((p) => p.id === id)
          const newState: Partial<Pick<AppState, "snowPlans" | "snowMakers">> = {
            snowPlans: state.snowPlans.map((p) =>
              p.id === id ? { ...p, status } : p
            ),
          }
          if (plan && status === "active") {
            newState.snowMakers = state.snowMakers.map((s) =>
              plan.snowMakers.includes(s.id) ? { ...s, status: "running" as const } : s
            )
          }
          if (plan && status === "completed") {
            newState.snowMakers = state.snowMakers.map((s) =>
              plan.snowMakers.includes(s.id) ? { ...s, status: "idle" as const } : s
            )
          }
          return newState
        })
      },

      resolveAlert: (id, handler, notes) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  resolved: true,
                  resolvedAt: new Date().toLocaleString("zh-CN"),
                  resolvedBy: handler || "管理员",
                  resolvedNotes: notes || "",
                }
              : a
          ),
        })),

      scanTicket: (code, gate): TicketScanResult => {
        const state = get()
        const ticket = state.tickets.find(
          (t) => t.code.toLowerCase() === code.toLowerCase()
        )

        if (!ticket) {
          return { success: false, error: "not_found" }
        }

        if (ticket.status === "used") {
          return { success: false, error: "already_used", ticket }
        }

        if (ticket.status === "expired") {
          return { success: false, error: "expired", ticket }
        }

        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticket.id
              ? {
                  ...t,
                  status: "used",
                  usedAt: new Date().toLocaleString("zh-CN"),
                  usedGate: gate,
                }
              : t
          ),
        }))

        return {
          success: true,
          ticket: { ...ticket, status: "used", usedAt: new Date().toLocaleString("zh-CN"), usedGate: gate },
        }
      },

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setAlertStatusFilter: (v) => set({ alertStatusFilter: v }),
      setAlertTypeFilter: (v) => set({ alertTypeFilter: v }),
      setAlertHandlerFilter: (v) => set({ alertHandlerFilter: v }),

      resetAllData: () =>
        set({
          snowMakers: mockSnowMakers,
          trails: mockTrails,
          tickets: mockTickets,
          snowPlans: mockSnowPlans,
          alerts: mockAlerts,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        snowMakers: state.snowMakers,
        trails: state.trails,
        tickets: state.tickets,
        snowPlans: state.snowPlans,
        alerts: state.alerts,
        sidebarCollapsed: state.sidebarCollapsed,
        alertStatusFilter: state.alertStatusFilter,
        alertTypeFilter: state.alertTypeFilter,
        alertHandlerFilter: state.alertHandlerFilter,
      }),
    }
  )
)
