import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api'
import { useConcours } from '../hooks/useConcours'
import { usePreference } from '../hooks/usePreference'
import { useToast } from '../hooks/useUi'
import { CODES_CONCOURS, CONCOURS, libelleConcours, couleurConcours, viseConcours } from '../lib/concours'
import { cleMatiere } from '../lib/profil'
import { TRIS, estNouveau, filtrerDocuments, iconeMatiere, slugMatiere, typeDe } from '../lib/ressources'
import Banniere from '../components/Banniere'
import BarreOutils from '../components/BarreOutils'
import Breadcrumb from '../components/Breadcrumb'
import CarteRessource from '../components/CarteRessource'
import EmptyState from '../components/EmptyState'
import LecteurPDF from '../components/LecteurPDF'
import Loader from '../components/Loader'

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

// Cadre commun : fil d'Ariane, retour d'un niveau, titre
function Page({ crumbs, retourPath, retourLabel, surtitre, titre, soustitre, children }) {
  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <Breadcrumb crumbs={crumbs} retourPath={retourPath} retourLabel={retourLabel} />
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#8A6D1A' }}>{surtitre}</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>{titre}</h1>
        {soustitre && <p className="text-gray-500 text-sm mt-1">{soustitre}</p>}
      </div>
      {children}
    </div>
  )
}

const Grille = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{children}</div>

// Logo d'un concours ; à défaut (fichier absent), son sigle
function LogoConcours({ code }) {
  const [ko, setKo] = useState(false)
  const logo = CONCOURS[code]?.logo
  return logo && !ko
    ? <img src={logo} alt="" onError={() => setKo(true)} style={{ maxHeight: 70, maxWidth: 160, objectFit: 'contain' }} />
    : <span style={{ fontSize: 34, fontWeight: 900, color: couleurConcours(code) }}>{libelleConcours(code)}</span>
}

// Documents sans matière : regroupés dans une carte « Autres documents » pour rester accessibles
const AUTRES = 'Autres documents'
const sansMatiere = (r) => !String(r.matiere ?? '').trim()

// Matières d'un concours : liste officielle, puis celles qui n'apparaissent que dans les documents
function matieresDuConcours(code, ressources) {
  const matieres = [...(CONCOURS[code]?.matieres ?? [])]
  for (const r of ressources) {
    if (!sansMatiere(r) && viseConcours(r.concours, code) && !matieres.some(m => cleMatiere(m) === cleMatiere(r.matiere))) matieres.push(r.matiere)
  }
  if (ressources.some(r => sansMatiere(r) && viseConcours(r.concours, code))) matieres.push(AUTRES)
  return matieres
}
const documentsDe = (ressources, code, matiere) =>
  ressources.filter(r => viseConcours(r.concours, code)
    && (matiere === AUTRES ? sansMatiere(r) : cleMatiere(r.matiere) === cleMatiere(matiere)))

// ══════════════════════════════════════════
// NIVEAU 1 — /ressources : les concours
// ══════════════════════════════════════════
function NiveauConcours({ codes, ressources, chargement }) {
  const navigate = useNavigate()
  const { search } = useLocation()

  // Anciennes adresses /ressources?ecole=ENSEA
  const ecole = new URLSearchParams(search).get('ecole')
  const ancien = ecole && CODES_CONCOURS.find(c => libelleConcours(c).toLowerCase() === ecole.trim().toLowerCase())
  if (ancien && codes.includes(ancien)) return <Navigate to={`/ressources/${ancien}`} replace />
  // Un seul concours : on saute le choix
  if (codes.length === 1) return <Navigate to={`/ressources/${codes[0]}`} replace />

  return (
    <Page crumbs={[{ label: 'Accueil', path: '/accueil' }, { label: 'Ressources' }]} retourPath="/accueil" retourLabel="Accueil"
      surtitre="Bibliothèque" titre="Tous mes documents" soustitre="Choisissez votre concours">
      {codes.length === 0 ? (
        <EmptyState icone="🎓" titre="Aucun concours associé à votre compte" texte="Contactez l’administration pour être inscrit à un concours." />
      ) : chargement ? <Loader texte="Chargement…" /> : (
        <Grille>
          {codes.map(code => {
            const nbMatieres = (CONCOURS[code]?.matieres ?? []).length
            const nbDocs = ressources.filter(r => viseConcours(r.concours, code)).length
            return (
              <CarteRessource key={code} couleur={couleurConcours(code)} titre={libelleConcours(code)}
                sousTitre={`${pluriel(nbMatieres, 'matière')} · ${pluriel(nbDocs, 'document')}`}
                banniere={<Banniere couleur={couleurConcours(code)} hauteur={128}><LogoConcours code={code} /></Banniere>}
                onClick={() => navigate(`/ressources/${code}`)} />
            )
          })}
        </Grille>
      )}
    </Page>
  )
}

