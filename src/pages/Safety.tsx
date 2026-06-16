import { ShieldAlert, Activity, Users, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useStore } from "@/store/useStore"

const levelConfig = {
  minor: { label: "轻微", dot: "bg-yellow-400" },
  moderate: { label: "中度", dot: "bg-orange-400" },
  severe: { label: "严重", dot: "bg-red-500" },
} as const

const statusConfig = {
  pending: { label: "待处理", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  treating: { label: "治疗中", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Activity },
  resolved: { label: "已解决", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
} as const

export default function Safety() {
  const { injuries, patrols, hourlyFlow } = useStore()

  const counts = {
    minor: injuries.filter((i) => i.level === "minor").length,
    moderate: injuries.filter((i) => i.level === "moderate").length,
    severe: injuries.filter((i) => i.level === "severe").length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ice-100">安全与救援</h1>

      {/* Injury stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["minor", "moderate", "severe"] as const).map((level) => {
          const cfg = levelConfig[level]
          return (
            <div key={level} className="glow-card flex items-center gap-3 py-4 px-5">
              <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
              <div>
                <span className="text-sm text-ice-300">{cfg.label}</span>
                <span className="ml-2 text-2xl font-mono font-bold text-ice-400 glow-text">{counts[level]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Injury report list */}
      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> 伤害报告
        </h3>
        <div className="space-y-3">
          {injuries.map((inj) => {
            const sc = statusConfig[inj.status]
            const StatusIcon = sc.icon
            return (
              <div key={inj.id} className="flex items-start gap-3 rounded-lg bg-frost-surface p-3">
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${levelConfig[inj.level].dot.replace("bg-", "text-")}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-ice-500 font-mono">{inj.timestamp}</span>
                    <span className="text-xs text-ice-300">{inj.trail}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${levelConfig[inj.level].dot.replace("bg-", "text-")} bg-current/10 border-current/20`}>
                      {levelConfig[inj.level].label}
                    </span>
                  </div>
                  <p className="text-sm text-ice-200 mt-1">{inj.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-ice-500">{inj.handler}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${sc.badge}`}>
                      <StatusIcon className="w-3 h-3" />{sc.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Patrol management */}
      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> 巡逻管理
        </h3>
        <div className="space-y-3">
          {patrols.map((p) => (
            <div key={p.id} className={`flex items-center gap-4 rounded-lg bg-frost-surface p-3 ${p.status === "active" ? "animate-pulse border border-emerald-500/20" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ice-100 font-medium">{p.patroller}</span>
                  <span className="text-xs text-ice-500">{p.route}</span>
                  {p.status === "active" && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />巡逻中
                    </span>
                  )}
                  {p.status === "completed" && <span className="text-[10px] text-ice-600">已结束</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-ice-500">
                  <span className="font-mono">{p.startTime}</span>
                  <span>→</span>
                  <span className="font-mono">{p.endTime ?? "进行中"}</span>
                  <span>·</span>
                  <span>{p.checkpoints.length} 个哨点</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visitor flow chart */}
      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> 客流监控
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={hourlyFlow}>
            <defs>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
            <XAxis dataKey="hour" tick={{ fill: "#7DD3FC", fontSize: 11 }} />
            <YAxis tick={{ fill: "#7DD3FC", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8 }} labelStyle={{ color: "#E0F2FE" }} />
            <Area type="monotone" dataKey="count" stroke="#38BDF8" strokeWidth={2} fill="url(#flowGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
