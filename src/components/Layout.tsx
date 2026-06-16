import { NavLink, useLocation } from "react-router-dom"
import { useStore } from "@/store/useStore"
import {
  LayoutDashboard,
  Snowflake,
  CloudSun,
  Mountain,
  Truck,
  CableCar,
  Ticket,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { path: "/", label: "总览仪表盘", icon: LayoutDashboard },
  { path: "/snowmaker", label: "造雪机管理", icon: Snowflake },
  { path: "/weather", label: "气象监测", icon: CloudSun },
  { path: "/trail", label: "雪道状态", icon: Mountain },
  { path: "/grooming", label: "压雪作业", icon: Truck },
  { path: "/lift", label: "缆车运行", icon: CableCar },
  { path: "/ticket", label: "票务核销", icon: Ticket },
  { path: "/safety", label: "安全救护", icon: ShieldAlert },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setSidebarCollapsed, alerts } = useStore()
  const location = useLocation()
  const unresolvedAlerts = alerts.filter((a) => !a.resolved).length

  const currentNav = navItems.find((n) =>
    n.path === "/" ? location.pathname === "/" : location.pathname.startsWith(n.path)
  )

  return (
    <div className="flex h-screen overflow-hidden bg-frost-bg">
      <aside
        className={`flex flex-col border-r border-frost-border bg-frost-card transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-56"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-frost-border">
          <Snowflake className="w-6 h-6 text-ice-400 flex-shrink-0" />
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-ice-300 whitespace-nowrap">雪场智控中心</span>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-ice-500/20 text-ice-300 border border-ice-500/30"
                    : "text-gray-400 hover:text-ice-300 hover:bg-frost-surface"
                } ${sidebarCollapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center h-10 border-t border-frost-border text-gray-500 hover:text-ice-400 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-between h-14 px-6 border-b border-frost-border bg-frost-card/50 backdrop-blur-sm">
          <h1 className="text-base font-semibold text-ice-200">
            {currentNav?.label ?? "雪场智控中心"}
          </h1>
          <div className="flex items-center gap-4">
            {unresolvedAlerts > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-full">
                <span className="status-dot-red" />
                {unresolvedAlerts} 条告警
              </span>
            )}
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
