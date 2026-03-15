import { useState } from 'react'

const sections = [
  {
    titre: 'Qui est Genius Group ?',
    couleur: '#C9A84C',
    contenu: [
      {
        sous_titre: 'Notre identité',
        texte: 'Genius Group est un établissement de préparation aux concours des grandes écoles de Côte d\'Ivoire. Fondé avec la conviction que chaque étudiant mérite un accompagnement d\'excellence, nous avons développé La Méthode Genius — une approche pédagogique rigoureuse, personnalisée et orientée résultats.'
      },
      {
        sous_titre: 'Notre mission',
        texte: 'Préparer les bacheliers aux concours d\'entrée des grandes écoles ivoiriennes, notamment l\'INP-HB (Institut National Polytechnique Félix Houphouët-Boigny) et l\'ESATIC (Ecole Supérieure Africaine des TIC), en leur offrant un encadrement académique de haut niveau.'
      },
      {
        sous_titre: 'Notre vision',
        texte: 'Devenir la référence en matière de préparation aux concours des grandes écoles en Afrique de l\'Ouest, en formant une génération de cadres compétents, rigoureux et engagés pour le développement de leur pays.'
      },
      {
        sous_titre: 'La Méthode Genius',
        texte: 'Notre méthode repose sur trois piliers fondamentaux : un enseignement de qualité dispensé par des professeurs expérimentés et spécialisés, un suivi personnalisé de la progression de chaque étudiant, et une préparation intensive aux épreuves avec des concours blancs réguliers. Nous croyons que la réussite ne s\'improvise pas — elle se prépare.'
      },
    ]
  },
  {
    titre: 'Les concours que nous préparons',
    couleur: '#4C7BC9',
    contenu: [
      {
        sous_titre: 'Concours INP-HB',
        texte: 'L\'Institut National Polytechnique Félix Houphouët-Boigny est la plus grande école d\'ingénieurs et de management de Côte d\'Ivoire. Genius Group prépare ses étudiants au concours d\'entrée niveau BAC/BT, qui comporte deux phases : une admissibilité sur dossier et une composition écrite en Culture Générale, Culture Scientifique et Anglais (3H30). L\'INP-HB regroupe 8 grandes écoles dont l\'EPGE, l\'ESI, l\'ESCAE, l\'ESTP, l\'ESAS, l\'ESMG, l\'ESCPE et l\'ESA.'
      },
      {
        sous_titre: 'Concours ESATIC',
        texte: 'L\'Ecole Supérieure Africaine des TIC est le pôle d\'excellence des technologies de l\'information et de la communication en Afrique. Genius Group prépare ses étudiants aux concours d\'entrée en Classes Préparatoires MP2I et en Licence 1 (SRIT, TWIN, ENTD). Les épreuves portent sur les Mathématiques, la Physique, l\'Anglais et le Français.'
      },
      {
        sous_titre: 'Les matières enseignées',
        texte: 'Pour l\'INP-HB : Culture Générale, Culture Scientifique, Culture Littéraire, Anglais. Pour l\'ESATIC : Mathématiques, Physique, Anglais, Français. Chaque matière est enseignée par un professeur spécialisé qui suit la progression individuelle de chaque étudiant.'
      },
    ]
  },
  {
    titre: 'Comment fonctionne ce portail ?',
    couleur: '#4CC9A8',
    contenu: [
      {
        sous_titre: 'Votre espace personnel',
        texte: 'Chaque étudiant dispose d\'un espace personnel sécurisé accessible via un identifiant et un mot de passe uniques fournis par l\'administration. Cet espace centralise toutes les informations relatives à votre parcours chez Genius Group : vos notes, votre planning, vos ressources pédagogiques et vos messages de vos professeurs.'
      },
      {
        sous_titre: 'La section Accueil',
        texte: 'Votre tableau de bord principal. Vous y trouvez un résumé de votre situation académique : votre progression par matière et par concours préparé, vos prochains cours et événements, vos messages non lus de vos professeurs, et un accès rapide aux sections importantes du portail.'
      },
      {
        sous_titre: 'La section Planning',
        texte: 'Votre organisation au quotidien. L\'emploi du temps affiche vos cours de la semaine mis à jour en temps réel par l\'administration. Le suivi de progression vous permet de visualiser votre avancement par concours (INP-HB ou ESATIC). Les sessions blancs vous informent des dates et sujets des concours d\'entraînement.'
      },
      {
        sous_titre: 'La section Ressources',
        texte: 'Votre bibliothèque pédagogique. Organisée par concours puis par matière, elle centralise tous vos supports de cours : fiches de révision, exercices corrigés, documents PDF et vidéos. Cliquez sur votre concours cible (INP-HB ou ESATIC), puis sur la matière souhaitée pour accéder aux modules de cours.'
      },
      {
        sous_titre: 'La section Aides',
        texte: 'Votre espace d\'accompagnement. Vous y trouvez la FAQ pour répondre aux questions fréquentes, les contacts de l\'équipe pédagogique pour vous joindre directement, les conseils d\'orientation avec toutes les informations officielles sur les concours INP-HB et ESATIC, la préparation mentale pour gérer le stress et optimiser vos révisions.'
      },
    ]
  },
  {
    titre: 'Votre équipe pédagogique',
    couleur: '#7B4CC9',
    contenu: [
      {
        sous_titre: 'JEAN-LOIC AMON — Responsable Pédagogique',
        texte: 'Il assure la supervision de l\'ensemble du programme pédagogique et veille à la qualité des formations dispensées. Il est votre interlocuteur principal pour toute question relative au contenu des cours et à l\'organisation pédagogique générale.'
      },
      {
        sous_titre: 'JEAN-MARIE MICHEL ZAGO — Coordinateur Concours',
        texte: 'Il coordonne et organise tous les concours blancs et examens de préparation. Il gère le calendrier des épreuves, la correction des copies et la publication des résultats. Il est votre référent pour tout ce qui concerne les simulations de concours.'
      },
      {
        sous_titre: 'KELEL ANGE AGNIMEL — Support Technique',
        texte: 'Il assure la gestion de la plateforme numérique et l\'assistance technique aux étudiants et professeurs. Si vous rencontrez un problème de connexion, d\'accès à votre espace ou à vos ressources, il est l\'interlocuteur à contacter en premier.'
      },
      {
        sous_titre: 'Comment contacter l\'équipe',
        texte: 'Vous pouvez joindre l\'équipe directement depuis la section Aides > Contacts. Un formulaire de contact est disponible pour envoyer un message. Vous recevrez une réponse dans les meilleurs délais via votre boîte de réception pédagogique sur votre tableau de bord.'
      },
    ]
  },
  {
    titre: 'Conseils pour bien utiliser le portail',
    couleur: '#C94C7B',
    contenu: [
      {
        sous_titre: 'Consultez votre tableau de bord chaque matin',
        texte: 'Prenez l\'habitude de vous connecter chaque matin pour vérifier votre emploi du temps, consulter vos nouveaux messages de professeurs et suivre votre progression. Une information consultée tôt est une information sur laquelle vous pouvez agir rapidement.'
      },
      {
        sous_titre: 'Suivez votre progression régulièrement',
        texte: 'Rendez-vous dans Planning > Suivi de progression pour visualiser votre avancement. Identifiez vos matières à renforcer et signalez-les à votre professeur. La section Accueil > Statistiques vous donne une vue détaillée de l\'évolution de vos notes mois par mois.'
      },
      {
        sous_titre: 'Utilisez les ressources disponibles',
        texte: 'Les ressources pédagogiques sont là pour vous. Ne vous contentez pas des cours en présentiel — explorez les fiches de révision, exercices corrigés et modules disponibles dans la section Ressources. Ils sont organisés spécifiquement selon votre concours cible.'
      },
      {
        sous_titre: 'Préparez-vous mentalement',
        texte: 'La réussite d\'un concours ne dépend pas uniquement du niveau académique. Visitez régulièrement la section Aides > Préparation mentale pour des conseils sur la gestion du stress, l\'organisation et la motivation. Un étudiant bien dans sa tête apprend mieux et plus vite.'
      },
      {
        sous_titre: 'En cas de difficulté',
        texte: 'Ne restez jamais seul face à un problème. Que ce soit une difficulté dans une matière, un problème technique sur le portail, ou simplement un moment de découragement, contactez immédiatement l\'équipe via la section Contacts. Nous sommes là pour vous accompagner jusqu\'à l\'admission.'
      },
    ]
  },
]

