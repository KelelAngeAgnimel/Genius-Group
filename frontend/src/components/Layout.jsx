import { Suspense } from 'react'
import Navbar from './Navbar'
import Loader from './Loader'
import AutoEvaluation from './AutoEvaluation'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <a href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-[#071020] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg">
        Aller au contenu
      </a>
      <Navbar />
      <AutoEvaluation />
      {/* Marge réduite sur mobile : les pages ont déjà leur propre espacement */}
      <main id="contenu" tabIndex={-1} className="px-1 py-2 sm:p-6 outline-none">
        <Suspense fallback={<Loader plein />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
