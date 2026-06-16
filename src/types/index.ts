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
}

export interface HourlyFlow {
  hour: string
  count: number
}
