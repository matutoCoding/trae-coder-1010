import { Mountain, CheckCircle, XCircle, Clock } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts"
import { useStore } from "@/store/useStore"
import type { Trail } from "@/types"

const levelCfg: Record<Trail["level"], { label: string; cls: string }> = {
  beginner: { label: "初级", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  intermediate: { label: "中级", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  advanced: { label: "高级", cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  expert: { label: "专家", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
}

const statusCfg: Record<Trail["status"], { label: string; dot: string; icon: typeof CheckCircle }> = {
  open: { label: "开放", dot: "bg-green-400", icon: CheckCircle },
  closed: { label: "关闭", dot: "bg-red-400", icon: XCircle },
  grooming: { label: "压雪中", dot: "bg-yellow-400", icon: Clock },
}

function depthColor(d: number) {
  if (d >= 50) return "#22c55e"
  if (d >= 30) return "#f59e0b"
  return "#ef4444"
}

export default function Trail() {
  const trails = useStore((s) => s.trails)
  const toggleTrailStatus = useStore((s) => s.toggleTrailStatus)

  const counts = {
    open: trails.filter((t) => t.status === "open").length,
    closed: trails.filter((t) => t.status === "closed").length,
    grooming: trails.filter((t) => t.status === "grooming").length,
  }

  const chartData = trails.map((t) => ({ name: t.name, depth: t.snowDepth }))

  return (
    <div className="space-y-6 p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-cyan-300">
        <Mountain className="h-7 w-7" />
        雪道状态总览
      </h1>

      {/* ── Trail Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { key: "open" as const, label: "开放", dot: "bg-green-400" },
          { key: "closed" as const, label: "关闭", dot: "bg-red-400" },
          { key: "grooming" as const, label: "压雪中", dot: "bg-yellow-400" },
        ]).map((s) => (
          <div key={s.key} className="glow-card flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
            <span className={`h-3 w-3 rounded-full ${s.dot}`} />
            <div>
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="font-mono text-2xl font-bold text-white">{counts[s.key]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Snow Depth Chart ── */}
      <div className="glow-card rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold text-cyan-200">积雪深度</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis unit="cm" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              formatter={(v: number) => [`${v} cm`, "积雪深度"]}
              contentStyle={{ background: "#0f172a", border: "1px solid #164e63", borderRadius: 8 }}
            />
            <ReferenceLine y={40} stroke="#facc15" strokeDasharray="6 3" label={{ value: "安全线 40cm", fill: "#facc15", fontSize: 12 }} />
            <Bar dataKey="depth" radius={[4, 4, 0, 0]}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={depthColor(d.depth)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Trail Cards Grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trails.map((t) => {
          const lv = levelCfg[t.level]
          const st = statusCfg[t.status]
          const StatusIcon = st.icon
          return (
            <div key={t.id} className="glow-card flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">{t.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${lv.cls}`}>
                  {lv.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <div>
                  积雪 <span className="font-mono font-bold text-white">{t.snowDepth}</span> cm
                </div>
                <div>
                  长度 <span className="font-mono font-bold text-white">{t.length}</span> m
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm">
                  <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                  <StatusIcon className="h-4 w-4 text-slate-400" />
                  {st.label}
                </span>
                <button
                  onClick={() => toggleTrailStatus(t.id)}
                  className="rounded-lg border border-cyan-500/30 bg-cyan-900/40 px-3 py-1 text-xs text-cyan-300 transition hover:bg-cyan-700/50"
                >
                  {t.status === "open" ? "关闭雪道" : "开放雪道"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Legend ── */}
      <div className="glow-card rounded-xl border border-cyan-500/20 bg-slate-900/70 p-4 backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold text-cyan-200">图例说明</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-emerald-500" /> 初级
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-blue-500" /> 中级
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-orange-500" /> 高级
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-purple-500" /> 专家
          </div>
          <span className="mx-2 border-l border-slate-600" />
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-green-400" /> 开放
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-red-400" /> 关闭
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-3 w-3 rounded-full bg-yellow-400" /> 压雪中
          </div>
        </div>
      </div>
    </div>
  )
}
