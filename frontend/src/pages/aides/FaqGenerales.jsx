import { useState } from 'react'

const faqs = [
  {
    categorie: 'Général',
    questions: [
      { q: 'Comment acceder a mes ressources de cours ?', r: 'Rendez-vous dans la section Ressources depuis le menu principal. Vous y trouverez tous vos cours classés par concours et par matière.' },
      { q: 'Comment changer mon mot de passe ?', r: 'Contactez votre administrateur via la section Contacts. Il vous transmettra un nouveau mot de passe.' },
      { q: 'Les donnees sont-elles sauvegardees ?', r: 'Oui, toutes vos données sont sauvegardées automatiquement et sécurisées sur nos serveurs.' },
      { q: 'Comment suivre ma progression ?', r: 'Rendez-vous dans Planning puis Suivi de progression. Vous y trouverez votre progression détaillée par concours et par matière.' },
    ]
  },
  {
    categorie: 'Concours',
    questions: [
      { q: 'Quels concours sont prepares par Genius Group ?', r: 'Genius Group prépare actuellement aux concours de l\'INP-HB et de l\'ESATIC, deux grandes écoles de référence en Côte d\'Ivoire.' },
      { q: 'Comment consulter mon emploi du temps ?', r: 'Allez dans Planning puis Emploi du temps. Votre planning est mis à jour en temps réel par l\'administration.' },
      { q: 'Comment acceder aux sessions de concours blancs ?', r: 'Dans la section Planning, cliquez sur Sessions blanc pour consulter les dates et accéder aux sujets.' },
      { q: 'Comment contacter mon professeur ?', r: 'Utilisez la boite de réception pédagogique sur votre tableau de bord ou contactez l\'administration via la section Contacts.' },
    ]
  },
  {
    categorie: 'Technique',
    questions: [
      { q: 'Le site ne s\'affiche pas correctement sur mon telephone ?', r: 'Le portail est optimisé pour tous les écrans. Si le problème persiste, essayez de vider le cache de votre navigateur ou utilisez Chrome.' },
      { q: 'Je n\'arrive pas a me connecter ?', r: 'Vérifiez votre identifiant et mot de passe. Si le problème persiste, contactez l\'administrateur pour réinitialiser vos accès.' },
      { q: 'Comment telecharger mes fiches de revision ?', r: 'Dans la section Ressources, accédez à la matière souhaitée puis cliquez sur le module correspondant pour télécharger les documents.' },
    ]
  },
]

export default function FaqGenerales() {
  const [ouvert, setOuvert] = useState(null)
  const [categorieActive, setCategorieActive] = useState('Général')

  const faqActive = faqs.find(f => f.categorie === categorieActive)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Aides
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          FAQ
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Retrouvez les réponses aux questions les plus fréquentes
        </p>
      </div>

      {/* ONGLETS CATEGORIES */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {faqs.map((f, i) => (
          <button
            key={i}
            onClick={() => { setCategorieActive(f.categorie); setOuvert(null) }}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition"
            style={{
              background: categorieActive === f.categorie ? '#071020' : 'white',
              color: categorieActive === f.categorie ? '#C9A84C' : '#6b7280',
              border: categorieActive === f.categorie ? '1px solid rgba(201,168,76,0.4)' : '1px solid #f0ece0'
            }}>
            {f.categorie}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs"
              style={{
                background: categorieActive === f.categorie ? 'rgba(201,168,76,0.2)' : '#f0ece0',
                color: categorieActive === f.categorie ? '#C9A84C' : '#9ca3af'
              }}>
              {f.questions.length}
            </span>
          </button>
        ))}
      </div>

      {/* QUESTIONS */}
      <div className="flex flex-col gap-3">
        {faqActive?.questions.map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              border: ouvert === i ? '1px solid rgba(201,168,76,0.3)' : '1px solid #f0ece0',
              boxShadow: ouvert === i ? '0 4px 20px rgba(201,168,76,0.08)' : 'none'
            }}>

            <button
              onClick={() => setOuvert(ouvert === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
              style={{ gap: '16px' }}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: ouvert === i ? 'rgba(201,168,76,0.15)' : '#f8f7f4',
                    color: ouvert === i ? '#C9A84C' : '#9ca3af'
                  }}>
                  Q
                </div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">{item.q}</p>
              </div>
              <span className="text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full"
                style={{
                  background: ouvert === i ? 'rgba(201,168,76,0.15)' : '#f0ece0',
                  color: ouvert === i ? '#C9A84C' : '#9ca3af'
                }}>
                {ouvert === i ? '−' : '+'}
              </span>
            </button>

            {ouvert === i && (
              <div className="px-5 pb-5">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(76,123,201,0.1)', color: '#4C7BC9' }}>
                    R
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed pt-1">{item.r}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <div className="mt-8 rounded-2xl p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #071020, #0d1f3c)',
          border: '1px solid rgba(201,168,76,0.2)'
        }}>
        <p className="text-white font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</p>
        <p className="text-gray-400 text-sm mb-4">Contactez directement notre équipe pédagogique</p>
        <button
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #8B6914)',
            color: '#071020'
          }}>
          Contacter l'équipe
        </button>
      </div>

    </div>
  )
}