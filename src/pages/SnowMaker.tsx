import { useState, useRef } from "react"
import { useStore } from "@/store/useStore"
import { Snowflake, Clock, AlertTriangle, CheckCircle, Plus, Edit2, MapPin, Calendar, Play, Check, X, ChevronDown } from "lucide-react"
import type { SnowMaker, SnowPlan } from "@/types"

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

const emptyMaker: Omit<SnowMaker, "id"> = { name: "", model: "", trail: "", status: "idle", position: { x: 50, y: 37 }, lastRunHours: 0, totalOutput: 0 }
const emptyPlan: Omit<SnowPlan, "id"> = { date: new Date().toISOString().split("T")[0], snowMakers: [], startTime: "08:00", endTime: "16:00", status: "planned", weatherCondition: "" }

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status]
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${cfg.badge}`}><span className={cfg.dot} />{cfg.label}</span>
}

const StatusSelect = ({ value, onChange }: { value: string; onChange: (v: SnowMaker["status"]) => void }) => (
  <select value={value} onChange={(e) => onChange(e.target.value as SnowMaker["status"])} className="input-glass text-sm">
    <option value="running">运行中</option><option value="idle">待机</option><option value="fault">故障</option><option value="maintain">维护</option>
  </select>
)

export default function SnowMaker() {
  const { snowMakers, snowPlans, addSnowMaker, updateSnowMaker, updateSnowMakerPosition, addSnowPlan, updateSnowPlanStatus } = useStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newMaker, setNewMaker] = useState(emptyMaker)
  const [newPlan, setNewPlan] = useState(emptyPlan)
  const [editData, setEditData] = useState<Partial<SnowMaker>>({})
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const countByStatus = (s: string) => snowMakers.filter((m) => m.status === s).length
  const selectedMaker = snowMakers.find((m) => m.id === selectedId)

  const handleAddMaker = () => {
    if (newMaker.name && newMaker.model) { addSnowMaker(newMaker); setNewMaker(emptyMaker); setShowAddForm(false) }
  }

  const handleAddPlan = () => {
    if (newPlan.date && newPlan.snowMakers.length > 0) { addSnowPlan(newPlan); setNewPlan(emptyPlan); setShowPlanForm(false) }
  }

  const handleEditClick = (m: SnowMaker) => {
    setEditingId(m.id)
    setEditData({ name: m.name, model: m.model, trail: m.trail, status: m.status })
  }

  const getSvgCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return null
    const rect = svgRef.current.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 75 }
  }

  const handleSvgClick = (e: React.MouseEvent) => {
    const coords = getSvgCoords(e)
    if (coords && selectedId) updateSnowMakerPosition(selectedId, Math.max(0, Math.min(100, coords.x)), Math.max(0, Math.min(75, coords.y)))
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return
    const coords = getSvgCoords(e)
    if (coords) updateSnowMakerPosition(selectedId, Math.max(0, Math.min(100, coords.x)), Math.max(0, Math.min(75, coords.y)))
  }

  const togglePlanMaker = (id: string) => {
    setNewPlan((prev) => ({ ...prev, snowMakers: prev.snowMakers.includes(id) ? prev.snowMakers.filter((m) => m !== id) : [...prev.snowMakers, id] }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {summaryItems.map(({ key, label, icon: Icon }) => (
          <div key={key} className="glow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-frost-surface flex items-center justify-center"><Icon className="w-5 h-5" style={{ color: statusConfig[key].color }} /></div>
            <div>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="font-mono text-xl font-bold" style={{ color: statusConfig[key].color }}>{countByStatus(key)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-card">
        <div className="px-4 py-3 border-b border-frost-border flex items-center justify-between cursor-pointer" onClick={() => setShowAddForm(!showAddForm)}>
          <div className="flex items-center gap-2"><Plus className="w-4 h-4 text-ice-400" /><span className="text-sm font-semibold text-ice-200">添加造雪机</span></div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAddForm ? "rotate-180" : ""}`} />
        </div>
        {showAddForm && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="text" placeholder="名称" value={newMaker.name} onChange={(e) => setNewMaker({ ...newMaker, name: e.target.value })} className="input-glass text-sm" />
            <input type="text" placeholder="型号" value={newMaker.model} onChange={(e) => setNewMaker({ ...newMaker, model: e.target.value })} className="input-glass text-sm" />
            <input type="text" placeholder="雪道" value={newMaker.trail} onChange={(e) => setNewMaker({ ...newMaker, trail: e.target.value })} className="input-glass text-sm" />
            <StatusSelect value={newMaker.status} onChange={(v) => setNewMaker({ ...newMaker, status: v })} />
            <div className="col-span-2">
              <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> X: {newMaker.position.x}</label>
              <input type="range" min="0" max="100" value={newMaker.position.x} onChange={(e) => setNewMaker({ ...newMaker, position: { ...newMaker.position, x: Number(e.target.value) } })} className="w-full" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Y: {newMaker.position.y}</label>
              <input type="range" min="0" max="75" value={newMaker.position.y} onChange={(e) => setNewMaker({ ...newMaker, position: { ...newMaker.position, y: Number(e.target.value) } })} className="w-full" />
            </div>
            <div className="col-span-full flex justify-end"><button onClick={handleAddMaker} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 添加</button></div>
          </div>
        )}
      </div>

      <div className="glow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-frost-border flex items-center gap-2"><Snowflake className="w-4 h-4 text-ice-400" /><span className="text-sm font-semibold text-ice-200">设备列表</span></div>
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
                <th className="text-center px-4 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {snowMakers.map((m) => {
                const isEditing = editingId === m.id
                return (
                  <tr key={m.id} className="border-b border-frost-border/50 hover:bg-ice-500/5 transition-colors">
                    <td className="px-4 py-2.5 text-ice-200">{isEditing ? <input className="input-glass text-sm w-24" value={editData.name ?? ""} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /> : m.name}</td>
                    <td className="px-4 py-2.5 text-gray-400">{isEditing ? <input className="input-glass text-sm w-24" value={editData.model ?? ""} onChange={(e) => setEditData({ ...editData, model: e.target.value })} /> : m.model}</td>
                    <td className="px-4 py-2.5 text-gray-400">{isEditing ? <input className="input-glass text-sm w-24" value={editData.trail ?? ""} onChange={(e) => setEditData({ ...editData, trail: e.target.value })} /> : m.trail}</td>
                    <td className="px-4 py-2.5">{isEditing ? <StatusSelect value={editData.status ?? m.status} onChange={(v) => setEditData({ ...editData, status: v })} /> : <StatusBadge status={m.status} />}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-300">{m.lastRunHours > 0 ? `${m.lastRunHours}h` : "-"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-ice-300">{m.totalOutput.toLocaleString()}m³</td>
                    <td className="px-4 py-2.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { updateSnowMaker(m.id, editData); setEditingId(null) }} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEditClick(m)} className="p-1 text-ice-400 hover:bg-ice-400/10 rounded" title="编辑"><Edit2 className="w-4 h-4" /></button>
                          <select value={m.status} onChange={(e) => updateSnowMaker(m.id, { status: e.target.value as SnowMaker["status"] })} className="bg-frost-surface border border-frost-border rounded text-xs px-1.5 py-0.5 text-gray-300">
                            <option value="running">运行</option><option value="idle">待机</option><option value="fault">故障</option><option value="maintain">维护</option>
                          </select>
                        </div>
                      )}
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
          <MapPin className="w-4 h-4 text-ice-400" /><span className="text-sm font-semibold text-ice-200">雪场造雪机分布</span>
          {selectedId && <span className="text-xs text-gray-400">（已选中: {selectedMaker?.name}）</span>}
        </div>
        <div className="p-4 relative">
          <svg ref={svgRef} viewBox="0 0 100 75" className="w-full h-64 cursor-crosshair" onClick={handleSvgClick} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
            <rect x="0" y="0" width="100" height="75" rx="4" fill="#0f1729" />
            <line x1="10" y1="20" x2="90" y2="20" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            <line x1="10" y1="40" x2="90" y2="40" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            <line x1="10" y1="60" x2="90" y2="60" stroke="#1E3A5F" strokeWidth="0.3" strokeDasharray="2,2" />
            {snowMakers.map((m) => (
              <circle key={m.id} cx={m.position.x} cy={m.position.y} r={selectedId === m.id ? 4 : 2.5} fill={statusConfig[m.status].color} opacity={0.9}
                className={`cursor-pointer transition-all duration-200 ${selectedId === m.id ? "stroke-white" : ""}`}
                onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === m.id ? null : m.id) }}
                onMouseDown={(e) => { if (selectedId === m.id) { e.stopPropagation(); setIsDragging(true) } }}
              />
            ))}
          </svg>
          {selectedMaker && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> X: {selectedMaker.position.x.toFixed(1)}</label>
                <input type="range" min="0" max="100" value={selectedMaker.position.x} onChange={(e) => updateSnowMakerPosition(selectedId!, Number(e.target.value), selectedMaker.position.y)} className="w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> Y: {selectedMaker.position.y.toFixed(1)}</label>
                <input type="range" min="0" max="75" value={selectedMaker.position.y} onChange={(e) => updateSnowMakerPosition(selectedId!, selectedMaker.position.x, Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glow-card">
        <div className="px-4 py-3 border-b border-frost-border flex items-center justify-between">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-ice-400" /><span className="text-sm font-semibold text-ice-200">造雪计划</span></div>
          <button onClick={() => setShowPlanForm(!showPlanForm)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 新建计划</button>
        </div>
        {showPlanForm && (
          <div className="p-4 border-b border-frost-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="text-xs text-gray-400 mb-1 block">日期</label><input type="date" value={newPlan.date} onChange={(e) => setNewPlan({ ...newPlan, date: e.target.value })} className="input-glass text-sm w-full" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">开始</label><input type="time" value={newPlan.startTime} onChange={(e) => setNewPlan({ ...newPlan, startTime: e.target.value })} className="input-glass text-sm w-full" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">结束</label><input type="time" value={newPlan.endTime} onChange={(e) => setNewPlan({ ...newPlan, endTime: e.target.value })} className="input-glass text-sm w-full" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">天气</label><input type="text" placeholder="晴 -5°C" value={newPlan.weatherCondition} onChange={(e) => setNewPlan({ ...newPlan, weatherCondition: e.target.value })} className="input-glass text-sm w-full" /></div>
            <div className="col-span-full">
              <label className="text-xs text-gray-400 mb-1 block">选择造雪机</label>
              <div className="flex flex-wrap gap-2">
                {snowMakers.map((m) => (
                  <label key={m.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-frost-surface text-xs text-gray-300 cursor-pointer hover:bg-ice-500/10 transition-colors">
                    <input type="checkbox" checked={newPlan.snowMakers.includes(m.id)} onChange={() => togglePlanMaker(m.id)} className="mr-1" />{m.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-full flex justify-end gap-2">
              <button onClick={() => setShowPlanForm(false)} className="btn-ghost text-sm">取消</button>
              <button onClick={handleAddPlan} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> 创建计划</button>
            </div>
          </div>
        )}
        <div className="p-4 space-y-3">
          {snowPlans.map((plan) => {
            const cfg = planStatusConfig[plan.status]
            const makerNames = plan.snowMakers.map((id) => snowMakers.find((m) => m.id === id)?.name ?? id).join("、")
            return (
              <div key={plan.id} className="flex items-center gap-4 p-3 rounded-lg bg-frost-surface/50 hover:bg-frost-surface transition-colors">
                <div className="font-mono text-ice-300 text-sm font-semibold w-24">{plan.date}</div>
                <div className="font-mono text-gray-400 text-xs w-28">{plan.startTime} - {plan.endTime}</div>
                <div className="flex-1 text-gray-400 text-xs truncate" title={makerNames}>{makerNames}</div>
                <div className="text-gray-500 text-xs truncate max-w-[180px]" title={plan.weatherCondition}>{plan.weatherCondition}</div>
                <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${cfg.badge}`}>{cfg.label}</span>
                <div className="flex items-center gap-1">
                  {plan.status === "planned" && <button onClick={() => updateSnowPlanStatus(plan.id, "active")} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded" title="启动计划"><Play className="w-4 h-4" /></button>}
                  {plan.status === "active" && <button onClick={() => updateSnowPlanStatus(plan.id, "completed")} className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded" title="完成计划"><Check className="w-4 h-4" /></button>}
                  {(plan.status === "planned" || plan.status === "active") && <button onClick={() => updateSnowPlanStatus(plan.id, "cancelled")} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded" title="取消计划"><X className="w-4 h-4" /></button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