// Fil d'Ariane de base d'un concours (« Ressources » n'est pas cliquable s'il n'y a qu'un concours)
function cheminConcours(code, unique) {
  return [
    { label: 'Accueil', path: '/accueil' },
    { label: 'Ressources', path: unique ? undefined : '/ressources' },
    { label: libelleConcours(code), path: `/ressources/${code}` }
  ]
}

// ══════════════════════════════════════════
// NIVEAU 2 — /ressources/:concours : les matières
// ══════════════════════════════════════════
function NiveauMatieres({ codes, ressources, chargement }) {
  const navigate = useNavigate()
  const { concours: param } = useParams()
  const code = String(param ?? '').toLowerCase()
  if (!codes.includes(code)) return <Navigate to="/ressources" replace />

  const unique = codes.length === 1
  const matieres = matieresDuConcours(code, ressources)
  const couleur = couleurConcours(code)
  const crumbs = cheminConcours(code, unique)

  return (
    <Page crumbs={[...crumbs.slice(0, 2), { label: libelleConcours(code) }]}
      retourPath={unique ? '/accueil' : '/ressources'} retourLabel={unique ? 'Accueil' : 'Ressources'}
      surtitre={`Bibliothèque · ${libelleConcours(code)}`} titre={`Documents ${libelleConcours(code)}`}
      soustitre={`Choisissez une matière — ${pluriel(matieres.length, 'matière')}`}>
      {chargement ? <Loader texte="Chargement…" /> : (
        <Grille>
          {matieres.map(matiere => {
            const docs = documentsDe(ressources, code, matiere)
            return (
              <CarteRessource key={slugMatiere(matiere)} couleur={couleur} titre={matiere}
                sousTitre={docs.length ? pluriel(docs.length, 'document') : 'Aucun document'}
                badge={docs.some(d => estNouveau(d.created_at)) ? 'Nouveau' : undefined}
                banniere={<Banniere couleur={couleur} icone={iconeMatiere(matiere)} />}
                onClick={() => navigate(`/ressources/${code}/${slugMatiere(matiere)}`)} />
            )
          })}
        </Grille>
      )}
    </Page>
  )
}

