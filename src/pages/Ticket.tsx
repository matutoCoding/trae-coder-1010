import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { Ticket, Snowflake, HardHat, Shirt, CheckCircle, QrCode, XCircle, AlertTriangle, ChevronDown, Search, Filter, Clock, MapPin, Tag, AlertCircle, BarChart3, RotateCcw, History, X } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import type { TicketRecord } from "@/types"

const typeLabel: Record<string, string> = { full_day: "全天票", half_day: "半天票", hour: "小时票" }
const typeIcon: Record<string, React.ReactNode> = { ski: <Snowflake className="w-4 h-4" />, snowboard: <Snowflake className="w-4 h-4" />, helmet: <HardHat className="w-4 h-4" />, suit: <Shirt className="w-4 h-4" /> }
const typeGroupLabel: Record<string, string> = { ski: "双板", snowboard: "单板", helmet: "头盔", suit: "雪服" }
const statusStyle: Record<string, string> = { valid: "bg-emerald-500/20 text-emerald-400", used: "bg-slate-500/20 text-slate-400", expired: "bg-red-500/20 text-red-400", available: "bg-emerald-500/20 text-emerald-400", rented: "bg-amber-500/20 text-amber-400", maintenance: "bg-red-500/20 text-red-400" }
const statusLabel: Record<string, string> = { valid: "有效", used: "已使用", expired: "已过期", available: "可用", rented: "已租出", maintenance: "维护中" }
const PIE_COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc"]
const GATE_OPTIONS = ["全部", "A闸机", "B闸机", "C闸机", "D闸机"]
const STATUS_OPTIONS = ["全部", "valid", "used", "expired"]
const TYPE_OPTIONS = ["全部", "full_day", "half_day", "hour"]
const TIME_OPTIONS = ["全天", "上午(08-12)", "下午(12-17)", "晚间(17-20)"]

type ScanResult =
  | { success: true; ticket: TicketRecord }
  | { success: false; error: "not_found" | "already_used" | "expired"; ticket?: TicketRecord }

interface ScanLog {
  id: string
  code: string
  type: string
  time: string
  gate: string
  status: "success" | "duplicate" | "failed"
  ticket?: TicketRecord
}

interface TraceEntry {
  time: string
  gate: string
  result: "success" | "duplicate" | "failed"
}

