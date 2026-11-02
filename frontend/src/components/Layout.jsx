import Navbar from './Navbar'
import AutoEvaluation from './AutoEvaluation'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <AutoEvaluation />
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}