import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import {
  AlertTriangle,
  ShieldAlert,
  CloudSun,
  Info,
  Users,
  Snowflake,
  Mountain,
  CableCar,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  Lightbulb,
  Filter,
  FileText,
  RotateCcw,
  Snowflake as SnowflakeIcon,
  Pause,
  Play,
  TrendingUp,
  Edit3,
  Check,
  X as XIcon,
  ClipboardList,
  ShieldCheck,
  Clock as ClockIcon,
  User as UserIcon,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { Alert, SnowMaker } from "@/types"

const alertIcons: Record<string, React.ReactNode> = {
  fault: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  safety: <ShieldAlert className="w-4 h-4 text-red-400" />,
  weather: <CloudSun className="w-4 h-4 text-yellow-400" />,
  info: <Info className="w-4 h-4 text-sky-400" />,
}

const alertBg: Record<string, string> = {
  fault: "border-orange-500/30 bg-orange-500/5",
  safety: "border-red-500/30 bg-red-500/5",
  weather: "border-yellow-500/30 bg-yellow-500/5",
  info: "border-sky-500/30 bg-sky-500/5",
}

const statusCfg: Record<string, { label: string; color: string }> = {
  running: { label: "运行中", color: "#34d399" },
  idle: { label: "待机", color: "#9ca3af" },
  fault: { label: "故障", color: "#f87171" },
  maintain: { label: "维护中", color: "#fbbf24" },
}

const planStatusCfg: Record<string, { label: string; color: string }> = {
  active: { label: "进行中", color: "#34d399" },
  planned: { label: "已计划", color: "#38bdf8" },
  completed: { label: "已完成", color: "#6b7280" },
  cancelled: { label: "已取消", color: "#ef4444" },
}

const STATUS_FILTER = ["全部", "待处理", "已处理"]
const TYPE_FILTER = ["全部", "fault", "safety", "weather", "info"]

const handlerLabel: Record<string, string> = {
  fault: "设备故障",
  safety: "安全告警",
  weather: "气象告警",
  info: "系统通知",
}

interface MakerDetail {
  maker: SnowMaker
  trail: ReturnType<typeof useStore.getState>["trails"][number] | undefined
  relatedPlans: ReturnType<typeof useStore.getState>["snowPlans"]
  relatedMakers: SnowMaker[]
}

export default function Dashboard() {
  const hourlyFlow = useStore((s) => s.hourlyFlow)
  const snowMakers = useStore((s) => s.snowMakers)
  const trails = useStore((s) => s.trails)
  const lifts = useStore((s) => s.lifts)
  const alerts = useStore((s) => s.alerts)
  const snowPlans = useStore((s) => s.snowPlans)
  const resolveAlert = useStore((s) => s.resolveAlert)
  const alertStatusFilter = useStore((s) => s.alertStatusFilter)
  const alertTypeFilter = useStore((s) => s.alertTypeFilter)
  const alertHandlerFilter = useStore((s) => s.alertHandlerFilter)
  const setAlertStatusFilter = useStore((s) => s.setAlertStatusFilter)
  const setAlertTypeFilter = useStore((s) => s.setAlertTypeFilter)
  const setAlertHandlerFilter = useStore((s) => s.setAlertHandlerFilter)
  const updateSnowMaker = useStore((s) => s.updateSnowMaker)
  const alertHandovers = useStore((s) => s.alertHandovers)
  const createAlertHandover = useStore((s) => s.createAlertHandover)
  const confirmAlertHandover = useStore((s) => s.confirmAlertHandover)

  const [selectedMaker, setSelectedMaker] = useState<string | null>(null)
  const [resolveModal, setResolveModal] = useState<string | null>(null)
  const [handlerName, setHandlerName] = useState("")
  const [handlerNotes, setHandlerNotes] = useState("")
  const [showAlertFilter, setShowAlertFilter] = useState(false)
  const [editingTrail, setEditingTrail] = useState(false)
  const [tempTrail, setTempTrail] = useState("")
  const [alertViewTab, setAlertViewTab] = useState<"pending" | "resolved" | "handover">("pending")
  const [showHandoverModal, setShowHandoverModal] = useState(false)
  const [handoverOperator, setHandoverOperator] = useState("")
  const [handoverNotes, setHandoverNotes] = useState("")
  const [viewingHandover, setViewingHandover] = useState<typeof alertHandovers[number] | null>(null)
  const [confirmHandoverModal, setConfirmHandoverModal] = useState<typeof alertHandovers[number] | null>(null)
  const [confirmerName, setConfirmerName] = useState("")
  const [confirmerHandoverNotes, setConfirmerHandoverNotes] = useState("")

  const totalVisitors = hourlyFlow.reduce((sum, h) => sum + h.count, 0)
  const runningMakers = snowMakers.filter((s) => s.status === "running").length
  const openTrails = trails.filter((t) => t.status === "open").length
  const runningLifts = lifts.filter((l) => l.status === "running").length

  const today = new Date().toLocaleDateString("zh-CN")
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (alertStatusFilter === "待处理" && a.resolved) return false
      if (alertStatusFilter === "已处理" && !a.resolved) return false
      if (alertTypeFilter !== "全部" && a.type !== alertTypeFilter) return false
      if (alertHandlerFilter !== "全部" && a.resolvedBy !== alertHandlerFilter) return false
      return true
    })
  }, [alerts, alertStatusFilter, alertTypeFilter, alertHandlerFilter])

  const unresolved = filteredAlerts.filter((a) => !a.resolved)
  const resolved = filteredAlerts.filter((a) => a.resolved)

  const todayResolved = resolved.filter((a) => a.resolvedAt?.startsWith(today))
  const todaySummary = useMemo(() => {
    const byType: Record<string, number> = {}
    const byHandler: Record<string, number> = {}
    todayResolved.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1
      if (a.resolvedBy) byHandler[a.resolvedBy] = (byHandler[a.resolvedBy] || 0) + 1
    })
    return { byType, byHandler, total: todayResolved.length }
  }, [todayResolved])

  const unresolvedByType = useMemo(() => {
    const result: Record<string, number> = {}
    unresolved.forEach((a) => {
      result[a.type] = (result[a.type] || 0) + 1
    })
    return result
  }, [unresolved])

  const handlerOptions = useMemo(() => {
    const handlers = new Set<string>()
    alerts.filter((a) => a.resolved && a.resolvedBy).forEach((a) => a.resolvedBy && handlers.add(a.resolvedBy))
    return ["全部", ...Array.from(handlers)]
  }, [alerts])

  const todayHandovers = useMemo(() => {
    return alertHandovers.filter((h) => h.date === today)
  }, [alertHandovers, today])

  const pendingCount = alerts.filter((a) => !a.resolved).length
  const todayResolvedCount = alerts.filter((a) => a.resolved && a.resolvedAt?.startsWith(today)).length

  const handleCreateHandover = () => {
    createAlertHandover(handoverOperator, "morning", handoverNotes)
    setShowHandoverModal(false)
    setHandoverOperator("")
    setHandoverNotes("")
  }

  const handleConfirmHandover = () => {
    if (!confirmHandoverModal) return
    confirmAlertHandover(confirmHandoverModal.id, confirmerName || "接班人", confirmerHandoverNotes)
    setConfirmHandoverModal(null)
    setConfirmerName("")
    setConfirmerHandoverNotes("")
    setViewingHandover(null)
  }

  const kpis = [
    { label: "今日客流", value: totalVisitors, icon: <Users className="w-5 h-5" /> },
    { label: "运行造雪机", value: runningMakers, icon: <Snowflake className="w-5 h-5" /> },
    { label: "开放雪道", value: openTrails, icon: <Mountain className="w-5 h-5" /> },
    { label: "运行缆车", value: runningLifts, icon: <CableCar className="w-5 h-5" /> },
  ]

  const makerColor = (s: string) =>
    s === "running" ? "#34d399" : s === "fault" ? "#f87171" : s === "maintain" ? "#fbbf24" : "#9ca3af"

  const liftColor = (s: string) => (s === "running" ? "#34d399" : "#f87171")

  const makerDetail = useMemo<MakerDetail | null>(() => {
    if (!selectedMaker) return null
    const maker = snowMakers.find((m) => m.id === selectedMaker)
    if (!maker) return null
    const trail = trails.find((t) => t.name === maker.trail)
    const relatedPlans = snowPlans.filter(
      (p) => p.snowMakers.includes(maker.id) && p.status !== "cancelled"
    )
    const relatedMakers = relatedPlans.length > 0
      ? snowMakers.filter((m) => m.id !== maker.id && relatedPlans.some((p) => p.snowMakers.includes(m.id)))
      : []
    return { maker, trail, relatedPlans, relatedMakers }
  }, [selectedMaker, snowMakers, trails, snowPlans])

  const handleResolve = (id: string) => {
    resolveAlert(id, handlerName || "管理员", handlerNotes)
    setResolveModal(null)
    setHandlerName("")
    setHandlerNotes("")
  }

  const getSuggestion = (detail: MakerDetail) => {
    if (!detail.trail) return null
    if (detail.trail.status === "closed") {
      const hasActivePlan = detail.relatedPlans.some((p) => p.status === "active")
      const hasPlannedPlan = detail.relatedPlans.some((p) => p.status === "planned")
      const makersRunning = detail.relatedMakers.filter((m) => m.status === "running")
      const makerRunning = detail.maker.status === "running"

      if (hasActivePlan || makerRunning || makersRunning.length > 0) {
        return {
          level: "warning" as const,
          title: "⚠️ 雪道已关闭，建议暂停造雪",
          actions: [
            `雪道当前状态: 已关闭`,
            hasActivePlan ? "• 存在进行中的造雪计划，建议取消" : "",
            makerRunning ? `• 造雪机${detail.maker.name}正在运行，建议停机` : "",
            makersRunning.length > 0 ? `• 同区域${makersRunning.length}台造雪机在运行，建议评估` : "",
            hasPlannedPlan ? "• 后续造雪计划需确认雪道开放安排" : "",
          ].filter(Boolean),
        }
      }
    }
    if (detail.trail.status === "grooming") {
      return {
        level: "info" as const,
        title: "ℹ️ 雪道压雪中，建议配合安排",
        actions: [
          `雪道当前状态: 压雪中`,
          detail.maker.status === "running" ? "• 造雪机运行中，压雪完成后可形成优质雪面" : "• 造雪机待机中，可安排造雪",
          detail.relatedPlans.length > 0 ? `• 关联${detail.relatedPlans.length}个造雪计划` : "• 建议安排造雪计划以维持雪量",
        ],
      }
    }
    if (detail.trail.status === "open" && detail.relatedPlans.length === 0) {
      return {
        level: "info" as const,
        title: "💡 雪道开放，建议关注造雪安排",
        actions: [
          `雪道当前状态: 开放`,
          `当前雪厚: ${detail.trail.snowDepth}cm`,
          detail.trail.snowDepth < 40 ? "• ⚠️ 雪量不足40cm，建议安排造雪" : "• 雪量充足",
          "• 暂无关联造雪计划，请关注天气",
        ],
      }
    }
    return null
  }

  return (
    <div className="space-y-5 p-1">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glow-card animate-glow-pulse flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10 text-ice-400">{k.icon}</div>
            <div>
              <div className="font-mono text-3xl font-bold text-ice-400 glow-text">{k.value.toLocaleString()}</div>
              <div className="text-xs text-ice-300/60 tracking-wide">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">客流趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyFlow}>
              <defs>
                <linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" tick={{ fill: "#7dd3fc", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7dd3fc", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} labelStyle={{ color: "#7dd3fc" }} />
              <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} fill="url(#iceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glow-card overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-ice-500/20">
            <div className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  setAlertViewTab("pending")
                  setAlertStatusFilter("待处理")
                }}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${alertViewTab === "pending" ? "text-ice-300 border-b-2 border-ice-400" : "text-ice-300/40 hover:text-ice-300/70"}`}
              >
                待处理 ({pendingCount})
              </button>
              <button
                onClick={() => {
                  setAlertViewTab("resolved")
                  setAlertStatusFilter("已处理")
                }}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${alertViewTab === "resolved" ? "text-ice-300 border-b-2 border-ice-400" : "text-ice-300/40 hover:text-ice-300/70"}`}
              >
                已处理 ({todayResolvedCount})
              </button>
              <button
                onClick={() => setAlertViewTab("handover")}
                className={`flex-1 text-xs py-2 font-medium transition-colors ${alertViewTab === "handover" ? "text-ice-300 border-b-2 border-ice-400" : "text-ice-300/40 hover:text-ice-300/70"}`}
              >
                交接班 ({todayHandovers.length})
              </button>
            </div>
            {alertViewTab !== "handover" && (
              <button
                onClick={() => setShowAlertFilter(!showAlertFilter)}
                className="ml-2 text-ice-300/40 hover:text-ice-300 p-1"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {alertViewTab !== "handover" && showAlertFilter && (
            <div className="p-2 mb-2 border-b border-ice-500/10 space-y-2">
              <div className="flex gap-2">
                <select
                  value={alertTypeFilter}
                  onChange={(e) => setAlertTypeFilter(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                >
                  {TYPE_FILTER.map((t) => (
                    <option key={t} value={t}>{t === "全部" ? "全部类型" : handlerLabel[t]}</option>
                  ))}
                </select>
                {alertStatusFilter === "已处理" && (
                  <select
                    value={alertHandlerFilter}
                    onChange={(e) => setAlertHandlerFilter(e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-gray-900/60 border border-ice-500/15 rounded text-[10px] text-ice-100 focus:outline-none"
                  >
                    {handlerOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-ice-300/40">
                <span>筛选后 {filteredAlerts.length} 条（共 {alerts.length}）</span>
                {(alertTypeFilter !== "全部" || alertHandlerFilter !== "全部") && (
                  <button
                    onClick={() => {
                      setAlertTypeFilter("全部")
                      setAlertHandlerFilter("全部")
                    }}
                    className="text-ice-400 hover:text-ice-300 flex items-center gap-0.5"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />重置
                  </button>
                )}
              </div>
            </div>
          )}

          {alertViewTab === "handover" && (
            <div className="px-1">
              <button
                onClick={() => setShowHandoverModal(true)}
                className="w-full py-2 mb-3 bg-ice-500/20 text-ice-300 rounded-lg text-xs font-medium hover:bg-ice-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                生成今日交接
              </button>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {todayHandovers.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-6">暂无交接记录</div>
                )}
                {todayHandovers.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setViewingHandover(h)}
                    className="p-2.5 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-ice-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-ice-500/20 text-ice-300 text-[10px] font-medium">
                          {h.shift === "morning" ? "早班" : h.shift === "afternoon" ? "午班" : "晚班"}
                        </span>
                        {h.confirmedBy ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />已接班
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] flex items-center gap-0.5">
                            <ClockIcon className="w-2.5 h-2.5" />待接班
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-ice-300/50 mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <UserIcon className="w-2.5 h-2.5" />{h.generatedBy}
                      </span>
                    </div>
                    <div className="text-[10px] text-ice-300/60 mt-1">
                      待处理 {h.pendingAlerts.length} 条 · 今日处理 {h.resolvedToday.length} 条
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alertViewTab !== "handover" && (
            <>
              {alertStatusFilter === "已处理" && todayResolved.length > 0 && (
                <div className="mb-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mb-1">
                    <FileText className="w-3 h-3" />今日处理摘要 ({todaySummary.total}条)
                  </div>
                  <div className="text-[10px] text-emerald-300/70 flex flex-wrap gap-x-3 gap-y-0.5">
                    {Object.entries(todaySummary.byType).map(([type, count]) => (
                      <span key={type}>{handlerLabel[type]} {count}条</span>
                    ))}
                  </div>
                  {Object.keys(todaySummary.byHandler).length > 0 && (
                    <div className="text-[10px] text-emerald-300/50 mt-0.5">
                      处理人：{Object.entries(todaySummary.byHandler).map(([h, c]) => `${h} ${c}条`).join("，")}
                    </div>
                  )}
                </div>
              )}

              {alertStatusFilter === "待处理" && unresolvedByType && Object.keys(unresolvedByType).length > 0 && (
                <div className="mb-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" />待处理汇总
                  </div>
                  <div className="text-[10px] text-amber-300/70 flex flex-wrap gap-x-3 gap-y-0.5">
                    {Object.entries(unresolvedByType).map(([type, count]) => (
                      <span key={type}>{handlerLabel[type]} {count}条</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {alertStatusFilter === "待处理" && unresolved.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-6">暂无待处理告警</div>
                )}
                {alertStatusFilter === "待处理" && unresolved.map((a) => (
                  <div key={a.id} className={`rounded-lg border p-2.5 flex items-start gap-2 ${alertBg[a.type]}`}>
                    <div className="mt-0.5 shrink-0">{alertIcons[a.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-ice-100 truncate">{a.title}</div>
                      <div className="text-[10px] text-ice-300/50 mt-0.5 truncate">{a.message}</div>
                      <div className="text-[10px] text-ice-300/30 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{a.timestamp}
                      </div>
                    </div>
                    <button
                      onClick={() => { setResolveModal(a.id); setHandlerName(""); setHandlerNotes("") }}
                      className="shrink-0 text-[10px] px-2 py-1 rounded bg-ice-500/20 text-ice-300 hover:bg-ice-500/30 transition-colors"
                    >
                      处理
                    </button>
                  </div>
                ))}
                {alertStatusFilter === "已处理" && resolved.length === 0 && (
                  <div className="text-ice-300/40 text-xs text-center py-6">暂无已处理告警</div>
                )}
                {alertStatusFilter === "已处理" && resolved.map((a) => (
                  <div key={a.id} className="rounded-lg border border-gray-600/30 bg-gray-700/10 p-2.5 flex items-start gap-2 opacity-80">
                    <div className="mt-0.5 shrink-0"><CheckCircle className="w-4 h-4 text-gray-400" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-300 truncate">{a.title}</div>
                      <div className="text-[10px] text-gray-400/70 mt-0.5 truncate">{a.message}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{a.resolvedAt} · {a.resolvedBy}
                      </div>
                      {a.resolvedNotes && (
                        <div className="text-[10px] text-gray-400 mt-1 bg-gray-700/30 rounded px-1.5 py-1">
                          备注: {a.resolvedNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">处理告警</h3>
              <button onClick={() => setResolveModal(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-ice-300/60 mb-1 block">处理人</label>
              <input
                type="text"
                value={handlerName}
                onChange={(e) => setHandlerName(e.target.value)}
                placeholder="输入处理人姓名（默认：管理员）"
                className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-ice-300/60 mb-1 block">处理备注</label>
              <textarea
                value={handlerNotes}
                onChange={(e) => setHandlerNotes(e.target.value)}
                placeholder="描述处理措施和结果..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors">取消</button>
              <button onClick={() => handleResolve(resolveModal)} className="px-4 py-2 text-xs bg-ice-500 text-white rounded-lg hover:bg-ice-400 transition-colors">确认处理</button>
            </div>
          </div>
        </div>
      )}

      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">生成告警交接</h3>
              <button onClick={() => setShowHandoverModal(false)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/30 rounded-lg space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">待处理告警</span>
                  <span className="text-amber-400 font-mono">{pendingCount} 条</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ice-300/60">今日已处理</span>
                  <span className="text-emerald-400 font-mono">{todayResolvedCount} 条</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">值班员</label>
                <input
                  type="text"
                  value={handoverOperator}
                  onChange={(e) => setHandoverOperator(e.target.value)}
                  placeholder="输入值班员姓名"
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-ice-300/60 mb-1 block">交接说明</label>
                <textarea
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="写下需要注意的告警事项..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateHandover}
                className="px-4 py-2 text-xs bg-ice-500 text-white rounded-lg hover:bg-ice-400 transition-colors"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-[460px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#0f172a]/90 backdrop-blur py-1 -mt-1">
              <div>
                <h3 className="text-sm font-semibold text-ice-200 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-ice-400" />
                  告警交接详情
                </h3>
                <p className="text-[10px] text-ice-300/50 mt-0.5">
                  {viewingHandover.date} · 生成于 {viewingHandover.generatedAt}
                </p>
              </div>
              <button onClick={() => setViewingHandover(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-amber-400">{viewingHandover.pendingAlerts.length}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">待处理</div>
                </div>
                <div className="p-2 bg-gray-800/30 rounded text-center">
                  <div className="font-mono text-lg font-bold text-emerald-400">{viewingHandover.resolvedToday.length}</div>
                  <div className="text-[9px] text-ice-300/60 mt-0.5">今日处理</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-ice-300/70 font-medium mb-2 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  值班员：{viewingHandover.generatedBy}
                </div>
                {viewingHandover.handoverNotes && (
                  <div className="p-2.5 bg-ice-500/10 border border-ice-500/20 rounded-lg">
                    <div className="text-[10px] text-ice-300/60 mb-1">交接说明</div>
                    <p className="text-xs text-ice-200">{viewingHandover.handoverNotes}</p>
                  </div>
                )}
              </div>

              {viewingHandover.summary && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="text-[10px] text-amber-400 font-medium mb-1">待处理汇总</div>
                  <p className="text-xs text-amber-300/80">{viewingHandover.summary}</p>
                </div>
              )}

              {viewingHandover.confirmedBy ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    已确认接班
                  </div>
                  <div className="text-[10px] text-emerald-300/70">
                    接班人：{viewingHandover.confirmedBy} · {viewingHandover.confirmedAt}
                  </div>
                  {viewingHandover.successorNotes && (
                    <div className="text-[10px] text-emerald-300/60 mt-1">
                      接班备注：{viewingHandover.successorNotes}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setConfirmHandoverModal(viewingHandover)
                    setConfirmerName("")
                    setConfirmerHandoverNotes("")
                  }}
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

      {confirmHandoverModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">确认接班</h3>
              <button onClick={() => setConfirmHandoverModal(null)} className="text-ice-300/40 hover:text-ice-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="text-xs text-emerald-300">
                  您正在确认告警交接
                </div>
                <div className="text-[10px] text-emerald-300/60 mt-1">
                  待处理 {confirmHandoverModal.pendingAlerts.length} 条，请逐一核对接班
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
                  value={confirmerHandoverNotes}
                  onChange={(e) => setConfirmerHandoverNotes(e.target.value)}
                  placeholder="确认情况、补充说明..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmHandoverModal(null)}
                className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmHandover}
                className="px-4 py-2 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-400 transition-colors"
              >
                确认接班
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">雪场地图 <span className="text-ice-300/30 font-normal">（点击造雪机查看详情）</span></h3>
        <div className="relative">
          <svg viewBox="0 0 100 75" className="w-full h-auto" style={{ maxHeight: 280 }}>
            <defs>
              <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="100%" stopColor="#0b1120" />
              </linearGradient>
            </defs>
            <polygon points="50,5 90,70 10,70" fill="url(#mtnGrad)" stroke="#1e3a5f" strokeWidth="0.5" />
            <polygon points="25,25 55,70 0,70" fill="#0f1d33" stroke="#1e3a5f" strokeWidth="0.3" />
            <polygon points="70,20 95,70 50,70" fill="#0f1d33" stroke="#1e3a5f" strokeWidth="0.3" />
            <line x1="50" y1="5" x2="20" y2="70" stroke="#0EA5E9" strokeWidth="0.3" opacity="0.4" />
            <line x1="50" y1="5" x2="80" y2="70" stroke="#0EA5E9" strokeWidth="0.3" opacity="0.4" />
            <line x1="50" y1="5" x2="50" y2="70" stroke="#0EA5E9" strokeWidth="0.3" opacity="0.3" />

            {snowMakers.map((sm) => {
              const isSelected = selectedMaker === sm.id
              return (
                <g
                  key={sm.id}
                  className="cursor-pointer"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedMaker(null)
                    } else {
                      setSelectedMaker(sm.id)
                    }
                    setEditingTrail(false)
                  }}
                >
                  <circle cx={sm.position.x} cy={sm.position.y} r={isSelected ? 5 : 1.8} fill={makerColor(sm.status)} opacity={isSelected ? 0.3 : 0.15} />
                  <circle cx={sm.position.x} cy={sm.position.y} r={isSelected ? 3.5 : 1.8} fill={makerColor(sm.status)} opacity={0.85} stroke={isSelected ? "#fff" : "none"} strokeWidth="0.5" />
                </g>
              )
            })}

            {lifts.map((l, i) => {
              const cx = 15 + i * 15
              const cy = 68
              return (
                <g key={l.id}>
                  <rect x={cx - 2} y={cy - 1.2} width="4" height="2.4" rx="0.5" fill={liftColor(l.status)} opacity={0.85} />
                  <circle cx={cx} cy={cy} r="4" fill={liftColor(l.status)} opacity={0.12} />
                  <text x={cx} y={cy + 5} textAnchor="middle" fill="#7dd3fc" fontSize="2.5" opacity={0.7}>{l.name}</text>
                </g>
              )
            })}

            <g className="opacity-40 mt-1">
              <circle cx="90" cy="10" r="1" fill="#34d399" />
              <text x="93" y="10.5" fill="#9ca3af" fontSize="2.5">运行</text>
              <circle cx="90" cy="15" r="1" fill="#9ca3af" />
              <text x="93" y="15.5" fill="#9ca3af" fontSize="2.5">待机</text>
              <circle cx="90" cy="20" r="1" fill="#f87171" />
              <text x="93" y="20.5" fill="#9ca3af" fontSize="2.5">故障</text>
            </g>
          </svg>

          {makerDetail && (
            <div className="absolute top-4 right-4 glow-card p-3 text-xs space-y-2 min-w-[240px] max-w-[300px]">
              <div className="flex items-center justify-between">
                <span className="text-ice-200 font-semibold">{makerDetail.maker.name}</span>
                <button
                  onClick={() => {
                    setSelectedMaker(null)
                    setEditingTrail(false)
                  }}
                  className="text-ice-300/40 hover:text-ice-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: makerColor(makerDetail.maker.status) }} />
                <span style={{ color: makerColor(makerDetail.maker.status) }}>{statusCfg[makerDetail.maker.status].label}</span>
                <span className="text-ice-300/40 mx-1">·</span>
                <span className="text-ice-300/60">{makerDetail.maker.model}</span>
              </div>

              <div className="text-ice-300/60">
                <div className="flex items-center justify-between">
                  <span>所属雪道：</span>
                  {!editingTrail && (
                    <button
                      onClick={() => {
                        setTempTrail(makerDetail.maker.trail)
                        setEditingTrail(true)
                      }}
                      className="text-ice-400 hover:text-ice-300 flex items-center gap-0.5 text-[10px]"
                    >
                      <Edit3 className="w-3 h-3" />改挂
                    </button>
                  )}
                </div>
                {editingTrail ? (
                  <div className="mt-1.5 space-y-1.5">
                    <select
                      value={tempTrail}
                      onChange={(e) => setTempTrail(e.target.value)}
                      className="w-full px-2 py-1.5 bg-gray-900/60 border border-ice-500/30 rounded text-xs text-ice-100 focus:outline-none focus:border-ice-400/50"
                    >
                      {trails.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          if (selectedMaker && tempTrail) {
                            updateSnowMaker(selectedMaker, { trail: tempTrail })
                          }
                          setEditingTrail(false)
                        }}
                        className="flex-1 py-1 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />保存
                      </button>
                      <button
                        onClick={() => setEditingTrail(false)}
                        className="flex-1 py-1 bg-gray-500/20 text-gray-300 rounded text-[10px] font-medium hover:bg-gray-500/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <XIcon className="w-3 h-3" />取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-ice-200 font-medium">{makerDetail.maker.trail}</span>
                    {makerDetail.trail && (
                      <span className={`px-1 py-0.5 rounded text-[10px] ${
                        makerDetail.trail.status === "open" ? "bg-emerald-500/20 text-emerald-400" :
                        makerDetail.trail.status === "grooming" ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {makerDetail.trail.status === "open" ? "开放" : makerDetail.trail.status === "grooming" ? "压雪中" : "已关闭"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {makerDetail.trail && (
                <div className="text-[10px] text-ice-300/60 flex items-center gap-1.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  雪厚 {makerDetail.trail.snowDepth}cm · 长度 {makerDetail.trail.length}m
                </div>
              )}

              {makerDetail.relatedMakers.length > 0 && (
                <div className="text-[10px] text-ice-300/60">
                  同区域造雪机：{makerDetail.relatedMakers.map((m) => (
                    <span key={m.id} className="mr-1" style={{ color: makerColor(m.status) }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              )}

              {makerDetail.relatedPlans.length > 0 && (
                <div className="space-y-1">
                  <div className="text-ice-300/40 flex items-center gap-1">
                    <SnowflakeIcon className="w-2.5 h-2.5" />关联造雪计划 ({makerDetail.relatedPlans.length})
                  </div>
                  {makerDetail.relatedPlans.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className={`px-1 py-0.5 rounded ${
                        p.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                        p.status === "planned" ? "bg-ice-500/20 text-ice-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {planStatusCfg[p.status].label}
                      </span>
                      <span className="text-ice-300/50">{p.date} {p.startTime}-{p.endTime}</span>
                      {p.status === "active" && <Play className="w-2.5 h-2.5 text-emerald-400" />}
                      {p.status === "planned" && <Pause className="w-2.5 h-2.5 text-ice-400" />}
                    </div>
                  ))}
                </div>
              )}

              {(() => {
                const suggestion = getSuggestion(makerDetail)
                if (!suggestion) return null
                return (
                  <div className={`p-2 rounded border ${
                    suggestion.level === "warning" ? "bg-red-500/10 border-red-500/30" : "bg-ice-500/10 border-ice-500/30"
                  }`}>
                    <div className={`text-[10px] font-medium mb-1 flex items-center gap-1 ${
                      suggestion.level === "warning" ? "text-red-400" : "text-ice-400"
                    }`}>
                      <Lightbulb className="w-2.5 h-2.5" />{suggestion.title}
                    </div>
                    <div className="text-[10px] text-ice-300/60 space-y-0.5">
                      {suggestion.actions.map((a, i) => a && <div key={i}>{a}</div>)}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
