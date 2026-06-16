import { Thermometer, Droplets, Wind, CloudSnow, Snowflake, Sun, Cloud, CloudFog } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts"
import { useStore } from "@/store/useStore"

const weatherCards = [
  { key: "temperature" as const, label: "温度", unit: "°C", icon: Thermometer, color: "text-ice-400" },
  { key: "humidity" as const, label: "湿度", unit: "%", icon: Droplets, color: "text-cyan-400" },
  { key: "windSpeed" as const, label: "风速", unit: "m/s", icon: Wind, color: "text-sky-400" },
  { key: "snowfall" as const, label: "降雪", unit: "cm", icon: CloudSnow, color: "text-blue-300" },
]

const forecast = [
  { day: "周一", high: -3, low: -9, Icon: CloudSnow },
  { day: "周二", high: -5, low: -11, Icon: Snowflake },
  { day: "周三", high: -2, low: -8, Icon: Cloud },
  { day: "周四", high: -1, low: -7, Icon: CloudFog },
  { day: "周五", high: -4, low: -10, Icon: CloudSnow },
  { day: "周六", high: -6, low: -12, Icon: Snowflake },
  { day: "周日", high: -3, low: -9, Icon: Sun },
]

export default function Weather() {
  const { currentWeather, weatherHistory } = useStore()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ice-100">气象监测</h1>

      {/* Real-time weather cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {weatherCards.map(({ key, label, unit, icon: Icon, color }) => (
          <div key={key} className="glow-card flex flex-col items-center gap-2 py-6">
            <Icon className={`w-7 h-7 ${color}`} />
            <span className="text-sm text-ice-300">{label}</span>
            <span className="text-4xl font-mono font-bold text-ice-400 glow-text">
              {currentWeather[key]}
            </span>
            <span className="text-xs text-ice-500">{unit}</span>
          </div>
        ))}
      </div>

      {/* Snow-making condition gauge */}
      <div className="glow-card flex flex-col items-center gap-4 py-8">
        <div
          className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl animate-glow-pulse ${
            currentWeather.canMakeSnow
              ? "bg-emerald-500/20 border-2 border-emerald-400"
              : "bg-red-500/20 border-2 border-red-400"
          }`}
          style={{
            boxShadow: currentWeather.canMakeSnow
              ? "0 0 30px rgba(52,211,153,0.4)"
              : "0 0 30px rgba(248,113,113,0.4)",
          }}
        >
          {currentWeather.canMakeSnow ? "✓" : "✗"}
        </div>
        <span
          className={`text-xl font-bold ${
            currentWeather.canMakeSnow ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {currentWeather.canMakeSnow ? "适宜造雪" : "不宜造雪"}
        </span>
        <span className="text-sm text-ice-500">造雪条件：温度 &lt; -2°C 且 湿度 &gt; 60%</span>
      </div>

      {/* 24-hour trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300 mb-3">24小时温度趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weatherHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis dataKey="timestamp" tick={{ fill: "#7DD3FC", fontSize: 11 }} interval={3} />
              <YAxis tick={{ fill: "#7DD3FC", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8 }}
                labelStyle={{ color: "#E0F2FE" }}
              />
              <ReferenceLine y={-2} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "-2°C", fill: "#F59E0B", fontSize: 11 }} />
              <Line type="monotone" dataKey="temperature" stroke="#38BDF8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glow-card">
          <h3 className="text-sm font-medium text-ice-300 mb-3">24小时湿度趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weatherHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis dataKey="timestamp" tick={{ fill: "#7DD3FC", fontSize: 11 }} interval={3} />
              <YAxis tick={{ fill: "#7DD3FC", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1E3A5F", borderRadius: 8 }}
                labelStyle={{ color: "#E0F2FE" }}
              />
              <ReferenceLine y={60} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "60%", fill: "#F59E0B", fontSize: 11 }} />
              <Line type="monotone" dataKey="humidity" stroke="#22D3EE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day forecast */}
      <div className="glow-card">
        <h3 className="text-sm font-medium text-ice-300 mb-4">7日天气预报</h3>
        <div className="grid grid-cols-7 gap-2">
          {forecast.map(({ day, high, low, Icon }) => (
            <div key={day} className="flex flex-col items-center gap-2 py-3 rounded-lg bg-frost-surface">
              <span className="text-xs text-ice-400">{day}</span>
              <Icon className="w-5 h-5 text-ice-300" />
              <span className="text-sm font-mono text-ice-400 glow-text">{high}°</span>
              <span className="text-xs font-mono text-ice-600">{low}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