export default function TicketPage() {
  const tickets = useStore((s) => s.tickets)
  const rentals = useStore((s) => s.rentals)
  const scanTicket = useStore((s) => s.scanTicket)

  const [code, setCode] = useState("")
  const [gate, setGate] = useState("A闸机")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [gateOpen, setGateOpen] = useState(false)
  const [scanLog, setScanLog] = useState<ScanLog[]>([])

  const [viewMode, setViewMode] = useState<"normal" | "review">("normal")
  const [filterCode, setFilterCode] = useState("")
  const [filterStatus, setFilterStatus] = useState("全部")
  const [filterGate, setFilterGate] = useState("全部")
  const [filterType, setFilterType] = useState("全部")
  const [filterTime, setFilterTime] = useState("全天")
  const [showFilter, setShowFilter] = useState(false)
  const [traceTicket, setTraceTicket] = useState<{ code: string; records: TraceEntry[] } | null>(null)

  const inTimeRange = (timeStr: string, range: string) => {
    if (range === "全天") return true
    const hour = parseInt(timeStr.split(":")[0] || "0")
    if (range === "上午(08-12)") return hour >= 8 && hour < 12
    if (range === "下午(12-17)") return hour >= 12 && hour < 17
    if (range === "晚间(17-20)") return hour >= 17 && hour < 20
    return true
  }

  const getActualUsedGate = (t: TicketRecord) => t.status === "used" ? (t.usedGate || t.gate) : t.gate
  const getActualUsedTime = (t: TicketRecord) => t.status === "used" ? (t.usedAt || t.timestamp) : t.timestamp

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      if (a.status === "used" && b.status !== "used") return -1
      if (a.status !== "used" && b.status === "used") return 1
      return getActualUsedTime(b).localeCompare(getActualUsedTime(a))
    })
  }, [tickets])

  const filtered = useMemo(() => {
    return sortedTickets.filter((t) => {
      if (filterCode && !t.code.toLowerCase().includes(filterCode.toLowerCase()) && !t.id.toLowerCase().includes(filterCode.toLowerCase())) return false
      if (filterStatus !== "全部" && t.status !== filterStatus) return false
      if (filterType !== "全部" && t.type !== filterType) return false
      if (filterGate !== "全部" && getActualUsedGate(t) !== filterGate) return false
      if (!inTimeRange(getActualUsedTime(t), filterTime)) return false
      return true
    })
  }, [sortedTickets, filterCode, filterStatus, filterGate, filterType, filterTime])

  const duplicateScans = scanLog.filter((l) => l.status === "duplicate")
  const failedScans = scanLog.filter((l) => l.status === "failed")
  const successScans = scanLog.filter((l) => l.status === "success")

  const reviewData = useMemo(() => {
    const byGate: Record<string, { total: number; duplicates: number; failed: number }> = {}
    const byType: Record<string, { total: number; duplicates: number }> = {}
    const byHour: Record<string, number> = {}

    filtered.forEach((t) => {
      const g = getActualUsedGate(t)
      const time = getActualUsedTime(t)
      const hour = time.split(":")[0] + ":00"
      if (!byGate[g]) byGate[g] = { total: 0, duplicates: 0, failed: 0 }
      byGate[g].total++
      if (!byType[t.type]) byType[t.type] = { total: 0, duplicates: 0 }
      byType[t.type].total++
      if (!byHour[hour]) byHour[hour] = 0
      byHour[hour]++
    })

    duplicateScans.forEach((d) => {
      if (filterGate === "全部" || d.gate === filterGate) {
        if (!byGate[d.gate]) byGate[d.gate] = { total: 0, duplicates: 0, failed: 0 }
        byGate[d.gate].duplicates++
        if (d.ticket) {
          if (!byType[d.ticket.type]) byType[d.ticket.type] = { total: 0, duplicates: 0 }
          byType[d.ticket.type].duplicates++
        }
      }
    })

    failedScans.forEach((f) => {
      if (filterGate === "全部" || f.gate === filterGate) {
        if (!byGate[f.gate]) byGate[f.gate] = { total: 0, duplicates: 0, failed: 0 }
        byGate[f.gate].failed++
      }
    })

    const gateBarData = Object.entries(byGate).map(([name, v]) => ({
      name,
      核销: v.total,
      重复: v.duplicates,
      失败: v.failed,
    }))

    const hourlyData = Object.entries(byHour)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }))

    return { byGate, byType, gateBarData, hourlyData }
  }, [filtered, duplicateScans, failedScans, filterGate])

  const filteredTotal = filtered.length
  const filteredUsed = filtered.filter((t) => t.status === "used").length
  const filteredValid = filtered.filter((t) => t.status === "valid").length
  const gateForStats = filterGate !== "全部" ? `(${filterGate})` : ""

  const pieData = ["full_day", "half_day", "hour"].map((type) => ({
    name: typeLabel[type],
    value: filtered.filter((t) => t.type === type).length,
  }))

  const rentalsByType = (["ski", "snowboard", "helmet", "suit"] as const).map((type) => ({
    type,
    label: typeGroupLabel[type],
    items: rentals.filter((r) => r.type === type),
  }))

  const buildTrace = (code: string) => {
    const records: TraceEntry[] = []
    scanLog.filter((l) => l.code.toLowerCase() === code.toLowerCase()).forEach((l) => {
      records.push({ time: l.time, gate: l.gate, result: l.status })
    })
    const ticket = tickets.find((t) => t.code.toLowerCase() === code.toLowerCase())
    if (ticket && ticket.usedAt && ticket.usedGate) {
      records.push({ time: ticket.usedAt, gate: ticket.usedGate, result: "success" })
    }
    records.sort((a, b) => a.time.localeCompare(b.time))
    return records
  }

  const handleScan = () => {
    if (!code.trim()) return
    const scanResult = scanTicket(code.trim(), gate)
    setResult(scanResult)

    const logId = Date.now().toString()
    if (scanResult.success) {
      setScanLog((prev) => [
        {
          id: logId,
          code: scanResult.ticket.code,
          type: typeLabel[scanResult.ticket.type],
          time: scanResult.ticket.usedAt || new Date().toLocaleString("zh-CN"),
          gate,
          status: "success",
          ticket: scanResult.ticket,
        },
        ...prev,
      ])
    } else {
      const errorResult = scanResult as { success: false; error: string; ticket?: TicketRecord }
      setScanLog((prev) => [
        {
          id: logId,
          code: code.trim(),
          type: errorResult.ticket ? typeLabel[errorResult.ticket.type] : "-",
          time: new Date().toLocaleString("zh-CN"),
          gate,
          status: errorResult.error === "already_used" ? "duplicate" : "failed",
          ticket: errorResult.ticket,
        },
        ...prev,
      ])
    }
    setCode("")
  }

  const renderResult = () => {
    if (!result) return null

    let resultStyle = "bg-red-500/10 border-red-500/30"
    let content: React.ReactNode = null

    if (result.success) {
      resultStyle = "bg-emerald-500/10 border-emerald-500/30"
      content = (
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-emerald-400 font-medium">✓ 核销成功！</div>
            <div className="text-xs text-ice-300/60 mt-1">
              {typeLabel[result.ticket.type]} · {result.ticket.code} · 核销时间: {result.ticket.usedAt} · {gate}
            </div>
          </div>
        </div>
      )
    } else {
      const errorResult = result as { success: false; error: "not_found" | "already_used" | "expired"; ticket?: TicketRecord }
      if (errorResult.error === "already_used") {
        resultStyle = "bg-amber-500/10 border-amber-500/30"
        content = (
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-amber-400 font-medium">
                ⚠️ 重复核销 · 上次: {errorResult.ticket?.usedAt} @ {errorResult.ticket?.usedGate}
              </div>
              {errorResult.ticket && (
                <div className="text-xs text-ice-300/60 mt-1">
                  {typeLabel[errorResult.ticket.type]} · {errorResult.ticket.code}
                </div>
              )}
            </div>
          </div>
        )
      } else {
        const errMsg = errorResult.error === "not_found" ? "❌ 票号不存在，请检查输入" : "❌ 该票已过期"
        content = (
          <div className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-red-400">{errMsg}</div>
          </div>
        )
      }
    }

    return (
      <div className={`mt-4 p-3 rounded-lg border ${resultStyle}`}>
        {content}
      </div>
    )
  }

  return (
    <div className="space-y-5 p-1">
      <div className="glow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-ice-400" />
            <h3 className="text-sm font-medium text-ice-300/70">票务核销</h3>
          </div>
          <div className="flex gap-1.5 bg-gray-900/60 rounded-lg p-0.5 border border-ice-500/10">
            <button
              onClick={() => setViewMode("normal")}
              className={`px-3 py-1 text-xs rounded transition-colors ${viewMode === "normal" ? "bg-ice-500 text-white" : "text-ice-300/50 hover:text-ice-300"}`}
            >
              日常核销
            </button>
            <button
              onClick={() => setViewMode("review")}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${viewMode === "review" ? "bg-ice-500 text-white" : "text-ice-300/50 hover:text-ice-300"}`}
            >
              <BarChart3 className="w-3 h-3" />值班复盘
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="输入或扫描票号 (如: SK20260000)"
            className="flex-1 px-4 py-2.5 bg-gray-900/60 border border-ice-500/20 rounded-lg text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 focus:ring-1 focus:ring-ice-400/30 font-mono"
          />
          <div className="relative">
            <button
              onClick={() => setGateOpen(!gateOpen)}
              className="w-full sm:w-32 px-4 py-2.5 bg-gray-900/60 border border-ice-500/20 rounded-lg text-ice-100 flex items-center justify-between gap-2 hover:border-ice-400/40 transition-colors"
            >
              <span>{gate}</span>
              <ChevronDown className={`w-4 h-4 text-ice-300/50 transition-transform ${gateOpen ? "rotate-180" : ""}`} />
            </button>
            {gateOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 border border-ice-500/20 rounded-lg overflow-hidden z-10">
                {GATE_OPTIONS.filter((g) => g !== "全部").map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGate(g)
                      setGateOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-ice-500/10 transition-colors ${gate === g ? "text-ice-400 bg-ice-500/10" : "text-ice-100"}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleScan}
            className="px-6 py-2.5 bg-gradient-to-r from-ice-500 to-sky-500 text-white font-medium rounded-lg hover:from-ice-400 hover:to-sky-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-ice-500/20"
          >
            <CheckCircle className="w-4 h-4" />核销
          </button>
        </div>
        {renderResult()}
        <div className="mt-3 text-[10px] text-ice-300/30">
          测试票号: SK20260045, SK20260046, SK20260047, SK20260048, SK20260049
        </div>
      </div>

      {viewMode === "normal" && scanLog.length > 0 && (
        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">最近核销记录</h3>
          <div className="max-h-[180px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900/95">
                <tr className="text-ice-300/50 text-left">
                  <th className="pb-2 font-medium">票号</th>
                  <th className="pb-2 font-medium">票种</th>
                  <th className="pb-2 font-medium">核销时间</th>
                  <th className="pb-2 font-medium">闸机</th>
                  <th className="pb-2 font-medium">结果</th>
                  {duplicateScans.length > 0 && <th className="pb-2 font-medium">上次核销</th>}
                  <th className="pb-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-500/5">
                {scanLog.slice(0, 15).map((s) => (
                  <tr key={s.id} className="text-ice-100">
                    <td className="py-1.5 font-mono">{s.code}</td>
                    <td>{s.type}</td>
                    <td className="font-mono text-[10px]">{s.time}</td>
                    <td>{s.gate}</td>
                    <td>
                      {s.status === "success" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">✓ 成功</span>
                      )}
                      {s.status === "duplicate" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">⚠ 重复</span>
                      )}
                      {s.status === "failed" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">✗ 失败</span>
                      )}
                    </td>
                    {duplicateScans.length > 0 && (
                      <td className="font-mono text-[10px] text-ice-300/50">
                        {s.status === "duplicate" && s.ticket && `${s.ticket.usedAt} · ${s.ticket.usedGate}`}
                      </td>
                    )}
                    <td>
                      <button
                        onClick={() => setTraceTicket({ code: s.code, records: buildTrace(s.code) })}
                        className="text-[10px] text-ice-400 hover:text-ice-300 flex items-center gap-0.5"
                      >
                        <History className="w-3 h-3" />轨迹
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "review" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: `总核销量${gateForStats}`, value: filteredTotal, accent: "border-sky-500/40", icon: <Ticket className="w-5 h-5" /> },
              { label: `成功核销${gateForStats}`, value: filteredUsed, accent: "border-emerald-500/40", icon: <CheckCircle className="w-5 h-5" /> },
              { label: `重复扫码${gateForStats}`, value: filterGate !== "全部" ? reviewData.byGate[filterGate]?.duplicates || 0 : duplicateScans.length, accent: "border-amber-500/40", icon: <RotateCcw className="w-5 h-5" /> },
              { label: `失败票号${gateForStats}`, value: filterGate !== "全部" ? reviewData.byGate[filterGate]?.failed || 0 : failedScans.length, accent: "border-red-500/40", icon: <XCircle className="w-5 h-5" /> },
            ].map((k) => (
              <div key={k.label} className={`glow-card flex items-center gap-4 border-l-2 ${k.accent}`}>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10 text-ice-400">{k.icon}</div>
                <div>
                  <div className="font-mono text-2xl font-bold text-ice-400 glow-text">{k.value}</div>
                  <div className="text-[10px] text-ice-300/60 tracking-wide">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glow-card">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">分时段核销分布</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={reviewData.hourlyData}>
                  <XAxis dataKey="name" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glow-card">
              <h3 className="text-sm font-medium text-ice-300/70 mb-3">各闸机异常统计</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={reviewData.gateBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
                  <XAxis dataKey="name" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
                  <Bar dataKey="核销" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="重复" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="失败" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {failedScans.length > 0 && (
            <div className="glow-card">
              <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />失败票号列表
              </h3>
              <div className="max-h-[120px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-900/95">
                    <tr className="text-ice-300/50 text-left">
                      <th className="pb-2 font-medium">票号</th>
                      <th className="pb-2 font-medium">扫码时间</th>
                      <th className="pb-2 font-medium">闸机</th>
                      <th className="pb-2 font-medium">原因</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ice-500/5">
                    {failedScans.map((f) => (
                      <tr key={f.id} className="text-ice-100">
                        <td className="py-1.5 font-mono text-red-300">{f.code}</td>
                        <td className="font-mono text-[10px]">{f.time}</td>
                        <td>{f.gate}</td>
                        <td>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                            {f.status === "failed" ? "票号不存在" : "已过期"}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setTraceTicket({ code: f.code, records: buildTrace(f.code) })}
                            className="text-[10px] text-ice-400 hover:text-ice-300 flex items-center gap-0.5"
                          >
                            <History className="w-3 h-3" />轨迹
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: `筛选结果${gateForStats}`, value: filteredTotal, accent: "border-sky-500/40", icon: <Ticket className="w-5 h-5" /> },
          { label: `已使用${gateForStats}`, value: filteredUsed, accent: "border-slate-500/40", icon: <CheckCircle className="w-5 h-5" /> },
          { label: `有效票${gateForStats}`, value: filteredValid, accent: "border-emerald-500/40", icon: <Ticket className="w-5 h-5" /> },
        ].map((k) => (
          <div key={k.label} className={`glow-card flex items-center gap-4 border-l-2 ${k.accent}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10 text-ice-400">{k.icon}</div>
            <div>
              <div className="font-mono text-3xl font-bold text-ice-400 glow-text">{k.value}</div>
              <div className="text-xs text-ice-300/60 tracking-wide">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-ice-300/70">闸机验票记录</h3>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-300 transition-colors px-2 py-1 rounded border border-ice-500/20 hover:border-ice-500/40"
          >
            <Filter className="w-3 h-3" />{showFilter ? "收起" : "筛选"}
          </button>
        </div>

        {showFilter && (
          <div className="mb-3 p-3 rounded-lg bg-frost-surface/50 border border-ice-500/10 space-y-2">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[150px] relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ice-300/30" />
                <input
                  type="text"
                  value={filterCode}
                  onChange={(e) => setFilterCode(e.target.value)}
                  placeholder="搜索票号..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/40 font-mono"
                />
              </div>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 focus:outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 focus:outline-none"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === "全部" ? "全部状态" : statusLabel[s]}</option>
                ))}
              </select>
              <select
                value={filterGate}
                onChange={(e) => setFilterGate(e.target.value)}
                className="px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 focus:outline-none"
              >
                {GATE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g === "全部" ? "全部闸机" : g}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-xs text-ice-100 focus:outline-none"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t === "全部" ? "全部票种" : typeLabel[t]}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] text-ice-300/30">
              找到 {filtered.length} 条记录（共 {tickets.length} 条）
              {filterGate !== "全部" && ` · 仅统计 ${filterGate} 的实际核销数据`}
            </div>
          </div>
        )}

        <div className="max-h-[240px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900/95">
              <tr className="text-ice-300/50 text-left">
                <th className="pb-2 font-medium">票号</th>
                <th className="pb-2 font-medium">类型</th>
                <th className="pb-2 font-medium">核销时间</th>
                <th className="pb-2 font-medium">闸机</th>
                <th className="pb-2 font-medium">状态</th>
                <th className="pb-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ice-500/5">
              {filtered.slice(0, 30).map((t) => (
                <tr key={t.id} className="text-ice-100">
                  <td className="py-1.5 font-mono">{t.code}</td>
                  <td>{typeLabel[t.type]}</td>
                  <td className="font-mono text-[10px]">{getActualUsedTime(t)}</td>
                  <td>{getActualUsedGate(t)}</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusStyle[t.status]}`}>{statusLabel[t.status]}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => setTraceTicket({ code: t.code, records: buildTrace(t.code) })}
                      className="text-[10px] text-ice-400 hover:text-ice-300 flex items-center gap-0.5"
                    >
                      <History className="w-3 h-3" />轨迹
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {traceTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-[420px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-frost-card py-2">
              <h3 className="text-sm font-semibold text-ice-200 flex items-center gap-1.5">
                <History className="w-4 h-4" />票号轨迹: <span className="font-mono">{traceTicket.code}</span>
              </h3>
              <button onClick={() => setTraceTicket(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {traceTicket.records.length === 0 && (
                <div className="text-ice-300/40 text-xs text-center py-6">暂无核销轨迹</div>
              )}
              {traceTicket.records.map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg border border-ice-500/10 bg-ice-500/5">
                  <div className="mt-0.5">
                    {r.result === "success" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {r.result === "duplicate" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {r.result === "failed" && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-ice-300/60 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />{r.time}
                      <span className="mx-1">·</span>
                      <MapPin className="w-2.5 h-2.5" />{r.gate}
                      <span className="mx-1">·</span>
                      <Tag className="w-2.5 h-2.5" />
                      {r.result === "success" && "核销成功"}
                      {r.result === "duplicate" && "重复扫码"}
                      {r.result === "failed" && "扫码失败"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">租赁管理</h3>
        <div className="space-y-4">
          {rentalsByType.map(({ type, label, items }) => (
            <div key={type}>
              <div className="flex items-center gap-1.5 text-xs text-ice-300/60 mb-2">
                {typeIcon[type]}
                <span>{label}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {items.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-ice-500/10 bg-ice-500/5 p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs text-ice-100">{r.name}</div>
                      {r.renter && <div className="text-[10px] text-ice-300/40 mt-0.5">租客: {r.renter}</div>}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${statusStyle[r.status]}`}>
                      {statusLabel[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">票种分布 {gateForStats}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} stroke="none">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-ice-300/60">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>
        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">闸机营收 {gateForStats}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reviewData.gateBarData}>
              <XAxis dataKey="name" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
              <Bar dataKey="核销" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
