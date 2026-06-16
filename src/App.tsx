import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import SnowMaker from "@/pages/SnowMaker"
import Weather from "@/pages/Weather"
import Trail from "@/pages/Trail"
import Grooming from "@/pages/Grooming"
import Lift from "@/pages/Lift"
import Ticket from "@/pages/Ticket"
import Safety from "@/pages/Safety"

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/snowmaker" element={<SnowMaker />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/trail" element={<Trail />} />
          <Route path="/grooming" element={<Grooming />} />
          <Route path="/lift" element={<Lift />} />
          <Route path="/ticket" element={<Ticket />} />
          <Route path="/safety" element={<Safety />} />
        </Routes>
      </Layout>
    </Router>
  )
}
