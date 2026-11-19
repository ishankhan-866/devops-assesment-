import { useEffect, useState } from 'react'
import axios from 'axios'
import { Server, Cloud, RefreshCw, CheckCircle } from 'lucide-react'
import './App.css'

interface ApiResponse {
  message: string
  application: string
  backend: string
  status: string
  timestamp: string
}

function App() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await axios.get<ApiResponse>('/api/hello/')
      setData(response.data)
    } catch {
      setError('Unable to connect to Django backend.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <main className="container">
      <nav className="navbar">
        <div className="brand">
          <Cloud size={25} />
          <span>DevOps Assessment</span>
        </div>
        <span className="tag">Full Stack Application</span>
      </nav>

      <section className="hero">
        <div className="icon-box">
          <Server size={38} />
        </div>

        <p className="eyebrow">DJANGO + REACT + VITE</p>

        <h1>Hello World!</h1>

        <p className="description">
          Your full-stack application is running successfully.
        </p>

        <div className="status-card">
          <div className="status-heading">
            <span>Backend Connection</span>
            <span className="status-dot" />
          </div>

          {loading ? (
            <p>Connecting to backend...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <>
              <h2>
                <CheckCircle size={20} />
                {data?.status}
              </h2>
              <p>{data?.message}</p>
              <small>
                Backend: {data?.backend}
              </small>
            </>
          )}
        </div>

        <button onClick={fetchData} disabled={loading}>
          <RefreshCw size={17} />
          Refresh API
        </button>
      </section>

      <footer>
        Built with Django, React, TypeScript and Vite
      </footer>
    </main>
  )
}

export default App

   
            







