import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import {
  Ticket as TicketIcon,
  Snowflake,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  MapPin,
  Tag,
  BarChart3,
  History,
  X,
  FileText,
  User,
  Copy,
  ChevronRight,
  Download,
  Calendar,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import type { TicketRecord, ShiftSnapshot } from "@/types"

const typeLabel: Record<string, string> = { full_day: "全天票", half_day: "半天票", hour: "小时票" }
const statusStyle: Record<string, string> = {
  valid: "bg-emerald-500/20 text-emerald-400",
  used: "bg-slate-500/20 text-slate-400",
  expired: "bg-red-500/20 text-red-400",
}
const statusLabel: Record<string, string> = { valid: "有效", used: "已使用", expired: "已过期" }
const resultStyle: Record<string, string> = {
  success: "bg-emerald-500/20 text-emerald-400",
  duplicate: "bg-amber-500/20 text-amber-400",
  not_found: "bg-red-500/20 text-red-400",
  expired: "bg-orange-500/20 text-orange-400",
}
const resultLabel: Record<string, string> = {
  success: "核销成功",
  duplicate: "重复扫码",
  not_found: "票号不存在",
  expired: "票已过期",
}
const PIE_COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc"]
const GATE_OPTIONS = ["全部", "A闸机", "B闸机", "C闸机", "D闸机"]
const STATUS_OPTIONS = ["全部", "valid", "used", "expired"]
const TYPE_OPTIONS = ["全部", "full_day", "half_day", "hour"]
const SHIFT_OPTIONS = [
  { key: "morning", label: "早班", hours: "08:00-12:00" },
  { key: "afternoon", label: "午班", hours: "12:00-17:00" },
  { key: "evening", label: "晚班", hours: "17:00-22:00" },
]

interface TraceEntry {
  time: string
  gate: string
  result: "success" | "duplicate" | "not_found" | "expired"
  notes?: string
}

export default function TicketPage() {
  const tickets = useStore((s) => s.tickets)
  const scanTicket = useStore((s) => s.scanTicket)
  const scanLog = useStore((s) => s.scanLog)
  const shiftSnapshots = useStore((s) => s.shiftSnapshots)
  const currentShift = useStore((s) => s.currentShift)
  const currentShiftOperator = useStore((s) => s.currentShiftOperator)
  const setCurrentShift = useStore((s) => s.setCurrentShift)
  const setCurrentShiftOperator = useStore((s) => s.setCurrentShiftOperator)
  const createShiftSnapshot = useStore((s) => s.createShiftSnapshot)
  const confirmShiftSnapshot = useStore((s) => s.confirmShiftSnapshot)

  const [scanCode, setScanCode] = useState("")
  const [scanGate, setScanGate] = useState("A闸机")
  const [scanResult, setScanResult] = useState<{
    success: boolean
    error?: string
    ticket?: TicketRecord
    lastTime?: string
    lastGate?: string
  } | null>(null)

  const [viewMode, setViewMode] = useState<"normal" | "review" | "handover">("normal")
  const [filterCode, setFilterCode] = useState("")
  const [filterStatus, setFilterStatus] = useState("全部")
  const [filterGate, setFilterGate] = useState("全部")
  const [filterType, setFilterType] = useState("全部")
  const [filterShift, setFilterShift] = useState("全部")
  const [showFilter, setShowFilter] = useState(false)
  const [traceTicket, setTraceTicket] = useState<{ code: string; records: TraceEntry[] } | null>(null)

  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapshotNotes, setSnapshotNotes] = useState("")
  const [viewingSnapshot, setViewingSnapshot] = useState<ShiftSnapshot | null>(null)
  const [confirmModal, setConfirmModal] = useState<ShiftSnapshot | null>(null)
  const [confirmerName, setConfirmerName] = useState("")
  const [confirmerNotes, setConfirmerNotes] = useState("")

  const getActualUsedGate = (t: TicketRecord) =>
    t.status === "used" ? t.usedGate || t.gate : t.gate
  const getActualUsedTime = (t: TicketRecord) =>
    t.status === "used" ? t.usedAt || t.timestamp : t.timestamp

  const shiftHours: Record<string, [number, number]> = {
    morning: [8, 12],
    afternoon: [12, 17],
    evening: [17, 22],
  }

  const inShiftRange = (timeStr: string, shiftKey: string) => {
    if (shiftKey === "全部") return true
    const [startH, endH] = shiftHours[shiftKey] || [0, 24]
    try {
      const d = new Date(timeStr)
      const hour = d.getHours()
      return hour >= startH && hour < endH
    } catch {
      return false
    }
  }

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      if (a.status === "used" && b.status !== "used") return -1
      if (a.status !== "used" && b.status === "used") return 1
      return getActualUsedTime(b).localeCompare(getActualUsedTime(a))
    })
  }, [tickets])

  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((t) => {
      if (filterCode && !t.code.toLowerCase().includes(filterCode.toLowerCase())) return false
      if (filterStatus !== "全部" && t.status !== filterStatus) return false
      if (filterType !== "全部" && t.type !== filterType) return false
      if (filterGate !== "全部" && getActualUsedGate(t) !== filterGate) return false
      if (filterShift !== "全部") {
        const timeStr = t.status === "used" ? t.usedAt || t.timestamp : t.timestamp
        if (!inShiftRange(timeStr, filterShift)) return false
      }
      return true
    })
  }, [sortedTickets, filterCode, filterStatus, filterGate, filterType, filterShift])

  const shiftScanLog = useMemo(() => {
    const today = new Date().toLocaleDateString("zh-CN")
    return scanLog.filter((log) => {
      try {
        const logDate = new Date(log.timestamp).toLocaleDateString("zh-CN")
        if (logDate !== today) return false
      } catch {
        return false
      }
      if (!inShiftRange(log.timestamp, currentShift)) return false
      if (filterCode && !log.code.toLowerCase().includes(filterCode.toLowerCase())) return false
      if (filterGate !== "全部" && log.gate !== filterGate) return false
      if (filterType !== "全部") {
        const ticket = tickets.find((t) => t.code.toLowerCase() === log.code.toLowerCase())
        if (!ticket || ticket.type !== filterType) return false
      }
      return true
    })
  }, [scanLog, currentShift, filterCode, filterGate, filterType, tickets])

  const abnormalLogs = useMemo(() => {
    return shiftScanLog.filter((l) => l.result !== "success")
  }, [shiftScanLog])

  const uniqueAbnormalTickets = useMemo(() => {
    const seen = new Map<string, typeof scanLog[number]>()
    abnormalLogs.forEach((log) => {
      const key = log.code.toLowerCase()
      if (!seen.has(key) || log.timestamp > seen.get(key)!.timestamp) {
        seen.set(key, log)
      }
    })
    return Array.from(seen.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }, [abnormalLogs])

  const getLastSuccess = (code: string) => {
    const successes = scanLog
      .filter((l) => l.code.toLowerCase() === code.toLowerCase() && l.result === "success")
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return successes[0]
  }

  const handleScan = () => {
    if (!scanCode.trim()) return
    const result = scanTicket(scanCode.trim(), scanGate)
    if (result.success) {
      setScanResult({ success: true, ticket: result.ticket })
    } else {
      const lastSuccess = result.ticket && result.ticket.usedAt && result.ticket.usedGate
        ? { lastTime: result.ticket.usedAt, lastGate: result.ticket.usedGate }
        : {}
      setScanResult({ success: false, error: result.error, ticket: result.ticket, ...lastSuccess })
    }
    setScanCode("")
  }

  const buildTrace = (code: string) => {
    const records: TraceEntry[] = []
    const ticket = tickets.find((t) => t.code.toLowerCase() === code.toLowerCase())

    scanLog
      .filter((l) => l.code.toLowerCase() === code.toLowerCase())
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .forEach((log) => {
        records.push({
          time: log.timestamp,
          gate: log.gate,
          result: log.result,
        })
      })

    if (ticket && ticket.status === "used" && ticket.usedAt && ticket.usedGate) {
      const hasSuccess = records.some(
        (r) => r.time === ticket.usedAt && r.gate === ticket.usedGate && r.result === "success"
      )
      if (!hasSuccess) {
        records.push({
          time: ticket.usedAt,
          gate: ticket.usedGate,
          result: "success",
        })
      }
    }

    records.sort((a, b) => a.time.localeCompare(b.time))
    return records
  }

  const showTrace = (code: string) => {
    const records = buildTrace(code)
    setTraceTicket({ code, records })
  }

  const reviewStats = useMemo(() => {
    const total = shiftScanLog.length
    const success = shiftScanLog.filter((l) => l.result === "success").length
    const duplicate = shiftScanLog.filter((l) => l.result === "duplicate").length
    const failed = shiftScanLog.filter((l) => l.result === "not_found" || l.result === "expired").length

    const byGate: Record<string, { total: number; success: number; duplicate: number; failed: number }> = {}
    GATE_OPTIONS.filter((g) => g !== "全部").forEach((g) => {
      const gateLogs = shiftScanLog.filter((l) => l.gate === g)
      byGate[g] = {
        total: gateLogs.length,
        success: gateLogs.filter((l) => l.result === "success").length,
        duplicate: gateLogs.filter((l) => l.result === "duplicate").length,
        failed: gateLogs.filter((l) => l.result === "not_found" || l.result === "expired").length,
      }
    })

    const byType: Record<string, { total: number; success: number; duplicate: number; failed: number }> = {}
    shiftScanLog.forEach((log) => {
      const ticket = tickets.find((t) => t.code.toLowerCase() === log.code.toLowerCase())
      const t = ticket?.type || "unknown"
      if (!byType[t]) byType[t] = { total: 0, success: 0, duplicate: 0, failed: 0 }
      byType[t].total++
      if (log.result === "success") byType[t].success++
      else if (log.result === "duplicate") byType[t].duplicate++
      else byType[t].failed++
    })

    const byHour: Record<string, number> = {}
    for (let h = 8; h < 22; h++) {
      byHour[`${h}:00`] = 0
    }
    shiftScanLog.forEach((log) => {
      try {
        const d = new Date(log.timestamp)
        const h = d.getHours()
        const key = `${h}:00`
        if (byHour[key] !== undefined) byHour[key]++
      } catch {}
    })

    return {
      total,
      success,
      duplicate,
      failed,
      byGate,
      byType,
      byHour: Object.entries(byHour).map(([hour, count]) => ({ hour, count })),
    }
  }, [shiftScanLog, tickets])

  const gateChartData = useMemo(() => {
    return GATE_OPTIONS.filter((g) => g !== "全部").map((g) => ({
      gate: g,
      成功: reviewStats.byGate[g]?.success || 0,
      重复: reviewStats.byGate[g]?.duplicate || 0,
      失败: reviewStats.byGate[g]?.failed || 0,
    }))
  }, [reviewStats])

  const pieData = useMemo(() => {
    return Object.entries(reviewStats.byType)
      .filter(([key]) => key !== "unknown")
      .map(([type, data]) => ({
        name: typeLabel[type] || type,
        value: data.total,
      }))
  }, [reviewStats])

  const handleGenerateSnapshot = () => {
    createShiftSnapshot(currentShiftOperator, snapshotNotes)
    setShowSnapshotModal(false)
    setSnapshotNotes("")
  }

  const handleConfirmSnapshot = () => {
    if (!confirmModal) return
    confirmShiftSnapshot(confirmModal.id, confirmerName || "接班人", confirmerNotes)
    setConfirmModal(null)
    setConfirmerName("")
    setConfirmerNotes("")
    setViewingSnapshot(null)
  }

  const todaySnapshots = useMemo(() => {
    const today = new Date().toLocaleDateString("zh-CN")
    return shiftSnapshots.filter((s) => s.date === today)
  }, [shiftSnapshots])

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ice-200">票务核销</h2>
        <div className="flex items-center gap-1 bg-gray-900/60 rounded-lg p-0.5">
          {[
            { key: "normal", label: "日常核销", icon: QrCode },
            { key: "review", label: "值班复盘", icon: BarChart3 },
            { key: "handover", label: "班次交接", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as typeof viewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === tab.key
                  ? "bg-ice-500/20 text-ice-300"
                  : "text-ice-300/50 hover:text-ice-300/80"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "normal" && (
        <>
          <div className="glow-card">
            <h3 className="text-sm font-medium text-ice-300/70 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              当班信息
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] text-ice-300/50 mb-1 block">当前班次</label>
                <div className="flex gap-1">
                  {SHIFT_OPTIONS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCurrentShift(s.key as typeof currentShift)}
                      className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${
                        currentShift === s.key
                          ? "bg-ice-500/30 text-ice-200 border border-ice-500/40"
                          : "bg-gray-800/50 text-ice-300/60 border border-gray-700/50 hover:border-ice-500/30"
                      }`}
                    >
                      <div className="font-medium">{s.label}</div>
                      <div className="text-[9px] opacity-70">{s.hours}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-ice-300/50 mb-1 block">值班员</label>
                <input
                  type="text"
                  value={currentShiftOperator}
                  onChange={(e) => setCurrentShiftOperator(e.target.value)}
                  placeholder="输入值班员姓名"
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50"
                />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-ice-300/60 space-y-0.5">
                  <div>本班核销：<span className="text-ice-300 font-semibold">{reviewStats.total}</span> 次</div>
                  <div className="flex gap-2">
                    <span>成功：<span className="text-emerald-400">{reviewStats.success}</span></span>
                    <span>异常：<span className="text-amber-400">{reviewStats.duplicate + reviewStats.failed}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowSnapshotModal(true)}
                  className="w-full py-2 bg-ice-500/20 text-ice-300 rounded-lg text-xs font-medium hover:bg-ice-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  生成交接快照
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glow-card">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">闸机扫码核销</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-ice-300/60 mb-1 block">选择闸机</label>
                  <select
                    value={scanGate}
                    onChange={(e) => setScanGate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 focus:outline-none focus:border-ice-400/50"
                  >
                    {GATE_OPTIONS.filter((g) => g !== "全部").map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ice-300/60 mb-1 block">票号</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanCode}
                      onChange={(e) => setScanCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleScan()}
                      placeholder="输入或扫码票号"
                      className="flex-1 px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 font-mono"
                    />
                    <button
                      onClick={handleScan}
                      className="px-4 py-2 bg-ice-500 text-white rounded-lg text-sm font-medium hover:bg-ice-400 transition-colors"
                    >
                      核销
                    </button>
                  </div>
                </div>

                {scanResult && (
                  <div
                    className={`p-3 rounded-lg border ${
                      scanResult.success
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {scanResult.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          scanResult.success ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {scanResult.success
                          ? "核销成功"
                          : scanResult.error === "already_used"
                          ? "重复扫码"
                          : scanResult.error === "not_found"
                          ? "票号不存在"
                          : "票已过期"}
                      </span>
                    </div>
                    {scanResult.ticket && (
                      <div className="text-xs text-ice-300/60 space-y-0.5">
                        <div>票号：{scanResult.ticket.code}</div>
                        <div>票种：{typeLabel[scanResult.ticket.type]}</div>
                        <div>当前闸机：{scanGate}</div>
                        {!scanResult.success && scanResult.lastTime && scanResult.lastGate && (
                          <div className="text-amber-400 mt-1 pt-1 border-t border-amber-500/20">
                            上次核销：{scanResult.lastTime} @ {scanResult.lastGate}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setScanResult(null)}
                      className="mt-2 text-[10px] text-ice-300/40 hover:text-ice-300/70"
                    >
                      关闭提示
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 glow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ice-300/70">核销记录</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-ice-300/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterCode}
                      onChange={(e) => setFilterCode(e.target.value)}
                      placeholder="搜索票号"
                      className="pl-7 pr-3 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 placeholder:text-ice-300/30 focus:outline-none w-32"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`text-xs flex items-center gap-1 px-2 py-1.5 rounded ${
                      showFilter ? "bg-ice-500/20 text-ice-300" : "text-ice-300/50 hover:text-ice-300/80"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    筛选
                  </button>
                </div>
              </div>

              {showFilter && (
                <div className="mb-3 p-2 bg-gray-900/40 rounded-lg grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-ice-300/40 mb-0.5 block">状态</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s === "全部" ? s : statusLabel[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ice-300/40 mb-0.5 block">闸机</label>
                    <select
                      value={filterGate}
                      onChange={(e) => setFilterGate(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                    >
                      {GATE_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ice-300/40 mb-0.5 block">票种</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t === "全部" ? t : typeLabel[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ice-300/40 mb-0.5 block">班次</label>
                    <select
                      value={filterShift}
                      onChange={(e) => setFilterShift(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                    >
                      <option value="全部">全部班次</option>
                      {SHIFT_OPTIONS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="overflow-y-auto max-h-[320px] pr-1 space-y-1.5">
                {filteredTickets.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-8">暂无记录</div>
                )}
                {filteredTickets.slice(0, 50).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="shrink-0">
                      <TicketIcon className="w-4 h-4 text-ice-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-ice-200">{t.code}</div>
                      <div className="text-[10px] text-ice-300/50 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />{typeLabel[t.type]}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{getActualUsedGate(t)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {getActualUsedTime(t)}
                        </span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${statusStyle[t.status]}`}>
                      {statusLabel[t.status]}
                    </span>
                    <button
                      onClick={() => showTrace(t.code)}
                      className="shrink-0 text-[10px] text-ice-400 hover:text-ice-300 flex items-center gap-0.5"
                    >
                      <History className="w-3 h-3" />轨迹
                    </button>
                  </div>
                ))}
                {filteredTickets.length > 50 && (
                  <div className="text-center text-[10px] text-ice-300/40 py-1">
                    共 {filteredTickets.length} 条，仅显示前 50 条
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === "review" && (
        <>
          <div className="glow-card p-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-ice-300/60 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />筛选条件：
              </span>
              <select
                value={currentShift}
                onChange={(e) => setCurrentShift(e.target.value as "morning" | "afternoon" | "evening")}
                className="px-2 py-1 bg-gray-900/60 border border-ice-500/20 rounded text-xs text-ice-100 focus:outline-none"
              >
                {SHIFT_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label} ({s.hours})</option>
                ))}
              </select>
              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                className="px-2 py-1 bg-gray-900/60 border border-ice-500/20 rounded text-xs text-ice-100 focus:outline-none"
              >
                {GATE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1 bg-gray-900/60 border border-ice-500/20 rounded text-xs text-ice-100 focus:outline-none"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === "全部" ? "全部票种" : typeLabel[t]}</option>
                ))}
              </select>
              <div className="flex-1" />
              <span className="text-[10px] text-ice-300/40">
                共 {reviewStats.total} 条记录 · 异常 {uniqueAbnormalTickets.length} 张
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="glow-card flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10">
                <BarChart3 className="w-5 h-5 text-ice-400" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-ice-400">{reviewStats.total}</div>
                <div className="text-[10px] text-ice-300/60">总扫码次数</div>
              </div>
            </div>
            <div className="glow-card flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-emerald-400">{reviewStats.success}</div>
                <div className="text-[10px] text-ice-300/60">成功核销</div>
              </div>
            </div>
            <div className="glow-card flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-amber-400">{reviewStats.duplicate}</div>
                <div className="text-[10px] text-ice-300/60">重复扫码</div>
              </div>
            </div>
            <div className="glow-card flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-red-400">{reviewStats.failed}</div>
                <div className="text-[10px] text-ice-300/60">失败票号</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glow-card col-span-2">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">分时段核销分布</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reviewStats.byHour}>
                  <XAxis dataKey="hour" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
                  <Bar dataKey="count" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glow-card">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">票种分布</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="glow-card col-span-2">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">各闸机异常统计</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gateChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="gate" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                  <Bar dataKey="成功" fill="#34d399" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="重复" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="失败" fill="#f87171" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-ice-300/70">异常票清单</h3>
                <span className="text-[10px] text-ice-300/40">共 {uniqueAbnormalTickets.length} 张</span>
              </div>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {uniqueAbnormalTickets.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-6">暂无异常</div>
                )}
                {uniqueAbnormalTickets.map((log) => {
                  const lastSuccess = getLastSuccess(log.code)
                  return (
                    <div
                      key={log.id}
                      className="p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => showTrace(log.code)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-ice-200">{log.code}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${resultStyle[log.result]}`}>
                          {resultLabel[log.result]}
                        </span>
                      </div>
                      <div className="text-[10px] text-ice-300/50 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />{log.gate}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{log.timestamp}
                        </span>
                      </div>
                      {log.result === "duplicate" && lastSuccess && (
                        <div className="text-[9px] text-amber-400/70 mt-1">
                          上次：{lastSuccess.timestamp} @ {lastSuccess.gate}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === "handover" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glow-card col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-ice-300/70 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                本班次交接
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={currentShift}
                  onChange={(e) => setCurrentShift(e.target.value as "morning" | "afternoon" | "evening")}
                  className="px-2 py-1.5 bg-gray-900/60 border border-ice-500/20 rounded text-xs text-ice-100 focus:outline-none"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label} ({s.hours})</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowSnapshotModal(true)}
                  className="px-3 py-1.5 bg-ice-500/20 text-ice-300 rounded text-xs font-medium hover:bg-ice-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  生成交接
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-gray-800/30 rounded-lg text-center">
                <div className="font-mono text-xl font-bold text-ice-400">{reviewStats.total}</div>
                <div className="text-[10px] text-ice-300/60 mt-0.5">总扫码</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg text-center">
                <div className="font-mono text-xl font-bold text-emerald-400">{reviewStats.success}</div>
                <div className="text-[10px] text-ice-300/60 mt-0.5">成功</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg text-center">
                <div className="font-mono text-xl font-bold text-amber-400">{reviewStats.duplicate}</div>
                <div className="text-[10px] text-ice-300/60 mt-0.5">重复</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg text-center">
                <div className="font-mono text-xl font-bold text-red-400">{reviewStats.failed}</div>
                <div className="text-[10px] text-ice-300/60 mt-0.5">失败</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-ice-300/70 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                异常票清单（{uniqueAbnormalTickets.length} 张）
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                {uniqueAbnormalTickets.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-4">本班次无异常票</div>
                )}
                {uniqueAbnormalTickets.map((log) => {
                  const lastSuccess = getLastSuccess(log.code)
                  return (
                    <div
                      key={log.id}
                      onClick={() => showTrace(log.code)}
                      className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        log.result === "duplicate" ? "bg-amber-400" : "bg-red-400"
                      }`} />
                      <span className="flex-1 text-xs font-mono text-ice-200 truncate">{log.code}</span>
                      <span className="text-[10px] text-ice-300/50 shrink-0">{log.gate}</span>
                      {log.result === "duplicate" && lastSuccess && (
                        <span className="text-[9px] text-amber-400/70 shrink-0">
                          上次 {lastSuccess.timestamp.split(" ")[1]}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-ice-300/40 shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="glow-card">
            <h3 className="text-sm font-medium text-ice-300/70 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              今日交接记录
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {todaySnapshots.length === 0 && (
                <div className="text-ice-300/40 text-xs text-center py-8">暂无交接记录</div>
              )}
              {todaySnapshots.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setViewingSnapshot(s)}
                  className="p-2.5 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-ice-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-ice-500/20 text-ice-300 text-[10px] font-medium">
                        {SHIFT_OPTIONS.find((sh) => sh.key === s.shift)?.label || s.shift}
                      </span>
                      {s.confirmedBy ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] flex items-center gap-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />已接班
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />待接班
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-3 h-3 text-ice-300/40" />
                  </div>
                  <div className="text-[10px] text-ice-300/50 mt-1.5 flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5" />{s.generatedBy}
                    </span>
                  </div>
                  <div className="text-[10px] text-ice-300/60 mt-1">
                    总 {s.totalScans} 次 · 成功 {s.successCount} · 异常 {s.duplicateCount + s.failedCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {traceTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-[440px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0f172a]/90 backdrop-blur py-1 -mt-1">
              <div>
                <h3 className="text-sm font-semibold text-ice-200">核销轨迹</h3>
                <p className="text-[10px] text-ice-300/50 font-mono mt-0.5">{traceTicket.code}</p>
              </div>
              <button onClick={() => setTraceTicket(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {traceTicket.records.length === 0 ? (
              <div className="text-ice-300/40 text-xs text-center py-8">暂无核销记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-px bg-ice-500/20" />
                <div className="space-y-3">
                  {traceTicket.records.map((entry, idx) => (
                    <div key={idx} className="relative flex gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        entry.result === "success" ? "bg-emerald-500/20" :
                        entry.result === "duplicate" ? "bg-amber-500/20" : "bg-red-500/20"
                      }`}>
                        {entry.result === "success" ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : entry.result === "duplicate" ? (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${
                            entry.result === "success" ? "text-emerald-300" :
                            entry.result === "duplicate" ? "text-amber-300" : "text-red-300"
                          }`}>
                            {resultLabel[entry.result]}
                          </span>
                          <span className="text-[10px] text-ice-300/40 font-mono">{entry.time}</span>
                        </div>
                        <div className="text-[10px] text-ice-300/60 mt-1 flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{entry.gate}
                          </span>
                        </div>
                        {entry.result === "duplicate" && idx > 0 && traceTicket.records[idx - 1] && (
                          <div className="text-[9px] text-amber-400/60 mt-1 p-1.5 bg-amber-500/10 rounded">
                            上次核销：{traceTicket.records[idx - 1].time} @ {traceTicket.records[idx - 1].gate}
                          </div>
                        )}
                        {idx === traceTicket.records.length - 1 && entry.result !== "success" && (
                          <div className="text-[9px] text-ice-300/50 mt-1 p-1.5 bg-ice-500/10 rounded">
                            当前状态：{resultLabel[entry.result]}，请核实票号有效性
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">生成交接快照</h3>
              <button onClick={() => setShowSnapshotModal(false)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/30 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">班次</span>
                  <span className="text-ice-200 font-medium">
                    {SHIFT_OPTIONS.find((s) => s.key === currentShift)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">总扫码</span>
                  <span className="text-ice-200 font-mono">{reviewStats.total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">成功 / 重复 / 失败</span>
                  <span className="font-mono text-xs">
                    <span className="text-emerald-400">{reviewStats.success}</span>
                    <span className="text-ice-300/40"> / </span>
                    <span className="text-amber-400">{reviewStats.duplicate}</span>
                    <span className="text-ice-300/40"> / </span>
                    <span className="text-red-400">{reviewStats.failed}</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">异常票</span>
                  <span className="text-amber-400">{uniqueAbnormalTickets.length} 张</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">值班员</label>
                <input
                  type="text"
                  value={currentShiftOperator}
                  onChange={(e) => setCurrentShiftOperator(e.target.value)}
                  placeholder="输入值班员姓名"
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">交班备注</label>
                <textarea
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  placeholder="写下本班次需要注意的事项..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGenerateSnapshot}
                className="px-4 py-2 text-xs bg-ice-500 text-white rounded-lg hover:bg-ice-400 transition-colors"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-[480px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0f172a]/90 backdrop-blur py-1 -mt-1">
              <div>
                <h3 className="text-sm font-semibold text-ice-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ice-400" />
                  {SHIFT_OPTIONS.find((s) => s.key === viewingSnapshot.shift)?.label}交接快照
                </h3>
                <p className="text-[10px] text-ice-300/50 mt-0.5">
                  {viewingSnapshot.date} · 生成于 {viewingSnapshot.generatedAt}
                </p>
              </div>
              <button onClick={() => setViewingSnapshot(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-ice-400">{viewingSnapshot.totalScans}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">总扫码</div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-emerald-400">{viewingSnapshot.successCount}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">成功</div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-amber-400">{viewingSnapshot.duplicateCount}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">重复</div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-red-400">{viewingSnapshot.failedCount}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">失败</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-ice-300/70 font-medium mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  值班员：{viewingSnapshot.generatedBy}
                </div>
                {viewingSnapshot.notes && (
                  <div className="p-2.5 bg-ice-500/10 border border-ice-500/20 rounded-lg">
                    <div className="text-[10px] text-ice-300/60 mb-1">交班备注</div>
                    <p className="text-xs text-ice-200">{viewingSnapshot.notes}</p>
                  </div>
                )}
              </div>

              {viewingSnapshot.failedTickets.length > 0 && (
                <div>
                  <div className="text-xs text-ice-300/70 font-medium mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    异常票清单（{viewingSnapshot.failedTickets.length} 张）
                  </div>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                    {viewingSnapshot.failedTickets.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => showTrace(t.code)}
                        className="flex items-center gap-2 p-1.5 bg-gray-800/30 rounded hover:bg-gray-800/50 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-mono text-ice-200 flex-1">{t.code}</span>
                        <span className="text-[10px] text-amber-400">{t.reason}</span>
                        {t.lastTime && (
                          <span className="text-[9px] text-ice-300/40">
                            {t.lastTime.split(" ")[1]} @ {t.lastGate}
                          </span>
                        )}
                        <ChevronRight className="w-3 h-3 text-ice-300/40" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingSnapshot.confirmedBy ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    已确认接班
                  </div>
                  <div className="text-[10px] text-emerald-300/70">
                    接班人：{viewingSnapshot.confirmedBy} · {viewingSnapshot.confirmedAt}
                  </div>
                  {viewingSnapshot.nextShiftNotes && (
                    <div className="text-[10px] text-emerald-300/60 mt-1">
                      接班备注：{viewingSnapshot.nextShiftNotes}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => { setConfirmModal(viewingSnapshot); setConfirmerName(""); setConfirmerNotes("") }}
                  className="w-full py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  确认接班
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">确认接班</h3>
              <button onClick={() => setConfirmModal(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="text-xs text-emerald-300">
                  您正在确认 <span className="font-medium">{SHIFT_OPTIONS.find((s) => s.key === confirmModal.shift)?.label}</span> 的交接
                </div>
                <div className="text-[10px] text-emerald-300/60 mt-1">
                  异常票 {confirmModal.failedTickets.length} 张，请逐一核对接班
                </div>
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">接班人姓名</label>
                <input
                  type="text"
                  value={confirmerName}
                  onChange={(e) => setConfirmerName(e.target.value)}
                  placeholder="输入您的姓名"
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">接班备注</label>
                <textarea
                  value={confirmerNotes}
                  onChange={(e) => setConfirmerNotes(e.target.value)}
                  placeholder="确认情况、补充说明..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSnapshot}
                className="px-4 py-2 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
              >
                确认接班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}