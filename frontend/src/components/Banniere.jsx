import { useId } from 'react'

// Icônes dessinées pour la plateforme (24 × 24, trait). Aucune image externe.
const ICONES = {
  math: <path d="M5 7h14M9 7v11M15 7c0 6 0 10 3 11" />,
  atome: <><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.5" /></>,
  fiole: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7.5 15h9" />,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  bulle: <path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />,
  colonnes: <path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" />,
  livre: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6" />,
  fichier: <path d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h7" />,
  video: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M10 9l5 3-5 3z" /></>,
  crayon: <path d="M4 20l1-5L16 4l4 4L9 19zM14 6l4 4" />,
  lien: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
}

// Bannière de carte : dégradé aux couleurs du concours, motif géométrique et icône.
// Sans `icone`, on affiche `children` au centre (ex. logo d'un concours).
export default function Banniere({ couleur = '#C9A84C', icone, hauteur = 112, children }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="relative w-full overflow-hidden" style={{ height: hauteur }} aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#071020" />
            <stop offset="0.6" stopColor="#0d1f3c" />
            <stop offset="1" stopColor={couleur} stopOpacity="0.55" />
          </linearGradient>
          <pattern id={`p${id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#fff" fillOpacity="0.12" />
          </pattern>
        </defs>
        <rect width="400" height="140" fill={`url(#g${id})`} />
        <rect width="400" height="140" fill={`url(#p${id})`} />
        <circle cx="340" cy="30" r="70" fill={couleur} fillOpacity="0.18" />
        <circle cx="300" cy="130" r="48" fill="none" stroke={couleur} strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="40" cy="150" r="60" fill={couleur} fillOpacity="0.1" />
      </svg>
      {icone && ICONES[icone] && (
        <svg className="absolute" style={{ right: 20, top: '50%', transform: 'translateY(-50%)' }} width="64" height="64" viewBox="0 0 24 24"
          fill="none" stroke={couleur} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {ICONES[icone]}
        </svg>
      )}
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
