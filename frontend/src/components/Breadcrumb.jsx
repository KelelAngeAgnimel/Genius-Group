import { useNavigate, useLocation } from 'react-router-dom'

// Correspondance chemin → label lisible
const LABELS = {
  '/accueil': 'Accueil',
  '/accueil/tableau-de-bord': 'Mon Espace',
  '/accueil/actualites': 'Actualités & Concours',
  '/accueil/guide': 'Guide de Préparation',
  '/accueil/statistiques': 'Mes Statistiques',
  '/planning': 'Mon Planning',
  '/planning/emploi-du-temps': 'Emploi du Temps',
  '/planning/suivi-progression': 'Suivi de Progression',
  '/planning/planning-perso': 'Agenda Personnel',
  '/ressources': 'Bibliothèque',
  '/outils': 'Espace Pratique',
  '/outils/teams': 'Cours à Distance',
  '/outils/notes': 'Mes Notes',
  '/outils/genius-eval': 'Évaluations & Quiz',
  '/aides': 'Accompagnement',
  '/aides/faq-generale': 'Questions Fréquentes',
  '/aides/contacts': 'Nous Contacter',
  '/aides/orientation': 'Guide d\'Orientation',
  '/aides/preparation-mentale': 'Préparation Mentale',
  '/aides/chatbot': 'Assistant IA',
  '/professeur': 'Espace Enseignant',
  '/admin': 'Administration',
  '/admin/utilisateurs': 'Gestion des Comptes',
  '/admin/creer': 'Créer un Compte',
  '/admin/planning': 'Gestion du Planning',
}

// Construire le fil d'Ariane depuis le chemin courant
function buildBreadcrumbs(pathname) {
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Accueil', path: '/accueil' }]

  let currentPath = ''
  for (const part of parts) {
    currentPath += '/' + part
    if (currentPath === '/accueil') continue // déjà ajouté
    const label = LABELS[currentPath]
    if (label) crumbs.push({ label, path: currentPath })
  }
  return crumbs
}

export default function Breadcrumb({ retourLabel, retourPath, suivantLabel, suivantPath }) {
  const navigate = useNavigate()
  const location = useLocation()
  const crumbs = buildBreadcrumbs(location.pathname)

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

      {/* Fil d'Ariane + bouton retour */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Bouton retour navigateur ou retour personnalisé */}
        <button
          onClick={() => retourPath ? navigate(retourPath) : navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
          ← {retourLabel || 'Retour'}
        </button>

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600">/</span>}
              {i < crumbs.length - 1 ? (
                <button onClick={() => navigate(crumb.path)}
                  className="hover:text-white transition"
                  style={{ color: '#9ca3af' }}>
                  {crumb.label}
                </button>
              ) : (
                <span style={{ color: '#C9A84C', fontWeight: 600 }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Bouton suivant (optionnel) */}
      {suivantLabel && suivantPath && (
        <button
          onClick={() => navigate(suivantPath)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
          {suivantLabel} →
        </button>
      )}
    </div>
  )
}