import { useState } from "react"
import { useStore } from "@/store/useStore"
import { Ticket, Snowflake, HardHat, Shirt, CheckCircle, QrCode, XCircle, AlertTriangle, ChevronDown } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { TicketRecord } from "@/types"

const typeLabel: Record<string, string> = { full_day: "全天票", half_day: "半天票", hour: "小时票" }
const typeIcon: Record<string, React.ReactNode> = { ski: <Snowflake className="w-4 h-4" />, snowboard: <Snowflake className="w-4 h-4" />, helmet: <HardHat className="w-4 h-4" />, suit: <Shirt className="w-4 h-4" /> }
const typeGroupLabel: Record<string, string> = { ski: "双板", snowboard: "单板", helmet: "头盔", suit: "雪服" }
const statusStyle: Record<string, string> = { valid: "bg-emerald-500/20 text-emerald-400", used: "bg-slate-500/20 text-slate-400", expired: "bg-red-500/20 text-red-400", available: "bg-emerald-500/20 text-emerald-400", rented: "bg-amber-500/20 text-amber-400", maintenance: "bg-red-500/20 text-red-400" }
const statusLabel: Record<string, string> = { valid: "有效", used: "已使用", expired: "已过期", available: "可用", rented: "已租出", maintenance: "维护中" }
const PIE_COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc"]
const GATE_OPTIONS = ["A闸机", "B闸机", "C闸机", "D闸机"]

type ScanResult =
  | { success: true; ticket: TicketRecord }
  | { success: false; error: "not_found" | "already_used" | "expired"; ticket?: TicketRecord }

export default function TicketPage() {
  const tickets = useStore((s) => s.tickets)
  const rentals = useStore((s) => s.rentals)
  const scanTicket = useStore((s) => s.scanTicket)

  const [code, setCode] = useState("")
  const [gate, setGate] = useState("A闸机")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [gateOpen, setGateOpen] = useState(false)

  const total = tickets.length
  const usedCount = tickets.filter((t) => t.status === "used").length
  const validCount = tickets.filter((t) => t.status === "valid").length

  const pieData = ["full_day", "half_day", "hour"].map((type) => ({ name: typeLabel[type], value: tickets.filter((t) => t.type === type).length }))
  const gates = [...new Set(tickets.map((t) => t.gate))]
  const barData = gates.map((g) => ({ gate: g, revenue: tickets.filter((t) => t.gate === g).length * (150 + Math.floor(Math.random() * 200)) }))
  const rentalsByType = (["ski", "snowboard", "helmet", "suit"] as const).map((type) => ({ type, label: typeGroupLabel[type], items: rentals.filter((r) => r.type === type) }))

  const handleScan = () => {
    if (!code.trim()) return
    setResult(scanTicket(code.trim(), gate))
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
            <div className="text-xs text-ice-300/60 mt-1">{typeLabel[result.ticket.type]} · {result.ticket.code} · 核销时间: {result.ticket.usedAt}</div>
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
              <div className="text-amber-400 font-medium">⚠️ 该票已于 {errorResult.ticket?.usedAt} 在 {errorResult.ticket?.usedGate} 核销过</div>
              {errorResult.ticket && <div className="text-xs text-ice-300/60 mt-1">{typeLabel[errorResult.ticket.type]} · {errorResult.ticket.code}</div>}
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
        <div className="flex items-center gap-2 mb-4"><QrCode className="w-5 h-5 text-ice-400" /><h3 className="text-sm font-medium text-ice-300/70">票务核销</h3></div>
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
            <button onClick={() => setGateOpen(!gateOpen)} className="w-full sm:w-32 px-4 py-2.5 bg-gray-900/60 border border-ice-500/20 rounded-lg text-ice-100 flex items-center justify-between gap-2 hover:border-ice-400/40 transition-colors">
              <span>{gate}</span>
              <ChevronDown className={`w-4 h-4 text-ice-300/50 transition-transform ${gateOpen ? "rotate-180" : ""}`} />
            </button>
            {gateOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900/95 border border-ice-500/20 rounded-lg overflow-hidden z-10">
                {GATE_OPTIONS.map((g) => (
                  <button key={g} onClick={() => { setGate(g); setGateOpen(false) }} className={`w-full px-4 py-2 text-left text-sm hover:bg-ice-500/10 transition-colors ${gate === g ? "text-ice-400 bg-ice-500/10" : "text-ice-100"}`}>{g}</button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleScan} className="px-6 py-2.5 bg-gradient-to-r from-ice-500 to-sky-500 text-white font-medium rounded-lg hover:from-ice-400 hover:to-sky-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-ice-500/20">
            <CheckCircle className="w-4 h-4" />核销
          </button>
        </div>
        {renderResult()}
        <div className="mt-3 text-[10px] text-ice-300/30">测试票号: SK20260045, SK20260046, SK20260047, SK20260048, SK20260049</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "总票数", value: total, accent: "border-sky-500/40", icon: <Ticket className="w-5 h-5" /> }, { label: "已使用", value: usedCount, accent: "border-slate-500/40", icon: <CheckCircle className="w-5 h-5" /> }, { label: "有效票", value: validCount, accent: "border-emerald-500/40", icon: <Ticket className="w-5 h-5" /> }].map((k) => (
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
        <h3 className="text-sm font-medium text-ice-300/70 mb-3">闸机验票记录</h3>
        <div className="max-h-[240px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-900/95">
              <tr className="text-ice-300/50 text-left"><th className="pb-2 font-medium">编号</th><th className="pb-2 font-medium">类型</th><th className="pb-2 font-medium">时间</th><th className="pb-2 font-medium">闸机</th><th className="pb-2 font-medium">状态</th></tr>
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
              <div className="flex items-center gap-1.5 text-xs text-ice-300/60 mb-2">{typeIcon[type]}<span>{label}</span></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {items.map((r) => (
                  <div key={r.id} className="rounded-lg border border-ice-500/10 bg-ice-500/5 p-2.5 flex items-center justify-between">
                    <div><div className="text-xs text-ice-100">{r.name}</div>{r.renter && <div className="text-[10px] text-ice-300/40 mt-0.5">租客: {r.renter}</div>}</div>
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
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} stroke="none">{pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}</Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8, color: "#E0F2FE" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">{pieData.map((d, i) => (<span key={d.name} className="flex items-center gap-1 text-[10px] text-ice-300/60"><span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />{d.name}</span>))}</div>
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
