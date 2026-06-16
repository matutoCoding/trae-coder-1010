export interface SnowMaker {
  id: string
  name: string
  model: string
  position: { x: number; y: number }
  status: "running" | "idle" | "fault" | "maintain"
  trail: string
  lastRunHours: number
  totalOutput: number
}

export interface WeatherData {
  timestamp: string
  temperature: number
  humidity: number
  windSpeed: number
  snowfall: number
  canMakeSnow: boolean
}

export interface Trail {
  id: string
  name: string
  level: "beginner" | "intermediate" | "advanced" | "expert"
  snowDepth: number
  status: "open" | "closed" | "grooming"
  length: number
}

export interface GroomingRecord {
  id: string
  date: string
  trail: string
  operator: string
  duration: number
  status: "completed" | "in_progress" | "planned"
}

export interface Lift {
  id: string
  name: string
  type: "cable_car" | "chairlift" | "magic_carpet"
  status: "running" | "stopped" | "maintenance"
  capacity: number
  currentLoad: number
  direction: "up" | "down"
  speed: number
}

export interface TicketRecord {
  id: string
  code: string
  type: "full_day" | "half_day" | "hour"
  timestamp: string
  gate: string
  status: "valid" | "used" | "expired"
  usedAt?: string
  usedGate?: string
}

export interface ScanLogEntry {
  id: string
  code: string
  gate: string
  timestamp: string
  result: "success" | "duplicate" | "not_found" | "expired"
  notes?: string
}

export interface ShiftSnapshot {
  id: string
  shift: "morning" | "afternoon" | "evening"
  date: string
  generatedAt: string
  generatedBy: string
  totalScans: number
  successCount: number
  duplicateCount: number
  failedCount: number
  byGate: Record<string, { total: number; success: number; duplicate: number; failed: number }>
  byType: Record<string, { total: number; success: number; duplicate: number; failed: number }>
  failedTickets: { code: string; reason: string; lastGate?: string; lastTime?: string }[]
  notes: string
  nextShiftNotes?: string
  confirmedBy?: string
  confirmedAt?: string
}

export interface AlertHandover {
  id: string
  date: string
  shift: "morning" | "afternoon" | "evening"
  generatedAt: string
  generatedBy: string
  pendingAlerts: string[]
  resolvedToday: string[]
  summary: string
  handoverNotes: string
  confirmedBy?: string
  confirmedAt?: string
  successorNotes?: string
}

export interface RentalItem {
  id: string
  type: "ski" | "snowboard" | "helmet" | "suit"
  name: string
  status: "available" | "rented" | "maintenance"
  renter?: string
}

export interface InjuryReport {
  id: string
  timestamp: string
  trail: string
  level: "minor" | "moderate" | "severe"
  description: string
  handler: string
  status: "pending" | "treating" | "resolved"
}

export interface PatrolRecord {
  id: string
  patroller: string
  route: string
  startTime: string
  endTime?: string
  checkpoints: string[]
  status: "active" | "completed"
}

export interface SnowPlan {
  id: string
  date: string
  snowMakers: string[]
  startTime: string
  endTime: string
  status: "planned" | "active" | "completed" | "cancelled"
  weatherCondition: string
}

export interface Alert {
  id: string
  type: "fault" | "weather" | "safety" | "info"
  title: string
  message: string
  timestamp: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolvedNotes?: string
}

export interface HourlyFlow {
  hour: string
  count: number
}