export default function Guide() {
  const [sectionActive, setSectionActive] = useState(0)
  const [itemOuvert, setItemOuvert] = useState(null)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Accueil
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Guide du portail
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Tout ce que vous devez savoir sur Genius Group et votre espace personnel
        </p>
      </div>

      {/* HERO */}
      <div className="rounded-2xl p-6 md:p-8 mb-6"
        style={{
          background: 'linear-gradient(135deg, #071020, #0d1f3c)',
          border: '1px solid rgba(201,168,76,0.2)'
        }}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <span className="text-4xl">🧠</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Bienvenue sur le Portail Genius Group
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ce guide vous explique qui nous sommes, ce que nous faisons, et comment tirer le meilleur parti de votre espace personnel pour maximiser vos chances de réussite aux concours.
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { valeur: '2', label: 'Concours préparés' },
            { valeur: '6', label: 'Matières enseignées' },
            { valeur: '3', label: 'Membres d\'équipe' },
            { valeur: '100%', label: 'Accompagnement personnalisé' },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.1)' }}>
              <p className="text-xl font-bold" style={{ color: '#C9A84C' }}>{s.valeur}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {sections.map((s, i) => (
          <button key={i}
            onClick={() => { setSectionActive(i); setItemOuvert(null) }}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex-shrink-0"
            style={{
              background: sectionActive === i ? '#071020' : 'white',
              color: sectionActive === i ? '#C9A84C' : '#6b7280',
              border: sectionActive === i ? `1px solid ${s.couleur}40` : '1px solid #f0ece0',
              borderBottom: sectionActive === i ? `2px solid ${s.couleur}` : '1px solid #f0ece0'
            }}>
            {s.titre}
          </button>
        ))}
      </div>

      {/* CONTENU */}
      {sections.map((section, si) => (
        si === sectionActive && (
          <div key={si}>

            {/* Header section */}
            <div className="bg-white rounded-2xl p-5 mb-4"
              style={{
                border: `1px solid ${section.couleur}20`,
                borderLeft: `4px solid ${section.couleur}`
              }}>
              <h2 className="font-bold text-base md:text-lg" style={{ color: '#071020' }}>
                {section.titre}
              </h2>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-3">
              {section.contenu.map((item, ii) => (
                <div key={ii}
                  className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    border: itemOuvert === ii ? `1px solid ${section.couleur}25` : '1px solid #f0ece0',
                    boxShadow: itemOuvert === ii ? `0 4px 20px ${section.couleur}08` : 'none'
                  }}>

                  <button
                    onClick={() => setItemOuvert(itemOuvert === ii ? null : ii)}
                    className="w-full flex items-center justify-between p-5 text-left">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: itemOuvert === ii ? `${section.couleur}15` : '#f8f7f4',
                        }}>
                        <div className="w-2 h-2 rounded-full"
                          style={{ background: itemOuvert === ii ? section.couleur : '#d1d5db' }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.sous_titre}</p>
                    </div>
                    <span className="text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full ml-3"
                      style={{
                        background: itemOuvert === ii ? `${section.couleur}15` : '#f0ece0',
                        color: itemOuvert === ii ? section.couleur : '#9ca3af'
                      }}>
                      {itemOuvert === ii ? '−' : '+'}
                    </span>
                  </button>

                  {itemOuvert === ii && (
                    <div className="px-5 pb-5">
                      <div className="ml-11 p-4 rounded-xl"
                        style={{ background: `${section.couleur}05`, border: `1px solid ${section.couleur}12` }}>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.texte}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => { setSectionActive(Math.max(0, si - 1)); setItemOuvert(null) }}
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
                onClick={() => { setSectionActive(Math.min(sections.length - 1, si + 1)); setItemOuvert(null) }}
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