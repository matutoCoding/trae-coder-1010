import { useStore } from "@/store/useStore"
import { Ticket, Snowflake, HardHat, Shirt, CheckCircle } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const typeLabel: Record<string, string> = { full_day: "全天票", half_day: "半天票", hour: "小时票" }
const typeIcon: Record<string, React.ReactNode> = {
  ski: <Snowflake className="w-4 h-4" />,
  snowboard: <Snowflake className="w-4 h-4" />,
  helmet: <HardHat className="w-4 h-4" />,
  suit: <Shirt className="w-4 h-4" />,
}
const typeGroupLabel: Record<string, string> = { ski: "双板", snowboard: "单板", helmet: "头盔", suit: "雪服" }
const statusStyle: Record<string, string> = {
  valid: "bg-emerald-500/20 text-emerald-400",
  used: "bg-slate-500/20 text-slate-400",
  expired: "bg-red-500/20 text-red-400",
  available: "bg-emerald-500/20 text-emerald-400",
  rented: "bg-amber-500/20 text-amber-400",
  maintenance: "bg-red-500/20 text-red-400",
}
const statusLabel: Record<string, string> = {
  valid: "有效", used: "已使用", expired: "已过期",
  available: "可用", rented: "已租出", maintenance: "维护中",
}
const PIE_COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc"]

export default function TicketPage() {
  const tickets = useStore((s) => s.tickets)
  const rentals = useStore((s) => s.rentals)

  const total = tickets.length
  const usedCount = tickets.filter((t) => t.status === "used").length
  const validCount = tickets.filter((t) => t.status === "valid").length

  const pieData = ["full_day", "half_day", "hour"].map((type) => ({
    name: typeLabel[type],
    value: tickets.filter((t) => t.type === type).length,
  }))

  const gates = [...new Set(tickets.map((t) => t.gate))]
  const barData = gates.map((gate) => ({
    gate,
    revenue: tickets.filter((t) => t.gate === gate).length * (150 + Math.floor(Math.random() * 200)),
  }))

  const rentalsByType = (["ski", "snowboard", "helmet", "suit"] as const).map((type) => ({
    type,
    label: typeGroupLabel[type],
    items: rentals.filter((r) => r.type === type),
  }))

  return (
    <div className="space-y-5 p-1">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "总票数", value: total, accent: "border-sky-500/40", icon: <Ticket className="w-5 h-5" /> },
          { label: "已使用", value: usedCount, accent: "border-slate-500/40", icon: <CheckCircle className="w-5 h-5" /> },
          { label: "有效票", value: validCount, accent: "border-emerald-500/40", icon: <Ticket className="w-5 h-5" /> },
        ].map((k) => (
          <div key={k.label} className={`glow-card flex items-center gap-4 border-l-2 ${k.accent}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-ice-500/10 text-ice-400">
              {k.icon}
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-ice-400 glow-text">{k.value}</div>
              <div className="text-xs text-ice-300/60 tracking-wide">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">闸机验票记录</h3>
        <div className="max-h-[240px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900/95">
              <tr className="text-ice-300/50 text-left">
                <th className="pb-2 font-medium">编号</th>
                <th className="pb-2 font-medium">类型</th>
                <th className="pb-2 font-medium">时间</th>
                <th className="pb-2 font-medium">闸机</th>
                <th className="pb-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ice-500/5">
              {tickets.slice(0, 20).map((t) => (
                <tr key={t.id} className="text-ice-100">
                  <td className="py-1.5 font-mono">{t.id}</td>
                  <td>{typeLabel[t.type]}</td>
                  <td className="font-mono">{t.timestamp}</td>
                  <td>{t.gate}</td>
                  <td><span className={`px-1.5 py-0.5 rounded text-[10px] ${statusStyle[t.status]}`}>{statusLabel[t.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">租赁管理</h3>
        <div className="space-y-4">
          {rentalsByType.map(({ type, label, items }) => (
            <div key={type}>
              <div className="flex items-center gap-1.5 text-xs text-ice-300/60 mb-2">
                {typeIcon[type]}<span>{label}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {items.map((r) => (
                  <div key={r.id} className="rounded-lg border border-ice-500/10 bg-ice-500/5 p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ice-100">{r.name}</div>
                      {r.renter && <div className="text-[10px] text-ice-300/40 mt-0.5">租客: {r.renter}</div>}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">票种分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} stroke="none">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-ice-300/60">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />{d.name}
              </span>
            ))}
          </div>
        </div>

        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300/70 mb-3">闸机营收</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="gate" tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7dd3fc", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
