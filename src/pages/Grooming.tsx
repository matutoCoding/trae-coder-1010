import { Truck, CheckCircle, Clock, Calendar } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { useStore } from "@/store/useStore"
import type { GroomingRecord } from "@/types"

const statusCfg: Record<GroomingRecord["status"], { label: string; dot: string; badge: string }> = {
  completed: { label: "已完成", dot: "bg-green-400", badge: "bg-green-500/20 text-green-400 border-green-500/30" },
  in_progress: { label: "进行中", dot: "bg-amber-400", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  planned: { label: "计划中", dot: "bg-blue-400", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
}

const statusIcons: Record<GroomingRecord["status"], typeof CheckCircle> = {
  completed: CheckCircle,
  in_progress: Clock,
  planned: Calendar,
}

const trailPaths = [
  { name: "雪花初学者道", d: "M60 200 Q120 120 180 140 Q240 160 300 90", color: "#22c55e" },
  { name: "白桦中级道", d: "M80 260 Q160 180 220 210 Q300 240 360 150", color: "#22c55e" },
  { name: "银峰速降道", d: "M100 320 Q180 230 260 270 Q340 300 400 200", color: "#f59e0b" },
  { name: "雪鹰高级道", d: "M120 370 Q200 290 280 330 Q360 360 420 260", color: "#3b82f6" },
]

export default function Grooming() {
  const records = useStore((s) => s.groomingRecords)

  const counts = {
    completed: records.filter((r) => r.status === "completed").length,
    in_progress: records.filter((r) => r.status === "in_progress").length,
    planned: records.filter((r) => r.status === "planned").length,
  }

  const summaryCards: { key: GroomingRecord["status"]; icon: typeof Truck }[] = [
    { key: "completed", icon: CheckCircle },
    { key: "in_progress", icon: Clock },
    { key: "planned", icon: Calendar },
  ]

  const chartData = (() => {
    const map: Record<string, Record<string, number>> = {}
    const dates = [...new Set(records.map((r) => r.date))].sort()
    records.forEach((r) => {
      if (!map[r.operator]) map[r.operator] = {}
      map[r.operator][r.date] = (map[r.operator][r.date] || 0) + r.duration
    })
    return Object.entries(map).map(([op, byDate]) => ({
      operator: op,
      ...Object.fromEntries(dates.map((d) => [d, byDate[d] ?? 0])),
    }))
  })()

  const dates = [...new Set(records.map((r) => r.date))].sort()
  const barColors = ["#0ea5e9", "#06b6d4", "#38bdf8", "#7dd3fc"]

  return (
    <div className="space-y-6 p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-cyan-300">
        <Truck className="h-7 w-7" />
        压雪作业管理
      </h1>

      {/* ── Status Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map(({ key, icon: Icon }) => (
          <div key={key} className="glow-card flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
            <span className={`h-3 w-3 rounded-full ${statusCfg[key].dot}`} />
            <Icon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-400">{statusCfg[key].label}</p>
              <p className="font-mono text-2xl font-bold text-white">{counts[key]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grooming Records Table ── */}
      <div className="glow-card overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-900/70 backdrop-blur">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-500/10 text-left text-slate-400">
              <th className="px-4 py-3 font-medium">日期</th>
              <th className="px-4 py-3 font-medium">雪道</th>
              <th className="px-4 py-3 font-medium">操作员</th>
              <th className="px-4 py-3 font-medium">时长(h)</th>
              <th className="px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const cfg = statusCfg[r.status]
              return (
                <tr key={r.id} className="border-b border-slate-800/60 text-slate-200 transition hover:bg-cyan-950/30">
                  <td className="px-4 py-2.5 font-mono">{r.date}</td>
                  <td className="px-4 py-2.5">{r.trail}</td>
                  <td className="px-4 py-2.5">{r.operator}</td>
                  <td className="px-4 py-2.5 font-mono">{r.duration}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${cfg.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Trail Map SVG ── */}
        <div className="glow-card rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold text-cyan-200">压雪轨迹图</h2>
          <svg viewBox="0 0 480 420" className="w-full">
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B1120" />
                <stop offset="100%" stopColor="#0f2030" />
              </linearGradient>
            </defs>
            <rect width="480" height="420" rx="12" fill="url(#bg)" />
            <text x="240" y="35" textAnchor="middle" fill="#94a3b8" fontSize="13">雪道压雪状态总览</text>
            <circle cx="60" cy="200" r="6" fill="#0ea5e9" opacity={0.6} />
            <text x="60" y="220" textAnchor="middle" fill="#64748b" fontSize="10">山顶</text>
            {trailPaths.map((tp) => (
              <g key={tp.name}>
                <path d={tp.d} fill="none" stroke={tp.color} strokeWidth="3.5" strokeLinecap="round" opacity={0.85} />
                <circle r="3.5" fill={tp.color}>
                  <animateMotion dur={`${2 + Math.random()}s`} repeatCount="indefinite" path={tp.d} />
                </circle>
                <text x={440} y={parseInt(tp.d.split(" ").pop()!)} fill="#94a3b8" fontSize="10">{tp.name}</text>
              </g>
            ))}
            <g className="flex gap-4" transform="translate(30, 390)">
              <circle r="4" cx="0" cy="0" fill="#22c55e" /><text x="8" fill="#94a3b8" fontSize="10">已完成</text>
              <circle r="4" cx="80" cy="0" fill="#f59e0b" /><text x="88" fill="#94a3b8" fontSize="10">进行中</text>
              <circle r="4" cx="160" cy="0" fill="#3b82f6" /><text x="168" fill="#94a3b8" fontSize="10">计划中</text>
            </g>
          </svg>
        </div>

        {/* ── Duration Chart ── */}
        <div className="glow-card rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold text-cyan-200">操作员工时统计</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="operator" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis unit="h" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [`${v}h`, ""]}
                contentStyle={{ background: "#0f172a", border: "1px solid #164e63", borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              {dates.map((d, i) => (
                <Bar key={d} dataKey={d} fill={barColors[i % barColors.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
