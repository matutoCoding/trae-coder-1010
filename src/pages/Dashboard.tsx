import { useState } from "react"
import { useStore } from "@/store/useStore"
import { AlertTriangle, ShieldAlert, CloudSun, Info, Users, Snowflake, Mountain, CableCar, CheckCircle, Clock, X } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const alertIcons = {
  fault: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  safety: <ShieldAlert className="w-4 h-4 text-red-400" />,
  weather: <CloudSun className="w-4 h-4 text-yellow-400" />,
  info: <Info className="w-4 h-4 text-sky-400" />,
}

const alertBg = {
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

export default function Dashboard() {
  const hourlyFlow = useStore((s) => s.hourlyFlow)
  const snowMakers = useStore((s) => s.snowMakers)
  const trails = useStore((s) => s.trails)
  const lifts = useStore((s) => s.lifts)
  const alerts = useStore((s) => s.alerts)
  const snowPlans = useStore((s) => s.snowPlans)
  const resolveAlert = useStore((s) => s.resolveAlert)

  const [tab, setTab] = useState<"unresolved" | "resolved">("unresolved")
  const [selectedMaker, setSelectedMaker] = useState<string | null>(null)
  const [resolveModal, setResolveModal] = useState<string | null>(null)
  const [handlerName, setHandlerName] = useState("")
  const [handlerNotes, setHandlerNotes] = useState("")

  const totalVisitors = hourlyFlow.reduce((sum, h) => sum + h.count, 0)
  const runningMakers = snowMakers.filter((s) => s.status === "running").length
  const openTrails = trails.filter((t) => t.status === "open").length
  const runningLifts = lifts.filter((l) => l.status === "running").length
  const unresolved = alerts.filter((a) => !a.resolved)
  const resolved = alerts.filter((a) => a.resolved)

  const kpis = [
    { label: "今日客流", value: totalVisitors, icon: <Users className="w-5 h-5" /> },
    { label: "运行造雪机", value: runningMakers, icon: <Snowflake className="w-5 h-5" /> },
    { label: "开放雪道", value: openTrails, icon: <Mountain className="w-5 h-5" /> },
    { label: "运行缆车", value: runningLifts, icon: <CableCar className="w-5 h-5" /> },
  ]

  const makerColor = (s: string) =>
    s === "running" ? "#34d399" : s === "fault" ? "#f87171" : s === "maintain" ? "#fbbf24" : "#9ca3af"

  const liftColor = (s: string) =>
    s === "running" ? "#34d399" : "#f87171"

  const selectedMakerData = selectedMaker ? snowMakers.find((m) => m.id === selectedMaker) : null
  const selectedTrail = selectedMakerData ? trails.find((t) => t.name === selectedMakerData.trail) : null
  const relatedPlans = selectedMakerData ? snowPlans.filter((p) => p.snowMakers.includes(selectedMakerData.id) && p.status !== "cancelled") : []

  const handleResolve = (id: string) => {
    resolveAlert(id, handlerName || "管理员", handlerNotes)
    setResolveModal(null)
    setHandlerName("")
    setHandlerNotes("")
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
          <div className="flex items-center gap-1 mb-3 border-b border-ice-500/20">
            <button onClick={() => setTab("unresolved")} className={`flex-1 text-xs py-2 font-medium transition-colors ${tab === "unresolved" ? "text-ice-300 border-b-2 border-ice-400" : "text-ice-300/40 hover:text-ice-300/70"}`}>
              待处理 ({unresolved.length})
            </button>
            <button onClick={() => setTab("resolved")} className={`flex-1 text-xs py-2 font-medium transition-colors ${tab === "resolved" ? "text-ice-300 border-b-2 border-ice-400" : "text-ice-300/40 hover:text-ice-300/70"}`}>
              已处理 ({resolved.length})
            </button>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {tab === "unresolved" && unresolved.length === 0 && (
              <div className="text-ice-300/40 text-xs text-center py-8">暂无待处理告警</div>
            )}
            {tab === "unresolved" && unresolved.map((a) => (
              <div key={a.id} className={`rounded-lg border p-2.5 flex items-start gap-2 ${alertBg[a.type]}`}>
                <div className="mt-0.5 shrink-0">{alertIcons[a.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-ice-100 truncate">{a.title}</div>
                  <div className="text-[10px] text-ice-300/50 mt-0.5 truncate">{a.message}</div>
                  <div className="text-[10px] text-ice-300/30 mt-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.timestamp}</div>
                </div>
                <button onClick={() => { setResolveModal(a.id); setHandlerName(""); setHandlerNotes("") }} className="shrink-0 text-[10px] px-2 py-1 rounded bg-ice-500/20 text-ice-300 hover:bg-ice-500/30 transition-colors">
                  处理
                </button>
              </div>
            ))}
            {tab === "resolved" && resolved.length === 0 && (
              <div className="text-ice-300/40 text-xs text-center py-8">暂无已处理告警</div>
            )}
            {tab === "resolved" && resolved.map((a) => (
              <div key={a.id} className="rounded-lg border border-gray-600/30 bg-gray-700/10 p-2.5 flex items-start gap-2 opacity-70">
                <div className="mt-0.5 shrink-0"><CheckCircle className="w-4 h-4 text-gray-400" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-300 truncate">{a.title}</div>
                  <div className="text-[10px] text-gray-400/70 mt-0.5 truncate">{a.message}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.resolvedAt} · {a.resolvedBy}</div>
                  {a.resolvedNotes && <div className="text-[10px] text-gray-400 mt-1 bg-gray-700/30 rounded px-1.5 py-1">备注: {a.resolvedNotes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glow-card w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ice-200">处理告警</h3>
              <button onClick={() => setResolveModal(null)} className="text-ice-300/40 hover:text-ice-300"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs text-ice-300/60 mb-1 block">处理人</label>
              <input type="text" value={handlerName} onChange={(e) => setHandlerName(e.target.value)} placeholder="输入处理人姓名" className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50" />
            </div>
            <div>
              <label className="text-xs text-ice-300/60 mb-1 block">处理备注</label>
              <textarea value={handlerNotes} onChange={(e) => setHandlerNotes(e.target.value)} placeholder="描述处理措施..." rows={3} className="w-full px-3 py-2 bg-gray-900/60 border border-ice-500/20 rounded-lg text-sm text-ice-100 placeholder:text-ice-300/30 focus:outline-none focus:border-ice-400/50 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setResolveModal(null)} className="px-4 py-2 text-xs text-ice-300/60 hover:text-ice-300 transition-colors">取消</button>
              <button onClick={() => handleResolve(resolveModal)} className="px-4 py-2 text-xs bg-ice-500 text-white rounded-lg hover:bg-ice-400 transition-colors">确认处理</button>
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
                <g key={sm.id} className="cursor-pointer" onClick={() => setSelectedMaker(isSelected ? null : sm.id)}>
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

          {selectedMakerData && (
            <div className="absolute top-4 right-4 glow-card p-3 text-xs space-y-2 min-w-[200px] max-w-[240px]">
              <div className="flex items-center justify-between">
                <span className="text-ice-200 font-semibold">{selectedMakerData.name}</span>
                <button onClick={() => setSelectedMaker(null)} className="text-ice-300/40 hover:text-ice-300"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: makerColor(selectedMakerData.status) }} />
                <span style={{ color: makerColor(selectedMakerData.status) }}>{statusCfg[selectedMakerData.status].label}</span>
                <span className="text-ice-300/40 mx-1">·</span>
                <span className="text-ice-300/60">{selectedMakerData.model}</span>
              </div>
              <div className="text-ice-300/60">
                所属雪道：<span className="text-ice-200">{selectedMakerData.trail}</span>
                {selectedTrail && (
                  <span className={`ml-1.5 px-1 py-0.5 rounded text-[10px] ${selectedTrail.status === "open" ? "bg-emerald-500/20 text-emerald-400" : selectedTrail.status === "grooming" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                    {selectedTrail.status === "open" ? "开放" : selectedTrail.status === "grooming" ? "压雪中" : "已关闭"}
                  </span>
                )}
              </div>
              {selectedTrail && selectedTrail.status === "closed" && relatedPlans.length > 0 && (
                <div className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-[10px]">
                  ⚠ 雪道已关闭，{relatedPlans.length}个关联造雪计划需关注
                </div>
              )}
              {relatedPlans.length > 0 && (
                <div className="space-y-1">
                  <div className="text-ice-300/40">关联计划：</div>
                  {relatedPlans.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className={`px-1 py-0.5 rounded ${p.status === "active" ? "bg-emerald-500/20 text-emerald-400" : p.status === "planned" ? "bg-ice-500/20 text-ice-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {p.status === "active" ? "进行中" : p.status === "planned" ? "已计划" : "已完成"}
                      </span>
                      <span className="text-ice-300/50">{p.date} {p.startTime}-{p.endTime}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
