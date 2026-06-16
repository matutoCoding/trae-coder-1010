import { CableCar, Armchair, Waves, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useStore } from '@/store/useStore'

const typeIcon = { cable_car: CableCar, chairlift: Armchair, magic_carpet: Waves }
const statusColor = { running: 'bg-emerald-400', stopped: 'bg-red-400', maintenance: 'bg-amber-400' }
const statusLabel = { running: '运行中', stopped: '已停运', maintenance: '维护中' }
const badgeCls = {
  running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
  maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function barColor(ratio: number) {
  if (ratio > 0.8) return 'bg-red-500'
  if (ratio > 0.6) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function Lift() {
  const lifts = useStore(s => s.lifts)

  const counts = { running: 0, stopped: 0, maintenance: 0 } as Record<string, number>
  lifts.forEach(l => counts[l.status]++)

  const chartData = lifts.map(l => ({ name: l.name, 载荷: l.currentLoad, 容量: l.capacity }))
  const faults = lifts.filter(l => l.status !== 'running')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">索道 &amp; 缆车运维</h1>

      {/* 状态概览 */}
      <div className="grid grid-cols-3 gap-4">
        {(['running', 'stopped', 'maintenance'] as const).map(s => (
          <div key={s} className="glow-card flex items-center gap-3 rounded-xl p-4">
            <span className={`h-3 w-3 rounded-full ${statusColor[s]}`} />
            <div>
              <p className="text-xs text-slate-400">{statusLabel[s]}</p>
              <p className="font-mono text-2xl text-white">{counts[s]}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 缆车详情卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lifts.map(l => {
          const Icon = typeIcon[l.type]
          const ratio = l.currentLoad / l.capacity
          return (
            <div key={l.id} className="glow-card flex flex-col gap-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-cyan-400" />
                  <span className="font-semibold text-white">{l.name}</span>
                </div>
                <span className={`rounded border px-2 py-0.5 text-xs ${badgeCls[l.status]}`}>
                  {statusLabel[l.status]}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>容量</span>
                  <span className="font-mono">{l.currentLoad}/{l.capacity}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className={`h-full transition-all ${barColor(ratio)}`} style={{ width: `${ratio * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-slate-400">
                  方向 {l.direction === 'up' ? <ArrowUp className="h-4 w-4 text-cyan-400" /> : <ArrowDown className="h-4 w-4 text-cyan-400" />}
                </span>
                <span className="font-mono text-slate-300">{l.speed} m/s</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 容量利用率图表 */}
      <div className="glow-card rounded-xl p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">容量利用率</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Bar dataKey="容量" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            <Bar dataKey="载荷" fill="#0e7490" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 故障告警 */}
      {faults.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <AlertTriangle className="h-5 w-5 text-amber-400" /> 故障告警
          </h2>
          {faults.map(l => (
            <div
              key={l.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                l.status === 'stopped'
                  ? 'border-red-500/40 bg-red-500/10 text-red-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{l.name}</span>
              <span className="ml-auto text-xs">{statusLabel[l.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
