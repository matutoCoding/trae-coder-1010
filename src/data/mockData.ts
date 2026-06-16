import type {
  SnowMaker,
  WeatherData,
  Trail,
  GroomingRecord,
  Lift,
  TicketRecord,
  RentalItem,
  InjuryReport,
  PatrolRecord,
  SnowPlan,
  Alert,
  HourlyFlow,
} from "@/types"

export const mockSnowMakers: SnowMaker[] = [
  { id: "SM001", name: "造雪机-A1", model: "TR8", position: { x: 20, y: 15 }, status: "running", trail: "初级道-1", lastRunHours: 6.5, totalOutput: 3200 },
  { id: "SM002", name: "造雪机-A2", model: "TR8", position: { x: 35, y: 20 }, status: "running", trail: "初级道-2", lastRunHours: 4.2, totalOutput: 2100 },
  { id: "SM003", name: "造雪机-B1", model: "TF10", position: { x: 50, y: 30 }, status: "idle", trail: "中级道-1", lastRunHours: 0, totalOutput: 5800 },
  { id: "SM004", name: "造雪机-B2", model: "TF10", position: { x: 65, y: 25 }, status: "fault", trail: "中级道-2", lastRunHours: 0, totalOutput: 4200 },
  { id: "SM005", name: "造雪机-C1", model: "TR8", position: { x: 78, y: 40 }, status: "running", trail: "高级道-1", lastRunHours: 8.1, totalOutput: 4500 },
  { id: "SM006", name: "造雪机-C2", model: "TF10", position: { x: 85, y: 35 }, status: "maintain", trail: "高级道-2", lastRunHours: 0, totalOutput: 3900 },
  { id: "SM007", name: "造雪机-D1", model: "TR8", position: { x: 45, y: 55 }, status: "idle", trail: "初级道-3", lastRunHours: 0, totalOutput: 2800 },
  { id: "SM008", name: "造雪机-D2", model: "TF10", position: { x: 60, y: 60 }, status: "running", trail: "中级道-3", lastRunHours: 3.5, totalOutput: 1800 },
]

export const mockWeatherHistory: WeatherData[] = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0")
  const temp = -8 + Math.sin(i / 4) * 3 + (Math.random() - 0.5) * 2
  const hum = 65 + Math.sin(i / 6) * 10 + (Math.random() - 0.5) * 5
  const wind = 3 + Math.sin(i / 5) * 2 + Math.random() * 2
  const snow = temp < -4 ? 0.5 + Math.random() * 2 : Math.random() * 0.3
  return {
    timestamp: `${hour}:00`,
    temperature: parseFloat(temp.toFixed(1)),
    humidity: parseFloat(hum.toFixed(1)),
    windSpeed: parseFloat(wind.toFixed(1)),
    snowfall: parseFloat(snow.toFixed(1)),
    canMakeSnow: temp < -2 && hum > 60,
  }
})

export const mockCurrentWeather: WeatherData = {
  timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
  temperature: -6.5,
  humidity: 72,
  windSpeed: 4.2,
  snowfall: 1.8,
  canMakeSnow: true,
}

export const mockTrails: Trail[] = [
  { id: "T001", name: "雪花初学者道", level: "beginner", snowDepth: 45, status: "open", length: 800 },
  { id: "T002", name: "冬日阳光道", level: "beginner", snowDepth: 52, status: "open", length: 650 },
  { id: "T003", name: "松林漫步道", level: "beginner", snowDepth: 38, status: "open", length: 900 },
  { id: "T004", name: "白桦中级道", level: "intermediate", snowDepth: 58, status: "open", length: 1200 },
  { id: "T005", name: "冰瀑挑战道", level: "intermediate", snowDepth: 42, status: "closed", length: 1500 },
  { id: "T006", name: "银峰速降道", level: "intermediate", snowDepth: 35, status: "grooming", length: 1100 },
  { id: "T007", name: "雪鹰高级道", level: "advanced", snowDepth: 62, status: "open", length: 1800 },
  { id: "T008", name: "暴风雪道", level: "advanced", snowDepth: 30, status: "closed", length: 2000 },
  { id: "T009", name: "极地专家道", level: "expert", snowDepth: 55, status: "open", length: 2200 },
  { id: "T010", name: "冰川极限道", level: "expert", snowDepth: 28, status: "closed", length: 2500 },
]