// ══════════════════════════════════════════
// NIVEAU 3 — /ressources/:concours/:matiere : les documents
// ══════════════════════════════════════════
function NiveauDocuments({ codes, ressources, chargement, erreur }) {
  const { concours: param, matiere: slug } = useParams()
  const toast = useToast()
  const code = String(param ?? '').toLowerCase()
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('recent')
  const [type, setType] = useState('tous')
  const [vue, setVue] = usePreference('ressources.vue', 'cartes', ['cartes', 'liste'])
  const [ouverte, setOuverte] = useState(null)

  const matiere = codes.includes(code) ? matieresDuConcours(code, ressources).find(m => slugMatiere(m) === slug) : null
  const documents = useMemo(() => (matiere ? documentsDe(ressources, code, matiere) : []), [ressources, code, matiere])
  const liste = useMemo(() => filtrerDocuments(documents, { recherche, type, tri }), [documents, recherche, type, tri])

  if (!codes.includes(code)) return <Navigate to="/ressources" replace />
  if (!matiere && !chargement) return <Navigate to={`/ressources/${code}`} replace />

  const unique = codes.length === 1
  const couleur = couleurConcours(code)
  const typesPresents = [...new Set(documents.map(d => d.type))]
  const filtres = typesPresents.length > 1
    ? [{ value: 'tous', label: 'Tous les types' }, ...typesPresents.map(t => ({ value: t, label: typeDe(t).label }))]
    : null

  const copierLien = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.succes('Lien copié') }
    catch { toast.erreur('Copie impossible, copiez l’adresse depuis la barre du navigateur.') }
  }
  const auteur = (d) => d.professeur ? (d.professeur.prenom || d.professeur.username) : null

  return (
    <Page crumbs={[...cheminConcours(code, unique), { label: matiere ?? '…' }]}
      retourPath={`/ressources/${code}`} retourLabel={libelleConcours(code)}
      surtitre={`Bibliothèque · ${libelleConcours(code)}`} titre={matiere ?? ''}
      soustitre={pluriel(documents.length, 'document')}>
      {ouverte && <LecteurPDF ressource={ouverte} onFermer={() => setOuverte(null)} />}

      {chargement ? <Loader texte="Chargement…" /> : erreur ? (
        <p className="text-sm text-center py-8" style={{ color: '#C94C7B' }}>{erreur}</p>
      ) : documents.length === 0 ? (
        <EmptyState icone="📭" titre="Aucun document pour l’instant" texte="Votre professeur n’a encore rien publié dans cette matière." />
      ) : (
        <>
          <BarreOutils recherche={recherche} onRecherche={setRecherche} filtre={type} onFiltre={setType} filtres={filtres}
            tri={tri} onTri={setTri} tris={TRIS} vue={vue} onVue={setVue} />
          {liste.length === 0 ? (
            <EmptyState icone="🔍" titre="Aucun résultat" texte="Essayez un autre mot ou retirez le filtre." />
          ) : vue === 'cartes' ? (
            <Grille>
              {liste.map(d => (
                <CarteRessource key={d.id} couleur={couleur} titre={d.titre}
                  sousTitre={[typeDe(d.type).label, auteur(d), new Date(d.created_at).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')}
                  badge={estNouveau(d.created_at) ? 'Nouveau' : undefined}
                  banniere={<Banniere couleur={couleur} icone={typeDe(d.type).icone} />}
                  actions={[{ label: 'Ouvrir', onClick: () => setOuverte(d) }, { label: 'Copier le lien de la matière', onClick: copierLien }]}
                  onClick={() => setOuverte(d)} />
              ))}
            </Grille>
          ) : (
            <ul className="flex flex-col gap-3">
              {liste.map(d => {
                const t = typeDe(d.type)
                return (
                  <li key={d.id}>
                    <button type="button" onClick={() => setOuverte(d)}
                      className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
                      style={{ border: '1px solid #f0ece0' }}>
                      <span aria-hidden="true" className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: `${t.couleur}20`, color: t.couleur }}>{t.label.slice(0, 3).toUpperCase()}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-sm truncate" style={{ color: couleur }}>{d.titre}</span>
                        {d.description && <span className="block text-xs text-gray-500 truncate">{d.description}</span>}
                        <span className="block text-xs text-gray-500 mt-0.5">
                          {[t.label, auteur(d) && `Par ${auteur(d)}`, new Date(d.created_at).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      {estNouveau(d.created_at) && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#C9A84C', color: '#071020' }}>Nouveau</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </Page>
  )
}

// ══════════════════════════════════════════
// Routeur de la Bibliothèque — les données ne sont chargées qu'une fois pour les trois niveaux
// ══════════════════════════════════════════
export default function Ressources() {
  const { peutAcceder } = useConcours()
  const codes = CODES_CONCOURS.filter(code => peutAcceder(code))
  const [ressources, setRessources] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let vivant = true
    api.get('/api/ressources')
      .then(res => {
        if (!vivant) return
        if (res.ok && Array.isArray(res.data?.ressources)) setRessources(res.data.ressources)
        else setErreur('Erreur lors du chargement des documents')
      })
      .catch(() => vivant && setErreur('Erreur de connexion au serveur'))
      .finally(() => vivant && setChargement(false))
    return () => { vivant = false }
  }, [])

  const donnees = { codes, ressources, chargement, erreur }
  return (
    <Routes>
      <Route index element={<NiveauConcours {...donnees} />} />
      <Route path=":concours" element={<NiveauMatieres {...donnees} />} />
      <Route path=":concours/:matiere" element={<NiveauDocuments {...donnees} />} />
      <Route path="*" element={<Navigate to="/ressources" replace />} />
    </Routes>
  )
}
