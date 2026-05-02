import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'

function CircleProgress({ pct, color, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (pct / 100) * circ), 200)
    return () => clearTimeout(t)
  }, [pct, circ])

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

function CountUp({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 50
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start * 10) / 10)
    }, 30)
    return () => clearInterval(t)
  }, [target])
  return <>{val}{suffix}</>
}

export default function Statistiques() {
  const { user } = useAuth()

  const semaines = [
    {
      num: 1,
      label: 'Semaine 1',
      titre: 'Maîtrise des Aptitudes Cognitives',
      desc: 'Préparation ciblée sur la logique, l\'organisation et la rapidité d\'attention.',
      couleur: '#C9A84C',
      icon: '🧠',
    },
    {
      num: 2,
      label: 'Semaine 2',
      titre: '3 Sessions Blanches Intensives',
      desc: 'Examens de simulation hebdomadaires pour mesurer la progression en conditions réelles.',
      couleur: '#4C7BC9',
      icon: '📋',
    },
    {
      num: 3,
      label: 'Semaine 3',
      titre: 'Score Moyen Global : 72%',
      desc: 'Niveau de maîtrise atteint sur l\'ensemble des tests de logique et d\'organisation.',
      couleur: '#4CC9A8',
      icon: '📈',
    },
  ]

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* En-tête */}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Bilan de Performance
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          3 Semaines de Préparation
        </h1>
        <p className="text-gray-400 text-sm mt-1">Méthode Genius — {user?.prenom} {user?.nom}</p>
      </div>

      {/* RÉSULTATS D'ADMISSIBILITÉ */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.4), transparent)' }} />
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            Résultats d'admissibilité
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ESATIC */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(76,123,201,0.3)' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, rgba(76,123,201,0.2), #4C7BC9, #6b9de0, #4C7BC9, rgba(76,123,201,0.2))' }} />
            <div className="p-6 flex flex-col items-center text-center">
              <p className="font-bold text-white text-lg mb-4">ESATIC</p>
              <div className="relative" style={{ width: 140, height: 140 }}>
                <CircleProgress pct={100} color="#4C7BC9" size={140} stroke={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold" style={{ color: '#4C7BC9' }}>
                    <CountUp target={100} suffix="%" />
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-xs">
                Un plein succès garantissant l'accès à l'École Supérieure Africaine des TIC.
              </p>
            </div>
          </div>

          {/* INP-HB */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, rgba(201,168,76,0.2), #C9A84C, #e8c76a, #C9A84C, rgba(201,168,76,0.2))' }} />
            <div className="p-6 flex flex-col items-center text-center">
              <p className="font-bold text-white text-lg mb-4">INP-HB</p>
              <div className="relative" style={{ width: 140, height: 140 }}>
                <CircleProgress pct={83.33} color="#C9A84C" size={140} stroke={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold" style={{ color: '#C9A84C' }}>
                    <CountUp target={83.33} suffix="%" />
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-xs">
                Une performance majeure pour l'intégration des grandes écoles d'ingénieurs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE 3 SEMAINES */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.4), transparent)' }} />
          <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
            Indicateurs de progression
          </span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4))' }} />
        </div>

        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-6 top-6 bottom-6 w-px" style={{ background: 'linear-gradient(180deg, #C9A84C, #4C7BC9, #4CC9A8)' }} />

          <div className="flex flex-col gap-4">
            {semaines.map((s, i) => (
              <div key={i} className="flex gap-4 items-start">
                {/* Point timeline */}
                <div className="flex-shrink-0 w-12 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full border-2 z-10"
                    style={{ background: '#071020', borderColor: s.couleur, boxShadow: `0 0 8px ${s.couleur}66` }} />
                </div>

                {/* Carte */}
                <div className="flex-1 rounded-2xl p-5 mb-2"
                  style={{ background: 'linear-gradient(145deg, #071020, #0d1f3c)', border: `1px solid ${s.couleur}30` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase" style={{ color: s.couleur }}>{s.label}</p>
                      <p className="text-sm font-bold text-white">{s.titre}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-400">
          Connecté en tant que <span className="font-semibold" style={{ color: '#C9A84C' }}>{user?.prenom} {user?.nom}</span>
          {user?.matricule && <> — {user.matricule}</>}
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}