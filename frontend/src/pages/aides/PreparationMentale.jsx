import { useState } from 'react'

const sections = [
  {
    titre: 'Gestion du stress',
    couleur: '#C9A84C',
    description: 'Techniques éprouvées pour contrôler l\'anxiété avant et pendant les épreuves.',
    conseils: [
      { titre: 'Respiration profonde', detail: 'Pratiquez la technique 4-7-8 : inspirez 4 secondes, retenez 7 secondes, expirez 8 secondes. Répétez 3 à 5 fois avant une épreuve pour calmer le système nerveux.' },
      { titre: 'Méditation quotidienne', detail: '10 minutes de méditation par jour suffisent pour réduire significativement l\'anxiété. Utilisez des applications comme Headspace ou pratiquez simplement en vous concentrant sur votre respiration.' },
      { titre: 'Visualisation positive', detail: 'Avant chaque révision et avant de dormir, visualisez-vous réussir votre concours. Imaginez-vous lisant les questions, répondant avec assurance, et obtenant votre admission.' },
      { titre: 'Journalisation', detail: 'Notez vos angoisses sur papier chaque soir. Cette pratique aide à extérioriser les pensées négatives et à les mettre en perspective, libérant ainsi l\'espace mental pour l\'apprentissage.' },
    ]
  },
  {
    titre: 'Hygiène de vie',
    couleur: '#4C7BC9',
    description: 'Votre corps et votre cerveau sont intimement liés. Prenez soin de l\'un pour optimiser l\'autre.',
    conseils: [
      { titre: 'Sommeil réparateur', detail: 'Dormez minimum 7 à 8 heures par nuit. Le sommeil consolide la mémoire : les informations apprises la veille sont traitées et stockées durant la nuit. Évitez les écrans 1 heure avant de vous coucher.' },
      { titre: 'Activité physique régulière', detail: '30 minutes d\'activité physique 3 à 4 fois par semaine augmentent la concentration, réduisent le stress et améliorent la mémoire. La marche rapide, la natation ou le vélo sont excellents pour les périodes de révision.' },
      { titre: 'Alimentation équilibrée', detail: 'Privilégiez les protéines (œufs, légumineuses), les oméga-3 (poissons, noix) et les glucides complexes (riz complet, avoine). Évitez le sucre raffiné qui provoque des pics et des chutes d\'énergie. Hydratez-vous avec minimum 1,5 litre d\'eau par jour.' },
      { titre: 'Pauses régulières', detail: 'Appliquez la technique Pomodoro : 25 minutes de travail intense suivies de 5 minutes de pause. Toutes les 2 heures, faites une pause de 15 à 20 minutes. Les pauses ne sont pas une perte de temps, elles sont essentielles à la consolidation.' },
    ]
  },
  {
    titre: 'Organisation et méthode',
    couleur: '#4CC9A8',
    description: 'Une organisation rigoureuse réduit le sentiment de débordement et améliore la confiance en soi.',
    conseils: [
      { titre: 'Planning de révision réaliste', detail: 'Planifiez vos révisions semaine par semaine. Attribuez des créneaux spécifiques à chaque matière. Prévoyez des marges pour les imprévus. Un planning réaliste et respecté est plus efficace qu\'un planning ambitieux jamais suivi.' },
      { titre: 'Priorités et objectifs clairs', detail: 'Chaque matin, identifiez 3 objectifs prioritaires pour la journée. Concentrez-vous d\'abord sur les matières à renforcer. Notez vos progrès pour maintenir la motivation.' },
      { titre: 'Environnement de travail optimal', detail: 'Installez-vous dans un endroit calme, bien éclairé et rangé. Mettez votre téléphone en mode silencieux ou dans une autre pièce. Un environnement organisé favorise un esprit organisé.' },
      { titre: 'Revisions espacées', detail: 'Révisez une notion le lendemain de l\'apprentissage, puis 3 jours après, puis 1 semaine après, puis 1 mois après. Cette technique de répétition espacée est la plus efficace scientifiquement pour la mémorisation à long terme.' },
    ]
  },
  {
    titre: 'Confiance et motivation',
    couleur: '#7B4CC9',
    description: 'La réussite commence dans l\'esprit. Cultivez une mentalité de croissance et de persévérance.',
    conseils: [
      { titre: 'Célébrez vos petites victoires', detail: 'Chaque chapitre maîtrisé, chaque exercice réussi, chaque note en progression mérite d\'être reconnu. Tenez un journal de vos réussites pour vous rappeler de votre progression dans les moments difficiles.' },
      { titre: 'Entourage positif', detail: 'Fréquentez des camarades sérieux et motivés. Partagez vos doutes avec des personnes de confiance. Évitez les personnes qui minimisent vos efforts ou amplifient les difficultés du concours.' },
      { titre: 'Accepter l\'imperfection', detail: 'Vous n\'avez pas besoin de tout savoir parfaitement. Visez la progression, pas la perfection. Chaque erreur est une opportunité d\'apprentissage. L\'important est de comprendre et de progresser continuellement.' },
      { titre: 'Garder la perspective', detail: 'Le concours est une étape, pas une fin en soi. Rappelez-vous pourquoi vous avez choisi cette voie. Votre valeur en tant que personne ne dépend pas d\'un résultat de concours. Donnez le meilleur de vous-même et acceptez le résultat sereinement.' },
    ]
  },
  {
    titre: 'La veille et le jour J',
    couleur: '#C94C7B',
    description: 'Les 24 heures avant l\'épreuve sont cruciales. Préparez-vous intelligemment.',
    conseils: [
      { titre: 'La veille : pas de révision intense', detail: 'La veille d\'une épreuve, faites des révisions légères de synthèse uniquement. Préparez votre matériel dès la veille (pièce d\'identité, stylos, calculatrice). Couchez-vous à une heure normale.' },
      { titre: 'Repas et hydratation', detail: 'La veille et le matin de l\'épreuve, mangez léger mais nutritif. Évitez les aliments lourds, le café en excès et le sucre. Prenez un petit-déjeuner équilibré. Apportez de l\'eau en salle d\'examen si c\'est autorisé.' },
      { titre: 'Arrivée en avance', detail: 'Arrivez 30 minutes avant le début de l\'épreuve. Cela vous laisse le temps de vous installer, de vous calmer et de relire vos notes de synthèse. Le stress de l\'arrivée tardive nuit gravement aux performances.' },
      { titre: 'Stratégie pendant l\'épreuve', detail: 'Lisez entièrement le sujet avant de commencer. Gérez votre temps : allouez un temps proportionnel à chaque partie. Ne restez pas bloqué sur une question, passez à la suivante. Réservez les 10 dernières minutes pour la relecture.' },
    ]
  },
]

