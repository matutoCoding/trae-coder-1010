import { useState } from "react"
import { useStore } from "@/store/useStore"
import { Snowflake, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

const statusConfig: Record<string, { label: string; dot: string; badge: string; color: string }> = {
  running: { label: "运行中", dot: "status-dot-green", badge: "bg-emerald-400/15 text-emerald-400", color: "#34d399" },
  idle: { label: "待机", dot: "status-dot-gray", badge: "bg-gray-400/15 text-gray-400", color: "#9ca3af" },
  fault: { label: "故障", dot: "status-dot-red", badge: "bg-red-400/15 text-red-400", color: "#f87171" },
  maintain: { label: "维护", dot: "status-dot-yellow", badge: "bg-amber-400/15 text-amber-400", color: "#fbbf24" },
}

const planStatusConfig: Record<string, { label: string; badge: string }> = {
  planned: { label: "已计划", badge: "bg-ice-400/15 text-ice-400" },
  active: { label: "进行中", badge: "bg-emerald-400/15 text-emerald-400" },
  completed: { label: "已完成", badge: "bg-gray-400/15 text-gray-400" },
  cancelled: { label: "已取消", badge: "bg-red-400/15 text-red-400" },
}

const summaryItems = [
  { key: "running" as const, label: "运行中", icon: Snowflake },
  { key: "idle" as const, label: "待机", icon: Clock },
  { key: "fault" as const, label: "故障", icon: AlertTriangle },
  { key: "maintain" as const, label: "维护中", icon: CheckCircle },
]

export default function SnowMaker() {
  const { snowMakers, snowPlans } = useStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const countByStatus = (s: string) => snowMakers.filter((m) => m.status === s).length

  const hoveredMaker = snowMakers.find((m) => m.id === hoveredId)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {summaryItems.map(({ key, label, icon: Icon }) => (
          <div key={key} className="glow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-frost-surface flex items-center justify-center">
              <Icon className="w-5 h-5" style={{ color: statusConfig[key].color }} />
            </div>
            <div>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="font-mono text-xl font-bold" style={{ color: statusConfig[key].color }}>
                {countByStatus(key)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-frost-border flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-ice-400" />
          <span className="text-sm font-semibold text-ice-200">设备列表</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-frost-border">
                <th className="text-left px-4 py-2.5 font-medium">名称</th>
                <th className="text-left px-4 py-2.5 font-medium">型号</th>
                <th className="text-left px-4 py-2.5 font-medium">雪道</th>
                <th className="text-left px-4 py-2.5 font-medium">状态</th>
                <th className="text-right px-4 py-2.5 font-medium">运行时长</th>
                <th className="text-right px-4 py-2.5 font-medium">总产量</th>
              </tr>
            </thead>
            <tbody>
              {snowMakers.map((m) => {
                const cfg = statusConfig[m.status]
                return (
                  <tr
                    key={m.id}
                    className="border-b border-frost-border/50 hover:bg-ice-500/5 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-ice-200">{m.name}</td>
                    <td className="px-4 py-2.5 text-gray-400">{m.model}</td>
                    <td className="px-4 py-2.5 text-gray-400">{m.trail}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${cfg.badge}`}>
                        <span className={cfg.dot} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-300">
                      {m.lastRunHours > 0 ? `${m.lastRunHours}h` : "-"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-ice-300">
                      {m.totalOutput.toLocaleString()}m³
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glow-card">
        <div className="px-4 py-3 border-b border-frost-border flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-ice-400" />
          <span className="text-sm font-semibold text-ice-200">雪场造雪机分布</span>
        </div>
        <div className="p-4 relative">
          <svg viewBox="0 0 100 75" className="w-full h-64">
            <rect x="0" y="0" width="100" height="75" rx="4" fill="#0f1729" />
            <line x1="10" y1="20" x2="90" y2="20" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            <line x1="10" y1="40" x2="90" y2="40" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            <line x1="10" y1="60" x2="90" y2="60" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            {snowMakers.map((m) => (
              <circle
                key={m.id}
                cx={m.position.x}
                cy={m.position.y}
                r={hoveredId === m.id ? 3.5 : 2.5}
                fill={statusConfig[m.status].color}
                opacity={0.9}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            ))}
          </svg>
          {hoveredMaker && (
            <div className="absolute top-6 right-6 glow-card p-2.5 text-xs space-y-1 min-w-[140px] pointer-events-none">
              <div className="text-ice-200 font-semibold">{hoveredMaker.name}</div>
              <div className="text-gray-400">
                状态：<span style={{ color: statusConfig[hoveredMaker.status].color }}>{statusConfig[hoveredMaker.status].label}</span>
              </div>
              <div className="text-gray-400">雪道：{hoveredMaker.trail}</div>
            </div>
          )}
        </div>
      </div>

      <div className="glow-card">
        <div className="px-4 py-3 border-b border-frost-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-ice-400" />
          <span className="text-sm font-semibold text-ice-200">造雪计划</span>
        </div>
        <div className="p-4 space-y-3">
          {snowPlans.map((plan) => {
            const cfg = planStatusConfig[plan.status]
            const makerNames = plan.snowMakers
              .map((id) => snowMakers.find((m) => m.id === id)?.name ?? id)
              .join("、")
            return (
              <div key={plan.id} className="flex items-center gap-4 p-3 rounded-lg bg-frost-surface/50 hover:bg-frost-surface transition-colors">
                <div className="font-mono text-ice-300 text-sm font-semibold w-24">{plan.date}</div>
                <div className="font-mono text-gray-400 text-xs w-28">
                  {plan.startTime} - {plan.endTime}
                </div>
                <div className="flex-1 text-gray-400 text-xs truncate" title={makerNames}>
                  {makerNames}
                </div>
                <div className="text-gray-500 text-xs truncate max-w-[180px]" title={plan.weatherCondition}>
                  {plan.weatherCondition}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