export const mockGroomingRecords: GroomingRecord[] = [
  { id: "GR001", date: "2026-06-17", trail: "雪花初学者道", operator: "张建国", duration: 2.5, status: "completed" },
  { id: "GR002", date: "2026-06-17", trail: "白桦中级道", operator: "李明华", duration: 3.0, status: "completed" },
  { id: "GR003", date: "2026-06-17", trail: "银峰速降道", operator: "王大山", duration: 1.5, status: "in_progress" },
  { id: "GR004", date: "2026-06-17", trail: "雪鹰高级道", operator: "赵铁柱", duration: 0, status: "planned" },
  { id: "GR005", date: "2026-06-16", trail: "冬日阳光道", operator: "张建国", duration: 2.0, status: "completed" },
  { id: "GR006", date: "2026-06-16", trail: "冰瀑挑战道", operator: "李明华", duration: 2.8, status: "completed" },
  { id: "GR007", date: "2026-06-16", trail: "极地专家道", operator: "王大山", duration: 3.5, status: "completed" },
  { id: "GR008", date: "2026-06-15", trail: "雪花初学者道", operator: "赵铁柱", duration: 2.0, status: "completed" },
]

export const mockLifts: Lift[] = [
  { id: "L001", name: "1号缆车", type: "cable_car", status: "running", capacity: 120, currentLoad: 85, direction: "up", speed: 5 },
  { id: "L002", name: "2号缆车", type: "cable_car", status: "running", capacity: 100, currentLoad: 62, direction: "down", speed: 5 },
  { id: "L003", name: "3号吊椅", type: "chairlift", status: "running", capacity: 80, currentLoad: 45, direction: "up", speed: 3 },
  { id: "L004", name: "4号吊椅", type: "chairlift", status: "stopped", capacity: 80, currentLoad: 0, direction: "up", speed: 0 },
  { id: "L005", name: "魔毯-A", type: "magic_carpet", status: "running", capacity: 60, currentLoad: 38, direction: "up", speed: 1.5 },
  { id: "L006", name: "魔毯-B", type: "magic_carpet", status: "maintenance", capacity: 60, currentLoad: 0, direction: "up", speed: 0 },
]

export const mockTickets: TicketRecord[] = Array.from({ length: 50 }, (_, i) => {
  const hour = 8 + Math.floor(i * 8 / 50)
  const minute = Math.floor(Math.random() * 60)
  const types: TicketRecord["type"][] = ["full_day", "half_day", "hour"]
  const gates = ["A闸机", "B闸机", "C闸机", "D闸机"]
  return {
    id: `TK${(1000 + i).toString()}`,
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    gate: gates[Math.floor(Math.random() * gates.length)],
    status: i < 45 ? "used" : "valid",
  }
})

export const mockRentals: RentalItem[] = [
  { id: "R001", type: "ski", name: "双板-160cm #01", status: "rented", renter: "张三" },
  { id: "R002", type: "ski", name: "双板-170cm #02", status: "available" },
  { id: "R003", type: "ski", name: "双板-165cm #03", status: "rented", renter: "李四" },
  { id: "R004", type: "snowboard", name: "单板-155cm #01", status: "rented", renter: "王五" },
  { id: "R005", type: "snowboard", name: "单板-160cm #02", status: "available" },
  { id: "R006", type: "snowboard", name: "单板-165cm #03", status: "maintenance" },
  { id: "R007", type: "helmet", name: "头盔-M号 #01", status: "rented", renter: "赵六" },
  { id: "R008", type: "helmet", name: "头盔-L号 #02", status: "available" },
  { id: "R009", type: "helmet", name: "头盔-S号 #03", status: "rented", renter: "钱七" },
  { id: "R010", type: "suit", name: "雪服-男款L #01", status: "available" },
  { id: "R011", type: "suit", name: "雪服-女款M #02", status: "rented", renter: "孙八" },
  { id: "R012", type: "suit", name: "雪服-男款XL #03", status: "available" },
]