export default function PreparationMentale() {
  const [sectionOuverte, setSectionOuverte] = useState(0)
  const [conseilOuvert, setConseilOuvert] = useState(null)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Aides
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Preparation mentale
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Guide complet pour aborder vos concours dans les meilleures conditions
        </p>
      </div>

      {/* CITATION */}
      <div className="rounded-2xl p-6 mb-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #071020, #0d1f3c)',
          border: '1px solid rgba(201,168,76,0.2)'
        }}>
        <div className="w-8 h-0.5 mx-auto mb-4" style={{ background: '#C9A84C' }} />
        <p className="text-white text-sm md:text-base font-medium leading-relaxed italic">
          "Le succes est la somme de petits efforts repetes jour apres jour."
        </p>
        <p className="text-xs mt-3 tracking-widest" style={{ color: 'rgba(201,168,76,0.6)' }}>
          — GENIUS GROUP
        </p>
        <div className="w-8 h-0.5 mx-auto mt-4" style={{ background: '#C9A84C' }} />
      </div>

      {/* NAVIGATION SECTIONS */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {sections.map((s, i) => (
          <button key={i}
            onClick={() => { setSectionOuverte(i); setConseilOuvert(null) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0"
            style={{
              background: sectionOuverte === i ? '#071020' : 'white',
              color: sectionOuverte === i ? '#C9A84C' : '#6b7280',
              border: sectionOuverte === i ? `1px solid ${s.couleur}40` : '1px solid #f0ece0',
              borderBottom: sectionOuverte === i ? `2px solid ${s.couleur}` : '1px solid #f0ece0'
            }}>
            {s.titre}
          </button>
        ))}
      </div>

      {/* CONTENU SECTION ACTIVE */}
      {sections.map((section, si) => (
        si === sectionOuverte && (
          <div key={si}>

            {/* Header section */}
            <div className="bg-white rounded-2xl p-5 mb-4"
              style={{
                border: `1px solid ${section.couleur}20`,
                borderLeft: `4px solid ${section.couleur}`
              }}>
              <h2 className="font-bold text-base md:text-lg mb-1" style={{ color: '#071020' }}>
                {section.titre}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">{section.description}</p>
            </div>

            {/* Conseils */}
            <div className="flex flex-col gap-3">
              {section.conseils.map((conseil, ci) => (
                <div key={ci}
                  className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    border: conseilOuvert === ci ? `1px solid ${section.couleur}30` : '1px solid #f0ece0',
                    boxShadow: conseilOuvert === ci ? `0 4px 20px ${section.couleur}10` : 'none'
                  }}>

                  <button
                    onClick={() => setConseilOuvert(conseilOuvert === ci ? null : ci)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: conseilOuvert === ci ? `${section.couleur}15` : '#f8f7f4',
                        }}>
                        <span className="text-xs font-bold"
                          style={{ color: conseilOuvert === ci ? section.couleur : '#9ca3af' }}>
                          {ci + 1}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{conseil.titre}</p>
                    </div>
                    <span className="text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full ml-3"
                      style={{
                        background: conseilOuvert === ci ? `${section.couleur}15` : '#f0ece0',
                        color: conseilOuvert === ci ? section.couleur : '#9ca3af'
                      }}>
                      {conseilOuvert === ci ? '−' : '+'}
                    </span>
                  </button>

                  {conseilOuvert === ci && (
                    <div className="px-5 pb-5">
                      <div className="ml-11 p-4 rounded-xl"
                        style={{ background: `${section.couleur}06`, border: `1px solid ${section.couleur}15` }}>
                        <p className="text-sm text-gray-600 leading-relaxed">{conseil.detail}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation bas */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => { setSectionOuverte(Math.max(0, si - 1)); setConseilOuvert(null) }}
                disabled={si === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  background: si === 0 ? '#f0ece0' : 'white',
                  color: si === 0 ? '#d1d5db' : '#071020',
                  border: '1px solid #f0ece0'
                }}>
                Section precedente
              </button>
              <span className="text-xs text-gray-400">{si + 1} / {sections.length}</span>
              <button
                onClick={() => { setSectionOuverte(Math.min(sections.length - 1, si + 1)); setConseilOuvert(null) }}
                disabled={si === sections.length - 1}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition"
                style={{
                  background: si === sections.length - 1 ? '#f0ece0' : '#071020',
                  color: si === sections.length - 1 ? '#d1d5db' : '#C9A84C',
                  border: si === sections.length - 1 ? '1px solid #f0ece0' : '1px solid rgba(201,168,76,0.3)'
                }}>
                Section suivante
              </button>
            </div>
          </div>
        )
      ))}

    </div>
  )
}