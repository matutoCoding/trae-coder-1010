import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Trail, Alert, SnowMaker, SnowPlan, TicketRecord, ScanLogEntry, ShiftSnapshot, AlertHandover } from "@/types"
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
  scanLog: ScanLogEntry[]
  shiftSnapshots: ShiftSnapshot[]
  alertHandovers: AlertHandover[]
  currentShift: "morning" | "afternoon" | "evening"
  currentShiftOperator: string

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
  setCurrentShift: (v: "morning" | "afternoon" | "evening") => void
  setCurrentShiftOperator: (v: string) => void
  createShiftSnapshot: (operator: string, notes: string) => ShiftSnapshot
  confirmShiftSnapshot: (id: string, confirmedBy: string, nextShiftNotes: string) => void
  createAlertHandover: (operator: string, shift: string, notes: string) => AlertHandover
  confirmAlertHandover: (id: string, confirmedBy: string, successorNotes: string) => void
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
      scanLog: [],
      shiftSnapshots: [],
      alertHandovers: [],
      currentShift: "morning",
      currentShiftOperator: "",

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
        const now = new Date().toLocaleString("zh-CN")
        const logId = `LOG${Date.now().toString().slice(-8)}`

        if (!ticket) {
          set((s) => ({
            scanLog: [
              { id: logId, code, gate, timestamp: now, result: "not_found" },
              ...s.scanLog,
            ],
          }))
          return { success: false, error: "not_found" }
        }

        if (ticket.status === "used") {
          set((s) => ({
            scanLog: [
              { id: logId, code, gate, timestamp: now, result: "duplicate" },
              ...s.scanLog,
            ],
          }))
          return { success: false, error: "already_used", ticket }
        }

        if (ticket.status === "expired") {
          set((s) => ({
            scanLog: [
              { id: logId, code, gate, timestamp: now, result: "expired" },
              ...s.scanLog,
            ],
          }))
          return { success: false, error: "expired", ticket }
        }

        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticket.id
              ? {
                  ...t,
                  status: "used",
                  usedAt: now,
                  usedGate: gate,
                }
              : t
          ),
          scanLog: [
            { id: logId, code, gate, timestamp: now, result: "success" },
            ...s.scanLog,
          ],
        }))

        return {
          success: true,
          ticket: { ...ticket, status: "used", usedAt: now, usedGate: gate },
        }
      },

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setAlertStatusFilter: (v) => set({ alertStatusFilter: v }),
      setAlertTypeFilter: (v) => set({ alertTypeFilter: v }),
      setAlertHandlerFilter: (v) => set({ alertHandlerFilter: v }),
      setCurrentShift: (v) => set({ currentShift: v }),
      setCurrentShiftOperator: (v) => set({ currentShiftOperator: v }),

      createShiftSnapshot: (operator, notes) => {
        const state = get()
        const now = new Date().toLocaleString("zh-CN")
        const today = new Date().toLocaleDateString("zh-CN")
        const shift = state.currentShift

        const shiftHours: Record<string, [number, number]> = {
          morning: [8, 12],
          afternoon: [12, 17],
          evening: [17, 22],
        }
        const [startH, endH] = shiftHours[shift] || [0, 24]

        const allScans = state.scanLog.filter((log) => {
          const d = new Date(log.timestamp)
          const hour = d.getHours()
          const logDate = d.toLocaleDateString("zh-CN")
          return logDate === today && hour >= startH && hour < endH
        })

        const byGate: Record<string, { total: number; success: number; duplicate: number; failed: number }> = {}
        const byType: Record<string, { total: number; success: number; duplicate: number; failed: number }> = {}
        const failedTickets: { code: string; reason: string; lastGate?: string; lastTime?: string }[] = []

        allScans.forEach((log) => {
          if (!byGate[log.gate]) {
            byGate[log.gate] = { total: 0, success: 0, duplicate: 0, failed: 0 }
          }
          byGate[log.gate].total++

          const ticket = state.tickets.find((t) => t.code.toLowerCase() === log.code.toLowerCase())
          const tType = ticket?.type || "unknown"
          if (!byType[tType]) {
            byType[tType] = { total: 0, success: 0, duplicate: 0, failed: 0 }
          }
          byType[tType].total++

          if (log.result === "success") {
            byGate[log.gate].success++
            byType[tType].success++
          } else if (log.result === "duplicate") {
            byGate[log.gate].duplicate++
            byType[tType].duplicate++
            const prevSuccess = allScans.filter(
              (l) => l.code === log.code && l.result === "success" && l.timestamp < log.timestamp
            )
            const last = prevSuccess[prevSuccess.length - 1]
            failedTickets.push({
              code: log.code,
              reason: "重复扫码",
              lastGate: last?.gate,
              lastTime: last?.timestamp,
            })
          } else {
            byGate[log.gate].failed++
            byType[tType].failed++
            const reason = log.result === "not_found" ? "票号不存在" : "票已过期"
            failedTickets.push({ code: log.code, reason })
          }
        })

        const snapshot: ShiftSnapshot = {
          id: `SS${Date.now().toString().slice(-8)}`,
          shift,
          date: today,
          generatedAt: now,
          generatedBy: operator || "未命名",
          totalScans: allScans.length,
          successCount: allScans.filter((l) => l.result === "success").length,
          duplicateCount: allScans.filter((l) => l.result === "duplicate").length,
          failedCount: allScans.filter((l) => l.result === "not_found" || l.result === "expired").length,
          byGate,
          byType,
          failedTickets,
          notes,
        }

        set((s) => ({ shiftSnapshots: [snapshot, ...s.shiftSnapshots] }))
        return snapshot
      },

      confirmShiftSnapshot: (id, confirmedBy, nextShiftNotes) =>
        set((state) => ({
          shiftSnapshots: state.shiftSnapshots.map((s) =>
            s.id === id
              ? { ...s, confirmedBy, confirmedAt: new Date().toLocaleString("zh-CN"), nextShiftNotes }
              : s
          ),
        })),

      createAlertHandover: (operator, shift, notes) => {
        const today = new Date().toLocaleDateString("zh-CN")
        const state = get()
        const pending = state.alerts.filter((a) => !a.resolved).map((a) => a.id)
        const resolved = state.alerts.filter((a) => a.resolved && a.resolvedAt?.startsWith(today)).map((a) => a.id)

        const summaryLines: string[] = []
        const byType: Record<string, number> = {}
        pending.forEach((id) => {
          const a = state.alerts.find((x) => x.id === id)
          if (a) byType[a.type] = (byType[a.type] || 0) + 1
        })
        Object.entries(byType).forEach(([type, count]) => {
          const typeLabels: Record<string, string> = {
            fault: "设备故障", safety: "安全告警", weather: "气象告警", info: "系统通知",
          }
          summaryLines.push(`${typeLabels[type] || type} ${count}条`)
        })

        const handover: AlertHandover = {
          id: `AH${Date.now().toString().slice(-8)}`,
          date: today,
          shift: shift as AlertHandover["shift"],
          generatedAt: new Date().toLocaleString("zh-CN"),
          generatedBy: operator || "未命名",
          pendingAlerts: pending,
          resolvedToday: resolved,
          summary: summaryLines.join("，") || "无待处理告警",
          handoverNotes: notes,
        }

        set((s) => ({ alertHandovers: [handover, ...s.alertHandovers] }))
        return handover
      },

      confirmAlertHandover: (id, confirmedBy, successorNotes) =>
        set((state) => ({
          alertHandovers: state.alertHandovers.map((h) =>
            h.id === id
              ? { ...h, confirmedBy, confirmedAt: new Date().toLocaleString("zh-CN"), successorNotes }
              : h
          ),
        })),

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
        scanLog: state.scanLog,
        shiftSnapshots: state.shiftSnapshots,
        alertHandovers: state.alertHandovers,
        currentShift: state.currentShift,
        currentShiftOperator: state.currentShiftOperator,
      }),
    }
  )
)
