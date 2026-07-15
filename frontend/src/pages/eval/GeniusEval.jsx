import { useAuth } from '../../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import API_URL from '../../config'


// Matières par concours — doivent correspondre exactement aux matières dans la table notes
const MATIERES_PAR_CONCOURS = {
  inphb: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire'],
  esatic: ['Mathématiques', 'Physique', 'Anglais', 'Français'],
  all: ['Culture Générale', 'Culture Scientifique', 'Culture Littéraire', 'Mathématiques', 'Physique', 'Anglais', 'Français']
}


const COULEURS = { or: '#C9A84C', bleu: '#4C7BC9', vert: '#4CC9A8', rose: '#C94C7B', navy: '#071020' }

// Décrit qui verra le quiz apparaître, selon le concours et la modalité ciblés
function audienceQuiz(concours, modalite) {
  const c = concours || 'all'
  const m = modalite || 'les_deux'
  const cLabel =
    c === 'inphb'  ? 'INP-HB (+ INP-HB·ESATIC·CME)' :
    c === 'esatic' ? 'ESATIC (+ INP-HB·ESATIC·CME)' :
    'Tous les concours'
  const mLabel =
    m === 'en_ligne'   ? 'En ligne' :
    m === 'presentiel' ? 'Présentiel' :
    'En ligne & Présentiel'
  return `${cLabel} · ${mLabel}`
}

