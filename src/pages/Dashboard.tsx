import { useStore } from "@/store/useStore"
import { AlertTriangle, Shield, Cloud, Info, Users, Snowflake, Mountain, CableCar } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const alertIcons = {
  fault: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  safety: <Shield className="w-4 h-4 text-red-400" />,
  weather: <Cloud className="w-4 h-4 text-yellow-400" />,
  info: <Info className="w-4 h-4 text-sky-400" />,
}

const alertBg = {
  fault: "border-orange-500/30 bg-orange-500/5",
  safety: "border-red-500/30 bg-red-500/5",
  weather: "border-yellow-500/30 bg-yellow-500/5",
  info: "border-sky-500/30 bg-sky-500/5",
}

export default function Dashboard() {
  const hourlyFlow = useStore((s) => s.hourlyFlow)
  const snowMakers = useStore((s) => s.snowMakers)
  const trails = useStore((s) => s.trails)
  const lifts = useStore((s) => s.lifts)
  const alerts = useStore((s) => s.alerts)
  const resolveAlert = useStore((s) => s.resolveAlert)

  const totalVisitors = hourlyFlow.reduce((sum, h) => sum + h.count, 0)
  const runningMakers = snowMakers.filter((s) => s.status === "running").length
  const openTrails = trails.filter((t) => t.status === "open").length
  const runningLifts = lifts.filter((l) => l.status === "running").length
  const unresolved = alerts.filter((a) => !a.resolved)

  const kpis = [
    { label: "今日客流", value: totalVisitors, icon: <Users className="w-5 h-5" /> },
    { label: "运行造雪机", value: runningMakers, icon: <Snowflake className="w-5 h-5" /> },
    { label: "开放雪道", value: openTrails, icon: <Mountain className="w-5 h-5" /> },
    { label: "运行缆车", value: runningLifts, icon: <CableCar className="w-5 h-5" /> },
  ]

  const makerColor = (s: string) =>
    s === "running" ? "#34d399" : s === "fault" ? "#f87171" : "#9ca3af"

  const liftColor = (s: string) =>
    s === "running" ? "#34d399" : "#f87171"

  return (
    <div className="space-y-5 p-1">
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glow-card animate-glow-pulse flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10 text-ice-400">
              {k.icon}
            </div>
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
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }}
                labelStyle={{ color: "#7dd3fc" }}
              />
              <Area type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} fill="url(#iceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glow-card overflow-hidden">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">待处理告警</h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {unresolved.length === 0 && (
              <div className="text-ice-300/40 text-xs text-center py-8">暂无告警</div>
            )}
            {unresolved.map((a) => (
              <div key={a.id} className={`rounded-lg border p-2.5 flex items-start gap-2 ${alertBg[a.type]}`}>
                <div className="mt-0.5 shrink-0">{alertIcons[a.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ice-100 truncate">{a.title}</div>
                  <div className="text-[10px] text-ice-300/50 mt-0.5">{a.timestamp}</div>
                </div>
                <button
                  onClick={() => resolveAlert(a.id)}
                  className="shrink-0 text-[10px] px-2 py-1 rounded bg-ice-500/20 text-ice-300 hover:bg-ice-500/30 transition-colors"
                >
                  处理
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">雪场地图</h3>
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

          {snowMakers.map((sm) => (
            <g key={sm.id}>
              <circle cx={sm.position.x} cy={sm.position.y} r="1.8" fill={makerColor(sm.status)} opacity={0.85} />
              <circle cx={sm.position.x} cy={sm.position.y} r="3.5" fill={makerColor(sm.status)} opacity={0.15} />
            </g>
          ))}

          {lifts.map((l, i) => {
            const cx = 15 + i * 15
            const cy = 68
            return (
              <g key={l.id}>
                <rect x={cx - 2} y={cy - 1.2} width="4" height="2.4" rx="0.5"
                  fill={liftColor(l.status)} opacity={0.85} />
                <circle cx={cx} cy={cy} r="4" fill={liftColor(l.status)} opacity={0.12} />
                <text x={cx} y={cy + 5} textAnchor="middle" fill="#7dd3fc" fontSize="2.5" opacity={0.7}>
                  {l.name}
                </text>
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
      </div>
    </div>
  )
}