export const mockInjuries: InjuryReport[] = [
  { id: "IJ001", timestamp: "2026-06-17 10:30", trail: "白桦中级道", level: "minor", description: "游客滑倒，手腕轻微扭伤", handler: "安全员-刘伟", status: "resolved" },
  { id: "IJ002", timestamp: "2026-06-17 13:15", trail: "雪鹰高级道", level: "moderate", description: "游客碰撞，右腿疑似骨折", handler: "安全员-陈刚", status: "treating" },
  { id: "IJ003", timestamp: "2026-06-16 09:45", trail: "冰瀑挑战道", level: "minor", description: "游客摔倒，膝盖擦伤", handler: "安全员-刘伟", status: "resolved" },
  { id: "IJ004", timestamp: "2026-06-16 15:20", trail: "雪花初学者道", level: "severe", description: "游客高速撞击防护网，头部受伤", handler: "安全员-陈刚", status: "resolved" },
  { id: "IJ005", timestamp: "2026-06-15 11:00", trail: "极地专家道", level: "moderate", description: "游客跌落，肩关节脱臼", handler: "安全员-刘伟", status: "resolved" },
]

export const mockPatrols: PatrolRecord[] = [
  { id: "PT001", patroller: "刘伟", route: "初级道区域", startTime: "2026-06-17 08:00", endTime: "2026-06-17 10:00", checkpoints: ["A哨", "B哨", "C哨"], status: "completed" },
  { id: "PT002", patroller: "陈刚", route: "高级道区域", startTime: "2026-06-17 08:30", endTime: "2026-06-17 11:00", checkpoints: ["D哨", "E哨"], status: "completed" },
  { id: "PT003", patroller: "周强", route: "中级道区域", startTime: "2026-06-17 13:00", checkpoints: ["B哨", "D哨"], status: "active" },
  { id: "PT004", patroller: "吴勇", route: "全域巡逻", startTime: "2026-06-16 08:00", endTime: "2026-06-16 16:00", checkpoints: ["A哨", "B哨", "C哨", "D哨", "E哨"], status: "completed" },
]

export const mockSnowPlans: SnowPlan[] = [
  { id: "SP001", date: "2026-06-17", snowMakers: ["SM001", "SM002"], startTime: "22:00", endTime: "06:00", status: "planned", weatherCondition: "温度-8°C 湿度75% 适宜造雪" },
  { id: "SP002", date: "2026-06-17", snowMakers: ["SM005", "SM008"], startTime: "20:00", endTime: "04:00", status: "planned", weatherCondition: "温度-7°C 湿度70% 适宜造雪" },
  { id: "SP003", date: "2026-06-16", snowMakers: ["SM001", "SM003", "SM005"], startTime: "22:00", endTime: "06:00", status: "completed", weatherCondition: "温度-9°C 湿度78% 造雪条件优" },
  { id: "SP004", date: "2026-06-15", snowMakers: ["SM002", "SM004"], startTime: "21:00", endTime: "05:00", status: "completed", weatherCondition: "温度-6°C 湿度68% 造雪条件良" },
  { id: "SP005", date: "2026-06-14", snowMakers: ["SM006", "SM007"], startTime: "23:00", endTime: "05:00", status: "cancelled", weatherCondition: "温度-1°C 湿度55% 不满足造雪条件" },
]

export const mockAlerts: Alert[] = [
  { id: "AL001", type: "fault", title: "造雪机-B2故障", message: "造雪机B2喷嘴堵塞，已自动停机", timestamp: "2026-06-17 14:30", resolved: false },
  { id: "AL002", type: "safety", title: "高级道伤情", message: "雪鹰高级道发生游客碰撞事故", timestamp: "2026-06-17 13:15", resolved: false },
  { id: "AL003", type: "fault", title: "4号吊椅停运", message: "4号吊椅传感器异常，已停运检修", timestamp: "2026-06-17 11:00", resolved: false },
  { id: "AL004", type: "weather", title: "降温预警", message: "预计今晚温度降至-12°C，造雪条件极佳", timestamp: "2026-06-17 09:00", resolved: false },
  { id: "AL005", type: "info", title: "魔毯-B维护", message: "魔毯-B计划维护，预计明日恢复", timestamp: "2026-06-17 08:00", resolved: true },
]

export const mockHourlyFlow: HourlyFlow[] = [
  { hour: "08:00", count: 120 },
  { hour: "09:00", count: 280 },
  { hour: "10:00", count: 450 },
  { hour: "11:00", count: 520 },
  { hour: "12:00", count: 380 },
  { hour: "13:00", count: 490 },
  { hour: "14:00", count: 560 },
  { hour: "15:00", count: 420 },
  { hour: "16:00", count: 300 },
  { hour: "17:00", count: 150 },
]