function formatChrono(secondes) {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ========================
// LECTEUR DE QUIZ (étudiant)
// ========================
function LecteurQuiz({ quizId, token, onTermine, onRetour }) {
  const [data, setData] = useState(null)
  const [reponses, setReponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [enCours, setEnCours] = useState(false) // true une fois que l'étudiant a cliqué "Commencer"
  const [secondesRestantes, setSecondesRestantes] = useState(null)
  const [tentativeAffichee, setTentativeAffichee] = useState(null) // index dans data.tentatives, ou null = pas encore choisi

  // refs pour accéder à la valeur la plus récente depuis le setInterval, sans dépendre du re-render
  const reponsesRef = useRef(reponses)
  reponsesRef.current = reponses
  const submittingRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        setData(d)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [quizId])

  const soumettre = async () => {
    if (submittingRef.current) return // évite une double soumission (clic manuel + timeout simultanés)
    submittingRef.current = true
    setSubmitting(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}/soumettre`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses: reponsesRef.current })
      })
      const d = await res.json()
      if (res.ok) {
        setResultat({
          score: d.score,
          total: d.total,
          corrections: d.corrections,
          tentative_numero: d.tentative_numero,
          created_at: d.created_at
        })
        setEnCours(false)
        if (onTermine) onTermine()
      }
    } catch (err) { console.error(err) }
    finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  const commencer = () => {
    setReponses({})
    setResultat(null)
    setEnCours(true)
    const dureeSecondes = (data.quiz.duree_minutes || 10) * 60
    setSecondesRestantes(dureeSecondes)
    intervalRef.current = setInterval(() => {
      setSecondesRestantes(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          soumettre() // temps écoulé : soumission automatique avec les réponses déjà cochées
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const choisir = (qid, idx) => setReponses(prev => ({ ...prev, [qid]: idx }))

  if (loading) return <p className="text-xs text-gray-400 text-center py-10">Chargement du quiz...</p>
  if (!data) return <p className="text-xs text-gray-400 text-center py-10">Quiz introuvable</p>

  const toutesRepondues = data.questions.length > 0 && data.questions.every(q => reponses[q.id] !== undefined)
  const tentatives = data.tentatives || []

  // Affichage du détail d'une tentative passée (sélectionnée depuis l'historique)
  if (tentativeAffichee !== null && !enCours) {
    const t = tentatives[tentativeAffichee]
    return (
      <div>
        <button onClick={() => setTentativeAffichee(null)} className="text-xs font-semibold mb-4" style={{ color: COULEURS.or }}>← Retour à l'historique</button>
        <div className="rounded-2xl p-6 mb-4 text-center" style={{
          background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`,
          border: `1px solid ${t.score / t.total >= 0.5 ? COULEURS.vert : COULEURS.rose}66`
        }}>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Tentative #{t.tentative_numero}</p>
          <p className="text-4xl font-bold" style={{
            color: t.score / t.total >= 0.7 ? COULEURS.vert : t.score / t.total >= 0.5 ? COULEURS.or : COULEURS.rose
          }}>
            {t.score}/{t.total}
          </p>
          <p className="text-xs text-gray-400 mt-1">{Math.round((t.score / t.total) * 100)}% de bonnes réponses</p>
          <p className="text-xs text-gray-500 mt-2">{new Date(t.created_at).toLocaleString('fr-FR')}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <button onClick={onRetour} className="text-xs font-semibold mb-4" style={{ color: COULEURS.or }}>← Retour aux quiz</button>

      <div className="rounded-2xl p-5 mb-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${COULEURS.or}4D` }}>
        <div>
          <p className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{data.quiz.matiere}</p>
          <p className="font-bold text-white text-lg">{data.quiz.titre}</p>
          <p className="text-xs text-gray-400 mt-1">Durée : {data.quiz.duree_minutes} min — {data.questions.length} question(s)</p>
        </div>
        {enCours && secondesRestantes !== null && (
          <div className="text-center px-4 py-2 rounded-xl flex-shrink-0" style={{
            background: secondesRestantes <= 30 ? `${COULEURS.rose}26` : 'rgba(255,255,255,0.08)',
            border: `1px solid ${secondesRestantes <= 30 ? COULEURS.rose : 'rgba(255,255,255,0.15)'}`
          }}>
            <p className="text-2xl font-bold tabular-nums" style={{ color: secondesRestantes <= 30 ? COULEURS.rose : 'white' }}>
              {formatChrono(secondesRestantes)}
            </p>
            <p className="text-xs text-gray-400">temps restant</p>
          </div>
        )}
      </div>

      {resultat ? (
        <div>
          <div className="rounded-2xl p-6 mb-4 text-center" style={{
            background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`,
            border: `1px solid ${resultat.score / resultat.total >= 0.5 ? COULEURS.vert : COULEURS.rose}66`
          }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Résultat — Tentative #{resultat.tentative_numero}</p>
            <p className="text-4xl font-bold" style={{
              color: resultat.score / resultat.total >= 0.7 ? COULEURS.vert : resultat.score / resultat.total >= 0.5 ? COULEURS.or : COULEURS.rose
            }}>
              {resultat.score}/{resultat.total}
            </p>
            <p className="text-xs text-gray-400 mt-1">{Math.round((resultat.score / resultat.total) * 100)}% de bonnes réponses</p>
            {/* Message selon si la note est conservée ou non */}
            {resultat.note_conservee === false ? (
              <p className="text-xs mt-3 px-3 py-1.5 rounded-full inline-block"
                style={{ background: 'rgba(201,76,123,0.15)', color: '#C94C7B' }}>
                ⚠️ Note non conservée — seule la première tentative compte
              </p>
            ) : (
              <p className="text-xs mt-3 px-3 py-1.5 rounded-full inline-block"
                style={{ background: 'rgba(76,201,168,0.15)', color: '#4CC9A8' }}>
                ✓ Note enregistrée — première tentative
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 mb-4">
            {resultat.corrections.map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: '#fff', border: `1px solid ${c.correct ? COULEURS.vert + '55' : COULEURS.rose + '55'}` }}>
                <p className="text-xs font-bold mb-2" style={{ color: COULEURS.navy }}>{i + 1}. {c.question}</p>
                <div className="flex flex-col gap-1.5">
                  {c.options.map((opt, oi) => (
                    <div key={oi} className="text-xs px-3 py-1.5 rounded-lg flex items-center justify-between" style={{
                      background: oi === c.bonne_reponse ? `${COULEURS.vert}1A` : oi === c.choisi ? `${COULEURS.rose}1A` : '#f8f7f4',
                      border: `1px solid ${oi === c.bonne_reponse ? COULEURS.vert : oi === c.choisi ? COULEURS.rose : '#f0ece0'}`,
                      color: oi === c.bonne_reponse ? COULEURS.vert : oi === c.choisi ? COULEURS.rose : '#6b7280'
                    }}>
                      <span>{opt}</span>
                      {oi === c.bonne_reponse && <span>✓</span>}
                      {oi === c.choisi && oi !== c.bonne_reponse && <span>✗</span>}
                    </div>
                  ))}
                  {c.choisi === null && (
                    <p className="text-xs italic text-gray-400 mt-1">Question non répondue (temps écoulé)</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button onClick={commencer} className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: `linear-gradient(135deg, #b8891e, ${COULEURS.or})`, color: COULEURS.navy }}>
            Refaire une tentative
          </button>
        </div>
      ) : enCours ? (
        <div className="flex flex-col gap-3">
          {data.questions.map((q, i) => (
            <div key={q.id} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
              <p className="text-xs font-bold mb-3" style={{ color: COULEURS.navy }}>{i + 1}. {q.question}</p>
              <div className="flex flex-col gap-1.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} onClick={() => choisir(q.id, oi)}
                    className="text-xs px-3 py-2 rounded-lg cursor-pointer transition"
                    style={{
                      background: reponses[q.id] === oi ? `${COULEURS.or}1A` : '#f8f7f4',
                      border: `1px solid ${reponses[q.id] === oi ? COULEURS.or : '#f0ece0'}`,
                      color: reponses[q.id] === oi ? COULEURS.or : '#374151',
                      fontWeight: reponses[q.id] === oi ? '700' : '400'
                    }}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={soumettre} disabled={submitting}
            className="py-3 rounded-xl text-sm font-bold mt-2"
            style={{
              background: !submitting ? `linear-gradient(135deg, #b8891e, ${COULEURS.or})` : '#e5e1d5',
              color: !submitting ? COULEURS.navy : '#9ca3af',
              cursor: !submitting ? 'pointer' : 'not-allowed'
            }}>
            {submitting ? 'Envoi...' : toutesRepondues ? 'Valider mes réponses' : 'Valider (questions sans réponse comptées comme incorrectes)'}
          </button>
        </div>
      ) : (
        <div>
          {tentatives.length > 0 && (
            <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
              <p className="font-bold text-sm mb-3" style={{ color: COULEURS.navy }}>Vos tentatives précédentes</p>
              <div className="flex flex-col gap-2">
                {tentatives.map((t, i) => {
                  const pct = (t.score / t.total) * 100
                  const couleur = pct >= 70 ? COULEURS.vert : pct >= 50 ? COULEURS.or : COULEURS.rose
                  return (
                    <div key={i} onClick={() => setTentativeAffichee(i)}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition"
                      style={{ background: '#f8f7f4' }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: COULEURS.navy }}>Tentative #{t.tentative_numero}</p>
                        <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: couleur }}>{t.score}/{t.total}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <button onClick={commencer} className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: `linear-gradient(135deg, #b8891e, ${COULEURS.or})`, color: COULEURS.navy }}>
            {tentatives.length > 0 ? 'Nouvelle tentative' : 'Commencer le quiz'}
          </button>
        </div>
      )}
    </div>
  )
}

// ========================
// VUE ÉTUDIANT
// ========================
function VueEtudiant({ token }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [quizOuvert, setQuizOuvert] = useState(null)

  const charger = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/quiz`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.quizzes) setQuizzes(d.quizzes)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  if (quizOuvert) {
    return <LecteurQuiz quizId={quizOuvert} token={token} onTermine={charger} onRetour={() => setQuizOuvert(null)} />
  }

  return (
    <div>
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-10">Chargement des quiz...</p>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-gray-400">Aucun quiz disponible pour le moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((q, i) => (
            <div key={i} onClick={() => setQuizOuvert(q.id)}
              className="rounded-2xl p-5 cursor-pointer transition hover:shadow-lg"
              style={{ background: `linear-gradient(145deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${q.deja_fait ? COULEURS.vert + '4D' : COULEURS.or + '4D'}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{q.matiere}</span>
                {q.deja_fait ? (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: `${COULEURS.vert}26`, color: COULEURS.vert, border: `1px solid ${COULEURS.vert}` }}>
                    Meilleur : {q.score}/{q.total_score}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: `${COULEURS.or}26`, color: COULEURS.or, border: `1px solid ${COULEURS.or}` }}>
                    À faire
                  </span>
                )}
              </div>
              <p className="font-bold text-white">{q.titre}</p>
              <p className="text-xs text-gray-400 mt-1">
                {q.nb_questions} questions — {q.duree_minutes} min{q.nb_tentatives > 0 ? ` — ${q.nb_tentatives} tentative(s)` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========================
// VUE PROF / ADMIN
// ========================
function VueProf({ token }) {
  const [vue, setVue] = useState('liste')
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultats, setResultats] = useState(null)
  const [etudiantOuvert, setEtudiantOuvert] = useState(null)

  const [form, setForm] = useState({ titre: '', matiere: '', niveau: '', duree_minutes: 10, concours: 'all', modalite: 'les_deux' })
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], bonne_reponse: 0 }])
  const [iaForm, setIaForm] = useState({ theme: '', nombre_questions: 5 })
  const [generating, setGenerating] = useState(false)
  const [importingPdf, setImportingPdf] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  const charger = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/quiz`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.quizzes) setQuizzes(d.quizzes)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { charger() }, [])

  const reinitialiserForm = () => {
    setForm({ titre: '', matiere: '', niveau: '', duree_minutes: 10, concours: 'all', modalite: 'les_deux' })
    setQuestions([{ question: '', options: ['', '', '', ''], bonne_reponse: 0 }])
    setIaForm({ theme: '', nombre_questions: 5 })
    setErreur('')
  }

  const ajouterQuestion = () => setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], bonne_reponse: 0 }])
  const supprimerQuestion = (i) => setQuestions(prev => prev.filter((_, idx) => idx !== i))
  const majQuestion = (i, champ, val) => setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [champ]: val } : q))
  const majOption = (i, oi, val) => setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q))

  const genererIA = async () => {
    if (!form.matiere) { setErreur('Renseignez la matière avant de générer.'); return }
    setGenerating(true)
    setErreur('')
    try {
      const res = await fetch(`${API_URL}/api/quiz/generer-ia`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ matiere: form.matiere, niveau: form.niveau, theme: iaForm.theme, nombre_questions: iaForm.nombre_questions })
      })
      const d = await res.json()
      if (res.ok && d.questions) setQuestions(d.questions)
      else setErreur(d.error || 'Erreur lors de la génération')
    } catch (err) { setErreur('Erreur réseau lors de la génération') }
    finally { setGenerating(false) }
  }

  const importerPdf = async (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    e.target.value = '' // permet de re-sélectionner le même fichier ensuite si besoin

    if (fichier.type !== 'application/pdf') {
      setErreur('Seuls les fichiers PDF sont acceptés.')
      return
    }

    setImportingPdf(true)
    setErreur('')
    try {
      const formData = new FormData()
      formData.append('fichier', fichier)

      const res = await fetch(`${API_URL}/api/quiz/importer-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // pas de Content-Type, le navigateur le génère avec la boundary multipart
        body: formData
      })
      const d = await res.json()

      if (res.ok && d.questions) {
        setQuestions(d.questions)
        if (d.tronque) {
          setErreur(`Le PDF contenait beaucoup de questions : seules les ${d.nb_valides} premières ont pu être importées proprement. Vous pouvez ajouter le reste manuellement.`)
        } else if (d.nb_valides < d.nb_detectees) {
          setErreur(`${d.nb_valides} question(s) importée(s) sur ${d.nb_detectees} détectée(s) — vérifiez le contenu avant de publier.`)
        }
      } else {
        setErreur(d.error || "Erreur lors de l'import du PDF")
      }
    } catch (err) {
      setErreur('Erreur réseau lors de l\'import du PDF')
    } finally {
      setImportingPdf(false)
    }
  }

  const enregistrer = async () => {
    if (!form.titre || !form.matiere) { setErreur('Le titre et la matière sont requis.'); return }
    const duree = parseInt(form.duree_minutes)
    if (!duree || duree < 1) { setErreur('La durée du quiz doit être supérieure à 0 minute.'); return }
    const valides = questions.every(q => q.question.trim() && q.options.every(o => o.trim()))
    if (!valides) { setErreur('Toutes les questions et options doivent être remplies.'); return }
    setSaving(true)
    setErreur('')
    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duree_minutes: duree, questions })
      })
      if (res.ok) { reinitialiserForm(); setVue('liste'); charger() }
      else { const d = await res.json(); setErreur(d.error || 'Erreur lors de l\'enregistrement') }
    } catch (err) { setErreur('Erreur réseau') }
    finally { setSaving(false) }
  }

  const voirResultats = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/quiz/${id}/resultats`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      setResultats(d)
      setEtudiantOuvert(null)
      setVue('resultats')
    } catch (err) { console.error(err) }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce quiz ?')) return
    try {
      await fetch(`${API_URL}/api/quiz/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      charger()
    } catch (err) { console.error(err) }
  }

  const basculerVisibilite = async (q) => {
    try {
      await fetch(`${API_URL}/api/quiz/${q.id}/visibilite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ publie: !q.publie })
      })
      charger()
    } catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {[{ k: 'liste', l: 'Mes quiz' }, { k: 'creer', l: '+ Créer un quiz' }].map(t => (
          <button key={t.k} onClick={() => { setVue(t.k); if (t.k === 'creer') reinitialiserForm() }}
            className="px-4 py-2 rounded-xl text-xs font-bold transition"
            style={{
              background: vue === t.k ? `linear-gradient(135deg, #b8891e, ${COULEURS.or})` : '#fff',
              color: vue === t.k ? COULEURS.navy : '#9ca3af',
              border: `1px solid ${vue === t.k ? COULEURS.or : '#f0ece0'}`
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {vue === 'liste' && (
        loading ? <p className="text-xs text-gray-400 text-center py-10">Chargement...</p> :
        quizzes.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-gray-400">Aucun quiz créé pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{q.matiere}</span>
                  <div className="flex items-center gap-1.5">
                    {q.publie === false && (
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${COULEURS.rose}1A`, color: COULEURS.rose }}>🚫 Masqué</span>
                    )}
                    {q.ai_genere && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: `${COULEURS.bleu}1A`, color: COULEURS.bleu }}>IA</span>}
                  </div>
                </div>
                <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{q.titre}</p>
                <p className="text-xs mt-1 flex items-start gap-1" style={{ color: COULEURS.bleu }}>
                  <span>👥</span>
                  <span>Visible par : {audienceQuiz(q.concours, q.modalite)}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {q.nb_questions} questions · {q.nb_tentatives} tentative{q.nb_tentatives !== '1' ? 's' : ''}{q.moyenne_pct ? ` · moy. ${q.moyenne_pct}%` : ''}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => voirResultats(q.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: `${COULEURS.bleu}1A`, color: COULEURS.bleu, border: `1px solid ${COULEURS.bleu}4D` }}>
                    Résultats
                  </button>
                  <button onClick={() => basculerVisibilite(q)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={q.publie === false
                      ? { background: `${COULEURS.vert}1A`, color: COULEURS.vert, border: `1px solid ${COULEURS.vert}4D` }
                      : { background: 'rgba(230,150,40,0.12)', color: '#C97B1A', border: '1px solid rgba(230,150,40,0.3)' }}>
                    {q.publie === false ? 'Afficher' : 'Masquer'}
                  </button>
                  <button onClick={() => supprimer(q.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: `${COULEURS.rose}1A`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}4D` }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {vue === 'creer' && (
        <div className="flex flex-col gap-5">
          {erreur && (
            <div className="text-xs font-semibold p-3 rounded-xl" style={{ background: `${COULEURS.rose}1A`, color: COULEURS.rose, border: `1px solid ${COULEURS.rose}4D` }}>
              {erreur}
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
            <p className="font-bold text-sm mb-3" style={{ color: COULEURS.navy }}>Informations générales</p>
            <div className="flex flex-col gap-3">

              {/* Ligne 1 — Concours cible */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">1. Concours concerné</p>
                <div className="flex gap-2">
                  {[
                    { val: 'inphb', label: 'INP-HB', couleur: '#C9A84C' },
                    { val: 'esatic', label: 'ESATIC', couleur: '#4C7BC9' },
                    { val: 'all', label: 'INP-HB + ESATIC + CME', couleur: '#7B4CC9' },
                  ].map(c => (
                    <button key={c.val} type="button"
                      onClick={() => setForm(p => ({ ...p, concours: c.val, matiere: '' }))}
                      className="text-xs font-bold px-4 py-2 rounded-xl transition"
                      style={{
                        background: form.concours === c.val ? c.couleur : `${c.couleur}15`,
                        color: form.concours === c.val ? 'white' : c.couleur,
                        border: `1px solid ${c.couleur}40`
                      }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ligne 2 — Modalité */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">2. Visible par</p>
                <div className="flex gap-2">
                  {[
                    { val: 'les_deux', label: '🔀 Tous les élèves', couleur: '#4CC9A8' },
                    { val: 'en_ligne', label: '💻 En ligne uniquement', couleur: '#4C7BC9' },
                    { val: 'presentiel', label: '🏫 Présentiel uniquement', couleur: '#C9A84C' },
                  ].map(m => (
                    <button key={m.val} type="button"
                      onClick={() => setForm(p => ({ ...p, modalite: m.val }))}
                      className="text-xs font-bold px-3 py-2 rounded-xl transition"
                      style={{
                        background: form.modalite === m.val ? m.couleur : `${m.couleur}15`,
                        color: form.modalite === m.val ? 'white' : m.couleur,
                        border: `1px solid ${m.couleur}40`
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ligne 3 — Matière (menu déroulant selon concours) */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">3. Matière <span className="text-red-400">*</span></p>
                <div className="flex gap-2 flex-wrap">
                  {(MATIERES_PAR_CONCOURS[form.concours] || MATIERES_PAR_CONCOURS.all).map(m => (
                    <button key={m} type="button"
                      onClick={() => setForm(p => ({ ...p, matiere: m }))}
                      className="text-xs font-semibold px-3 py-2 rounded-xl transition"
                      style={{
                        background: form.matiere === m ? '#071020' : '#f8f7f4',
                        color: form.matiere === m ? '#C9A84C' : '#374151',
                        border: `1px solid ${form.matiere === m ? 'rgba(201,168,76,0.4)' : '#e8e4da'}`
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ligne 4 — Titre, niveau, durée */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Titre du quiz *" className="text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
                <input value={form.niveau} onChange={e => setForm(p => ({ ...p, niveau: e.target.value }))}
                  placeholder="Niveau (optionnel)" className="text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={form.duree_minutes}
                    onChange={e => setForm(p => ({ ...p, duree_minutes: e.target.value }))}
                    placeholder="Durée *" className="w-full text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
                  <span className="text-xs text-gray-400 whitespace-nowrap">min *</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${COULEURS.bleu}4D` }}>
            <p className="font-bold text-sm text-white mb-1">🤖 Génération assistée par IA</p>
            <p className="text-xs text-gray-400 mb-3">Remplit automatiquement les questions ci-dessous — modifiable ensuite.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input value={iaForm.theme} onChange={e => setIaForm(p => ({ ...p, theme: e.target.value }))}
                placeholder="Thème précis (optionnel)" className="text-xs rounded-xl px-3 py-2 outline-none md:col-span-2"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
              <input type="number" min="1" max="20" value={iaForm.nombre_questions}
                onChange={e => setIaForm(p => ({ ...p, nombre_questions: e.target.value }))}
                className="text-xs rounded-xl px-3 py-2 outline-none"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }} />
            </div>
            <button onClick={genererIA} disabled={generating}
              className="text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: generating ? 'rgba(76,123,201,0.3)' : COULEURS.bleu, color: 'white', cursor: generating ? 'wait' : 'pointer' }}>
              {generating ? 'Génération en cours...' : 'Générer avec l\'IA'}
            </button>
          </div>

          <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${COULEURS.vert}4D` }}>
            <p className="font-bold text-sm text-white mb-1">📄 Importer depuis un PDF</p>
            <p className="text-xs text-gray-400 mb-3">
              Glissez un PDF contenant un QCM existant — l'IA détecte les questions, les options et reconstitue le quiz automatiquement. Modifiable ensuite ci-dessous.
            </p>
            <label
              className="inline-flex items-center text-xs font-bold px-4 py-2 rounded-xl"
              style={{
                background: importingPdf ? 'rgba(76,201,168,0.3)' : COULEURS.vert,
                color: 'white',
                cursor: importingPdf ? 'wait' : 'pointer'
              }}>
              {importingPdf ? 'Analyse du PDF en cours...' : 'Choisir un fichier PDF'}
              <input
                type="file"
                accept="application/pdf"
                onChange={importerPdf}
                disabled={importingPdf}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: COULEURS.or }}>Question {i + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => supprimerQuestion(i)} className="text-xs" style={{ color: COULEURS.rose }}>Retirer</button>
                  )}
                </div>
                <input value={q.question} onChange={e => majQuestion(i, 'question', e.target.value)}
                  placeholder="Texte de la question" className="w-full text-xs rounded-xl px-3 py-2 outline-none mb-2"
                  style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" checked={q.bonne_reponse === oi} onChange={() => majQuestion(i, 'bonne_reponse', oi)}
                        style={{ accentColor: COULEURS.vert }} />
                      <input value={opt} onChange={e => majOption(i, oi, e.target.value)}
                        placeholder={`Option ${oi + 1}`} className="flex-1 text-xs rounded-xl px-3 py-1.5 outline-none"
                        style={{ background: q.bonne_reponse === oi ? `${COULEURS.vert}0D` : '#f8f7f4', border: `1px solid ${q.bonne_reponse === oi ? COULEURS.vert : '#e8e4da'}` }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={ajouterQuestion} className="text-xs font-semibold py-2 rounded-xl"
              style={{ background: `${COULEURS.or}1A`, color: COULEURS.or, border: `1px dashed ${COULEURS.or}` }}>
              + Ajouter une question manuellement
            </button>
          </div>

          <button onClick={enregistrer} disabled={saving}
            className="py-3 rounded-xl text-sm font-bold"
            style={{ background: saving ? '#e5e1d5' : `linear-gradient(135deg, #b8891e, ${COULEURS.or})`, color: COULEURS.navy }}>
            {saving ? 'Enregistrement...' : 'Publier le quiz'}
          </button>
        </div>
      )}

      {vue === 'resultats' && resultats && (
        <div>
          <button onClick={() => setVue('liste')} className="text-xs font-semibold mb-4" style={{ color: COULEURS.or }}>← Retour aux quiz</button>
          <div className="rounded-2xl p-5 mb-4" style={{ background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${COULEURS.or}4D` }}>
            <p className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{resultats.quiz.matiere}</p>
            <p className="font-bold text-white text-lg">{resultats.quiz.titre}</p>
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              👥 Visible par : {audienceQuiz(resultats.quiz.concours, resultats.quiz.modalite)}
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
            <p className="font-bold text-sm mb-4" style={{ color: COULEURS.navy }}>Résultats des étudiants ({resultats.resultats.length})</p>
            {resultats.resultats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Aucune tentative pour le moment</p>
            ) : (
              <div className="flex flex-col gap-2">
                {resultats.resultats.map((r, i) => {
                  const pct = (r.meilleur_score / r.meilleur_total) * 100
                  const couleur = pct >= 70 ? COULEURS.vert : pct >= 50 ? COULEURS.or : COULEURS.rose
                  const estOuvert = etudiantOuvert === i
                  return (
                    <div key={i} className="rounded-xl" style={{ background: '#f8f7f4' }}>
                      <div onClick={() => setEtudiantOuvert(estOuvert ? null : i)}
                        className="flex items-center gap-3 p-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: COULEURS.navy }}>
                          {r.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: COULEURS.navy }}>{r.prenom || r.username} {r.nom || ''}</p>
                          <p className="text-xs text-gray-400">{r.matricule} — {r.tentatives.length} tentative(s)</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: couleur }}>Meilleur : {r.meilleur_score}/{r.meilleur_total}</span>
                        <span className="text-xs text-gray-400">{estOuvert ? '▲' : '▼'}</span>
                      </div>
                      {estOuvert && (
                        <div className="px-3 pb-3 flex flex-col gap-1.5">
                          {r.tentatives.map((t, ti) => {
                            const tpct = (t.score / t.total) * 100
                            const tcouleur = tpct >= 70 ? COULEURS.vert : tpct >= 50 ? COULEURS.or : COULEURS.rose
                            return (
                              <div key={ti} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                                <div>
                                  <span className="text-xs font-semibold" style={{ color: COULEURS.navy }}>Tentative #{t.tentative_numero}</span>
                                  <span className="text-xs text-gray-400 ml-2">{new Date(t.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <span className="text-xs font-bold" style={{ color: tcouleur }}>{t.score}/{t.total}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// COMPOSANT PRINCIPAL
// ========================
export default function GeniusEval() {
  const { user, token } = useAuth()
  const isProfOrAdmin = ['professeur', 'admin'].includes(user?.role)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>
      <div className="mb-6">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: COULEURS.or }}>Outils</p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: COULEURS.navy }}>Genius Eval</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isProfOrAdmin ? 'Créez et suivez des QCM auto-corrigés' : 'Vos quiz auto-corrigés'}
        </p>
      </div>
      {isProfOrAdmin ? <VueProf token={token} /> : <VueEtudiant token={token} />}
    </div>
  )
}