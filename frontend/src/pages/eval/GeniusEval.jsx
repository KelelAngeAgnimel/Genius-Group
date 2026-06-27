import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import API_URL from '../../config'

const COULEURS = { or: '#C9A84C', bleu: '#4C7BC9', vert: '#4CC9A8', rose: '#C94C7B', navy: '#071020' }

// ========================
// LECTEUR DE QUIZ (étudiant)
// ========================
function LecteurQuiz({ quizId, token, onTermine, onRetour }) {
  const [data, setData] = useState(null)
  const [reponses, setReponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resultat, setResultat] = useState(null)

  useEffect(() => {
    const charger = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quiz/${quizId}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await res.json()
        setData(d)
        if (d.resultat) {
          setResultat({
            score: d.resultat.score,
            total: d.resultat.total,
            corrections: d.questions.map(q => ({
              ...q,
              choisi: d.resultat.reponses?.[q.id] ?? null,
              correct: d.resultat.reponses?.[q.id] === q.bonne_reponse
            }))
          })
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    charger()
  }, [quizId])

  const choisir = (qid, idx) => setReponses(prev => ({ ...prev, [qid]: idx }))

  const soumettre = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}/soumettre`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses })
      })
      const d = await res.json()
      if (res.ok) {
        setResultat(d)
        if (onTermine) onTermine()
      }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  if (loading) return <p className="text-xs text-gray-400 text-center py-10">Chargement du quiz...</p>
  if (!data) return <p className="text-xs text-gray-400 text-center py-10">Quiz introuvable</p>

  const toutesRepondues = data.questions.length > 0 && data.questions.every(q => reponses[q.id] !== undefined)

  return (
    <div>
      <button onClick={onRetour} className="text-xs font-semibold mb-4" style={{ color: COULEURS.or }}>← Retour aux quiz</button>

      <div className="rounded-2xl p-5 mb-4" style={{ background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`, border: `1px solid ${COULEURS.or}4D` }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: COULEURS.or }}>{data.quiz.matiere}</p>
        <p className="font-bold text-white text-lg">{data.quiz.titre}</p>
      </div>

      {resultat ? (
        <div>
          <div className="rounded-2xl p-6 mb-4 text-center" style={{
            background: `linear-gradient(135deg, ${COULEURS.navy}, #0d1f3c)`,
            border: `1px solid ${resultat.score / resultat.total >= 0.5 ? COULEURS.vert : COULEURS.rose}66`
          }}>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Résultat</p>
            <p className="text-4xl font-bold" style={{
              color: resultat.score / resultat.total >= 0.7 ? COULEURS.vert : resultat.score / resultat.total >= 0.5 ? COULEURS.or : COULEURS.rose
            }}>
              {resultat.score}/{resultat.total}
            </p>
            <p className="text-xs text-gray-400 mt-1">{Math.round((resultat.score / resultat.total) * 100)}% de bonnes réponses</p>
          </div>

          <div className="flex flex-col gap-3">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
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
          <button onClick={soumettre} disabled={!toutesRepondues || submitting}
            className="py-3 rounded-xl text-sm font-bold mt-2"
            style={{
              background: toutesRepondues && !submitting ? `linear-gradient(135deg, #b8891e, ${COULEURS.or})` : '#e5e1d5',
              color: toutesRepondues && !submitting ? COULEURS.navy : '#9ca3af',
              cursor: toutesRepondues && !submitting ? 'pointer' : 'not-allowed'
            }}>
            {submitting ? 'Envoi...' : 'Valider mes réponses'}
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
  const [quizActif, setQuizActif] = useState(null)

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

  if (quizActif) {
    return <LecteurQuiz quizId={quizActif} token={token} onTermine={charger} onRetour={() => { setQuizActif(null); charger() }} />
  }

  if (loading) return <p className="text-xs text-gray-400 text-center py-10">Chargement...</p>

  return (
    <div className="flex flex-col gap-3">
      {quizzes.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-10">Aucun quiz disponible pour le moment.</p>
      )}
      {quizzes.map(q => (
        <div key={q.id} onClick={() => setQuizActif(q.id)}
          className="rounded-2xl p-4 cursor-pointer transition flex items-center justify-between"
          style={{ background: '#fff', border: '1px solid #f0ece0' }}>
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: COULEURS.or }}>{q.matiere}</p>
            <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{q.titre}</p>
            <p className="text-xs text-gray-400 mt-1">{q.nb_questions} question(s)</p>
          </div>
          {q.deja_fait ? (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: `${COULEURS.vert}1A`, color: COULEURS.vert }}>
              {q.score}/{q.total_score}
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: `${COULEURS.or}1A`, color: COULEURS.or }}>
              À faire
            </span>
          )}
        </div>
      ))}
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

  const [form, setForm] = useState({ titre: '', matiere: '', niveau: '' })
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
    setForm({ titre: '', matiere: '', niveau: '' })
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
    e.target.value = ''

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
        headers: { Authorization: `Bearer ${token}` },
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
    const valides = questions.every(q => q.question.trim() && q.options.every(o => o.trim()))
    if (!valides) { setErreur('Toutes les questions et options doivent être remplies.'); return }
    setSaving(true)
    setErreur('')
    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, questions })
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

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setVue('liste')} className="text-xs font-bold px-4 py-2 rounded-xl"
          style={{ background: vue === 'liste' ? COULEURS.navy : '#fff', color: vue === 'liste' ? COULEURS.or : '#6b7280', border: '1px solid #f0ece0' }}>
          Mes quiz
        </button>
        <button onClick={() => { reinitialiserForm(); setVue('creer') }} className="text-xs font-bold px-4 py-2 rounded-xl"
          style={{ background: vue === 'creer' ? COULEURS.navy : '#fff', color: vue === 'creer' ? COULEURS.or : '#6b7280', border: '1px solid #f0ece0' }}>
          + Créer un quiz
        </button>
      </div>

      {vue === 'liste' && (
        loading ? <p className="text-xs text-gray-400 text-center py-10">Chargement...</p> : (
          <div className="flex flex-col gap-3">
            {quizzes.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-10">Aucun quiz créé pour le moment.</p>
            )}
            {quizzes.map(q => (
              <div key={q.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
                <div onClick={() => voirResultats(q.id)} className="cursor-pointer flex-1">
                  <p className="text-xs tracking-widest uppercase mb-1" style={{ color: COULEURS.or }}>{q.matiere}</p>
                  <p className="font-bold text-sm" style={{ color: COULEURS.navy }}>{q.titre}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {q.nb_questions} question(s) — {q.nb_tentatives} tentative(s){q.moyenne_pct !== null ? ` — moyenne ${q.moyenne_pct}%` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => voirResultats(q.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: `${COULEURS.bleu}1A`, color: COULEURS.bleu, border: `1px solid ${COULEURS.bleu}4D` }}>
                    Résultats
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                placeholder="Titre du quiz *" className="text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
              <input value={form.matiere} onChange={e => setForm(p => ({ ...p, matiere: e.target.value }))}
                placeholder="Matière *" className="text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
              <input value={form.niveau} onChange={e => setForm(p => ({ ...p, niveau: e.target.value }))}
                placeholder="Niveau (optionnel)" className="text-xs rounded-xl px-3 py-2 outline-none" style={{ background: '#f8f7f4', border: '1px solid #e8e4da' }} />
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
          </div>
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f0ece0' }}>
            <p className="font-bold text-sm mb-4" style={{ color: COULEURS.navy }}>Résultats des étudiants ({resultats.resultats.length})</p>
            {resultats.resultats.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Aucune tentative pour le moment</p>
            ) : (
              <div className="flex flex-col gap-2">
                {resultats.resultats.map((r, i) => {
                  const pct = (r.score / r.total) * 100
                  const couleur = pct >= 70 ? COULEURS.vert : pct >= 50 ? COULEURS.or : COULEURS.rose
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8f7f4' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: COULEURS.navy }}>
                        {r.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: COULEURS.navy }}>{r.prenom || r.username} {r.nom || ''}</p>
                        <p className="text-xs text-gray-400">{r.matricule}</p>
                      </div>
                      <span className="text-sm font-bold" style={{ color: couleur }}>{r.score}/{r.total}</span>
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