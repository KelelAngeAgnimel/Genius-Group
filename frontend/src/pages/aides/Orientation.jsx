import { useState } from 'react'

const ecoles = [
  {
    sigle: 'INP-HB',
    nom: 'Institut National Polytechnique Félix Houphouët-Boigny',
    logo: 'https://inphb.edu.ci/wp-content/uploads/2020/03/INPHB.png',
    couleur: '#C9A84C',
    site: 'https://inphb.ci',
    contact: {
      telephone: '27 30 64 66 99 / 05 05 55 01 55 / 07 58 66 18 66',
      whatsapp: '+225 05 01 80 00 48',
      site: 'www.inphb.ci',
      depot: 'INP-HB Centre, Yamoussoukro'
    },
    presentation: 'L\'entrée à l\'INP-HB est ouverte aux nouveaux bacheliers et BT de l\'année en cours et se fait uniquement par voie de concours. Il existe deux types de concours : le Concours cycle court (Techniciens Supérieurs Spécialisés) et le Concours cycle long (Classes Préparatoires).',
    selection: [
      { titre: 'Phase d\'admissibilité', description: 'Etude des dossiers à l\'issue de laquelle les meilleurs dossiers par série et par filière (environ 1500 dossiers) sont retenus.' },
      { titre: 'Phase d\'admission', description: 'Test écrit composé de 3 épreuves : Culture Générale, Culture Scientifique et Anglais. Durée totale : 3H30. Les meilleurs candidats satisfaisant les besoins des 8 grandes écoles sont définitivement retenus.' },
    ],
    dossier: [
      'Photocopies des bulletins des 3 trimestres des classes de 2nde, 1ère et Terminale',
      'Photocopie du relevé des notes et attestation de réussite au BAC (ou BT)',
      'Photocopie de la Carte Nationale d\'Identité ou attestation d\'identité ou carte scolaire',
      'Deux (02) exemplaires de l\'imprimé de la préinscription en ligne',
      'Quittance de droit d\'inscription : 15 000 FCFA par concours (TresorPay)',
      'Frais de dossier : 3 000 FCFA (un seul dossier quel que soit le nombre de concours)',
      'Frais de photo : 1 000 FCFA payables par TresorPay (photo prise au dépôt)',
    ],
    chronogramme: [
      { phase: '1', date: 'Du 03/07 au 23/07', activite: 'Pré-inscriptions', detail: 'Préinscription en ligne sur www.inphb.ci' },
      { phase: '2', date: 'Du 12/07 au 27/07', activite: 'Dépôt des dossiers physiques', detail: 'Vérification des éléments du dossier et validation du dépôt en ligne' },
      { phase: '3', date: '06/08', activite: 'Jury d\'admissibilité (1er tour)', detail: 'Proclamation des résultats : affichage et mise en ligne sur inphb.ci' },
      { phase: '4', date: '09/08', activite: 'Composition (épreuves)', detail: 'Anglais, Culture Scientifique, Culture Générale — Durée : 3H30' },
      { phase: '5', date: '16/08', activite: 'Jury d\'admission', detail: 'Affectation des admis' },
      { phase: '6', date: '16/08', activite: 'Résultat définitif', detail: 'Proclamation des résultats : affichage et mise en ligne sur inphb.ci' },
    ],
    filieres: [
      {
        ecole: 'EPGE — Ecole Préparatoire aux Grandes Ecoles',
        couleur: '#C9A84C',
        parcours: [
          { sigle: 'BCPST', nom: 'Biologie, Chimie, Physique et Sciences de la Terre', series: 'C, D' },
          { sigle: 'ECG', nom: 'Economique et Commerciale Générale', series: 'A1, B, C, D' },
          { sigle: 'PCSI', nom: 'Physique, Chimie et Sciences Industrielles', series: 'C, D, E' },
          { sigle: 'MPSI', nom: 'Mathématiques, Physique et Sciences Industrielles', series: 'C, E' },
        ]
      },
      {
        ecole: 'ESCAE — Ecole Supérieure de Commerce et d\'Administration des Entreprises',
        couleur: '#4C7BC9',
        parcours: [
          { sigle: 'GAE', nom: 'Gestion et Administration des Entreprises (GMC, GRH, GSC)', series: 'A1, A2, B, C, D' },
          { sigle: 'FCA', nom: 'Finance, Comptabilité et Assurance (CCA, BFA)', series: 'B, C, D, G2, BTCOMPTA' },
        ]
      },
      {
        ecole: 'ESI — Ecole Supérieure d\'Industrie',
        couleur: '#4CC9A8',
        parcours: [
          { sigle: 'STIC', nom: 'Sciences et Technologies de l\'Information et de la Communication (EIT, INFO)', series: 'C, D, F2, BTSTIC' },
          { sigle: 'STGI', nom: 'Sciences et Technologies du Génie Industriel (EAI, PMSI, MBM, MA)', series: 'C, D, E, F1, F3, BTSTGI' },
        ]
      },
      {
        ecole: 'ESTP — Ecole Supérieure des Travaux Publics',
        couleur: '#C97B4C',
        parcours: [
          { sigle: 'GC', nom: 'Génie Civil (BU, RT, HE, GT)', series: 'C, D, E, F4, BTGC' },
        ]
      },
      {
        ecole: 'ESAS — Ecole Supérieure de l\'Aéronautique et du Spatial',
        couleur: '#7B4CC9',
        parcours: [
          { sigle: 'TSAERO', nom: 'Techniciens Supérieurs en Aéronautique', series: 'C, D, E, F1, F2, F3' },
        ]
      },
      {
        ecole: 'ESMG — Ecole Supérieure des Mines et de Géologie',
        couleur: '#C94C7B',
        parcours: [
          { sigle: 'MG', nom: 'Mines et Géologie (MINES, EEM)', series: 'C, D, E, BTMG' },
        ]
      },
      {
        ecole: 'ESCPE — Ecole Supérieure de Chimie, du Pétrole et de l\'Energie',
        couleur: '#C9A84C',
        parcours: [
          { sigle: 'PE', nom: 'Pétrole et Energie (PME)', series: 'C, D, E, BTPTR' },
          { sigle: 'CGP', nom: 'Chimie et Génie des Procédés (CI)', series: 'D, F7, BTCHIM' },
        ]
      },
      {
        ecole: 'ESA — Ecole Supérieure d\'Agronomie',
        couleur: '#4CC9A8',
        parcours: [
          { sigle: 'TSA', nom: 'Techniciens Supérieurs en Agronomie (STA, AGF, TA, AABB, IGE, CP, FT, CM, GOPA)', series: 'C, D' },
        ]
      },
    ]
  },
  {
    sigle: 'ESATIC',
    nom: 'Ecole Supérieure Africaine des TIC',
    logo: 'https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg',
    couleur: '#4C7BC9',
    site: 'https://esatic.ci',
    contact: {
      telephone: '(+225) 27 21 21 81 00 / 07 79 78 38 34 / 05 66 41 32 42',
      email: 'direction.esatic@esatic.edu.ci',
      site: 'www.esatic.ci',
      adresse: 'Zone 3 Treichville, Bd de Marseille - 18 BP 1501 Abidjan 18'
    },
    presentation: 'L\'ESATIC s\'engage à offrir des programmes de formation de qualité dans les TIC, adaptés aux exigences du marché. Les filières sont accessibles par voie de concours aux bacheliers des séries A, C, D, E et F2 de l\'année en cours, ainsi qu\'aux auditeurs ayant un niveau BAC+2, BAC+3 ou BAC+4 en TIC.',
    filieres: [
      {
        ecole: 'Classes Préparatoires aux Grandes Ecoles (CPGE)',
        couleur: '#C9A84C',
        parcours: [
          {
            sigle: 'MP2I',
            nom: 'Mathématique, Physique, Ingénierie et Informatique',
            series: 'C, D ou E',
            duree: '2 ans',
            conditions: 'BAC C et E : moyenne annuelle Maths et Physique-Chimie ≥ 12 et note BAC ≥ 12. BAC D : moyenne annuelle Maths et Physique-Chimie ≥ 14 et note BAC ≥ 14.',
            debouches: 'Concours cycle Ingénieur ESATIC, écoles d\'ingénieurs de Côte d\'Ivoire et internationales, Licence à l\'ESATIC.'
          }
        ]
      },
      {
        ecole: 'Licences (Concours d\'entrée Licence 1)',
        couleur: '#4C7BC9',
        parcours: [
          {
            sigle: 'SRIT',
            nom: 'Systèmes Réseaux Informatiques et Télécommunications',
            series: 'C, D, F2, E',
            duree: '3/5 ans — Grade Licence (BAC+3/5)',
            conditions: 'BAC scientifique C, D, F2, E. 22 ans max au 31 décembre. Moyenne pondérée Maths et Physique ≥ 10/20 (BAC C, E) ou 12/20 (BAC D, F2). Frais d\'inscription : 20 000 FCFA via TrésorPay.',
            debouches: 'Développeur d\'applications mobiles et web, Technicien supérieur en réseaux et systèmes, Assistant Ingénieur en Réseaux et Télécommunications, Technicien supérieur en maintenance logiciel et matériel pour les réseaux, Assistant Architecte de systèmes et réseaux.'
          },
          {
            sigle: 'CSIA',
            nom: 'Cybersécurité et Intelligence Artificielle',
            series: 'Après tronc commun SRIT',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'Valider la première année de tronc commun SRIT. Objectif : former des techniciens spécialisés dans la sécurité des systèmes d\'information et l\'intelligence artificielle.',
            debouches: 'Data Analyst, Intégrateur de solutions de sécurité, Analyste CyberSOC niveau 1, Administrateur base de données ou cybersécurité. Possibilité de poursuivre en Master (Informatique, CyberSécurité, Big Data, IOT).'
          },
          {
            sigle: 'SIGL',
            nom: 'Systèmes Informatiques et Génie Logiciel',
            series: 'Après tronc commun SRIT',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'Valider la première année de tronc commun SRIT. Former des professionnels aptes à développer des applications liées aux systèmes d\'information et bases de données.',
            debouches: 'Installer/configurer/maintenir un réseau informatique, Développeur d\'applications mobiles et web, Concepteur de bases de données, Créateur de sites web. Possibilité de poursuivre en Master.'
          },
          {
            sigle: 'RTEL',
            nom: 'Réseaux et Télécommunications',
            series: 'Après tronc commun SRIT',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'Valider la première année de tronc commun SRIT. Former des techniciens supérieurs opérationnels pour des projets professionnels dans les réseaux et Télécommunications.',
            debouches: 'Technicien supérieur en réseaux et systèmes, Assistant Ingénieur en Réseaux et Télécoms, Technicien supérieur en maintenance logiciel, Technicien sécurité réseaux, Technicien VoIP. Possibilité de poursuivre en Master.'
          },
          {
            sigle: 'TWIN',
            nom: 'Technologies du Web et Images Numériques',
            series: 'C, D, E',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'BAC scientifique C, D, E. 22 ans max. Moyenne pondérée Maths et Physique ≥ 10. Frais d\'inscription : 20 000 FCFA via TrésorPay.',
            debouches: 'Webmaster, Infographiste, Webmarketer, Webdesigner, Community manager, Chargé de e-commerce, Développeur d\'applications. Possibilité de poursuivre en Master.'
          },
          {
            sigle: 'ENTD',
            nom: 'Economie Numérique et Transformation Digitale',
            series: 'A, B, C, D, E, G2',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'BAC A, B, C, D, E et G2 avec résultats satisfaisants en Maths, Physique, Anglais et Français. 22 ans max. Frais d\'inscription : 20 000 FCFA via TrésorPay.',
            debouches: 'Analyste de la performance digitale, Responsable de la communication digitale, Community manager, Spécialiste en marketing digital, Responsable e-commerce, Chef publicité digitale. Possibilité de poursuivre en Master (FINTECH, Marketing Digital).'
          },
          {
            sigle: 'DASI',
            nom: 'Développement et Administration des Systèmes d\'Information',
            series: 'Voir conditions ESATIC',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'Concours d\'entrée Licence 1 ESATIC.',
            debouches: 'Développement et administration des systèmes d\'information.'
          },
          {
            sigle: 'I4SEI',
            nom: 'Ingénierie Informatique pour les Systèmes Embarqués et l\'IoT',
            series: 'Voir conditions ESATIC',
            duree: '3 ans — Grade Licence (BAC+3)',
            conditions: 'Concours d\'entrée Licence 1 ESATIC.',
            debouches: 'Ingénierie des systèmes embarqués et de l\'Internet des Objets (IoT).'
          },
        ]
      },
      {
        ecole: 'Masters',
        couleur: '#4CC9A8',
        parcours: [
          { sigle: 'INFO', nom: 'Master Informatique', series: 'BAC+3 minimum', duree: '2 ans', conditions: 'Licence ou équivalent en informatique.', debouches: 'Ingénieur développement, Architecte logiciel.' },
          { sigle: 'RTEL', nom: 'Master Réseaux et Télécommunications', series: 'BAC+3 minimum', duree: '2 ans', conditions: 'Licence ou équivalent en réseaux.', debouches: 'Ingénieur réseaux, Expert télécoms.' },
          { sigle: 'CSIA', nom: 'Master Cybersécurité et Intelligence Artificielle', series: 'BAC+3 minimum', duree: '2 ans', conditions: 'Licence ou équivalent en informatique/sécurité.', debouches: 'Expert cybersécurité, Data scientist.' },
          { sigle: 'FINTECH', nom: 'Master Finance et Technologies', series: 'BAC+3 minimum', duree: '2 ans', conditions: 'Licence en finance, informatique ou équivalent.', debouches: 'Spécialiste fintech, Analyste financier digital.' },
          { sigle: 'MDSI', nom: 'Master Management Digital et Systèmes d\'Information (Privé)', series: 'BAC+3 minimum', duree: '2 ans', conditions: 'Licence ou équivalent.', debouches: 'Manager digital, Chef de projet SI.' },
        ]
      },
    ]
  }

  ,
  {
    sigle: "CME",
    nom: "Concours des Meilleurs Etudiants",
    logo: "/cme-logo.png",
    couleur: "#4CC9A8",
    site: "#",
    contact: {
      telephone: "A completer",
      email: "A completer",
      site: "A completer",
      adresse: "A completer"
    },
    presentation: "Le Concours des Meilleurs Etudiants (CME) est un concours national destine aux bacheliers. Il evalue les candidats sur leur culture generale, scientifique, leur maitrise du francais et de l'anglais.",
    selection: [
      { titre: "Phase ecrite", description: "Epreuves de Culture Generale, Culture Scientifique, Francais et Anglais." },
      { titre: "Phase orale", description: "Entretien de motivation pour les candidats admissibles." },
    ],
    dossier: [
      "Photocopie du releve de notes et attestation de reussite au BAC",
      "Photocopie de la Carte Nationale d'Identite",
      "Lettre de motivation",
      "Frais d'inscription (montant a confirmer)",
    ],
    chronogramme: [
      { phase: "1", date: "A confirmer", activite: "Depot des dossiers", detail: "Inscription en ligne et depot des pieces" },
      { phase: "2", date: "A confirmer", activite: "Epreuves ecrites", detail: "Culture Generale, Culture Scientifique, Francais, Anglais" },
      { phase: "3", date: "A confirmer", activite: "Resultats", detail: "Proclamation des resultats en ligne" },
    ],
    filieres: [
      {
        ecole: "Formations accessibles via le CME",
        couleur: "#4CC9A8",
        parcours: [
          {
            sigle: "CME",
            nom: "Concours des Meilleurs Etudiants",
            series: "Toutes series",
            duree: "Variable selon la formation integree",
            conditions: "Etre titulaire du BAC de l'annee en cours. Remplir le dossier d'inscription dans les delais.",
            debouches: "Acces aux meilleures formations superieures selon les resultats obtenus au concours."
          },
        ]
      },
    ]
  }
]

export default function Orientation() {
  const [ecoleSelectionnee, setEcoleSelectionnee] = useState(null)
  const [onglet, setOnglet] = useState('filieres')
  const [filiereOuverte, setFiliereOuverte] = useState(null)
  const [parcourOuvert, setParcourOuvert] = useState(null)

  const ecoleActive = ecoles.find(e => e.sigle === ecoleSelectionnee)

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Aides
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Conseils d'orientation
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Informations officielles sur les concours INP-HB et ESATIC
        </p>

        {/* Fil d'ariane */}
        {ecoleActive && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <button onClick={() => setEcoleSelectionnee(null)}
              className="hover:underline" style={{ color: '#C9A84C' }}>
              Orientation
            </button>
            <span>/</span>
            <span className="text-gray-600">{ecoleActive.sigle}</span>
          </div>
        )}
      </div>

      {/* NIVEAU 1 — Choix de l'école */}
      {!ecoleSelectionnee && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ecoles.map((ecole, i) => (
            <div key={i}
              onClick={() => setEcoleSelectionnee(ecole.sigle)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                border: `2px solid ${ecole.couleur}40`,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>

              <div className="flex items-center justify-center py-14 px-8">
                <img src={ecole.logo} alt={ecole.sigle}
                  className="object-contain"
                  style={{ maxHeight: '130px', maxWidth: '240px' }}
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-size:48px;font-weight:bold;color:#C9A84C">${ecole.sigle}</span>`
                  }} />
              </div>

              <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ecole.couleur}, transparent)` }} />

              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{ecole.sigle}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ecole.nom}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                  style={{ background: `${ecole.couleur}20`, color: ecole.couleur }}>
                  Voir les infos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NIVEAU 2 — Détail de l'école */}
      {ecoleActive && (
        <div>
          <button onClick={() => setEcoleSelectionnee(null)}
            className="flex items-center gap-2 mb-6 text-xs font-semibold"
            style={{ color: '#C9A84C' }}>
            &lt; Retour
          </button>

          {/* Header */}
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #f0ece0' }}>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-5"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `2px solid ${ecoleActive.couleur}`
              }}>
              <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center p-2 flex-shrink-0">
                <img src={ecoleActive.logo} alt={ecoleActive.sigle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentNode.innerHTML = `<span style="font-weight:bold;color:#C9A84C;font-size:12px">${ecoleActive.sigle}</span>`
                  }} />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-white">{ecoleActive.sigle}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{ecoleActive.nom}</p>
                <a href={`https://${ecoleActive.contact.site}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold mt-1 inline-block"
                  style={{ color: ecoleActive.couleur }}>
                  {ecoleActive.contact.site}
                </a>
              </div>
            </div>

            {/* Onglets */}
            <div className="flex overflow-x-auto bg-white" style={{ borderBottom: '1px solid #f0ece0' }}>
              {[
                { key: 'filieres', label: 'Filières et formations' },
                { key: 'selection', label: 'Processus de sélection' },
                { key: 'dossier', label: 'Dossier de candidature' },
                { key: 'contact', label: 'Contact' },
              ].filter(o => {
                if (o.key === 'selection') return ecoleActive.sigle === 'INP-HB'
                if (o.key === 'dossier') return ecoleActive.sigle === 'INP-HB'
                return true
              }).map((o, i) => (
                <button key={i}
                  onClick={() => setOnglet(o.key)}
                  className="px-4 py-3 text-xs font-semibold whitespace-nowrap transition flex-shrink-0"
                  style={{
                    color: onglet === o.key ? ecoleActive.couleur : '#9ca3af',
                    borderBottom: onglet === o.key ? `2px solid ${ecoleActive.couleur}` : '2px solid transparent'
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contenu onglet Filières */}
          {onglet === 'filieres' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-2xl"
                style={{ border: '1px solid #f0ece0' }}>
                {ecoleActive.presentation}
              </p>

              {ecoleActive.filieres.map((filiere, fi) => (
                <div key={fi} className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: '1px solid #f0ece0' }}>

                  <button
                    onClick={() => setFiliereOuverte(filiereOuverte === fi ? null : fi)}
                    className="w-full flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: filiere.couleur }} />
                      <p className="font-bold text-sm text-left" style={{ color: '#071020' }}>{filiere.ecole}</p>
                    </div>
                    <span className="text-xs flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full"
                      style={{
                        background: filiereOuverte === fi ? `${filiere.couleur}15` : '#f0ece0',
                        color: filiereOuverte === fi ? filiere.couleur : '#9ca3af'
                      }}>
                      {filiereOuverte === fi ? '−' : '+'}
                    </span>
                  </button>

                  {filiereOuverte === fi && (
                    <div className="px-4 pb-4 flex flex-col gap-3"
                      style={{ borderTop: '1px solid #f8f7f4' }}>
                      {filiere.parcours.map((p, pi) => (
                        <div key={pi}
                          className="rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${filiere.couleur}20` }}>

                          <button
                            onClick={() => setParcourOuvert(parcourOuvert === `${fi}-${pi}` ? null : `${fi}-${pi}`)}
                            className="w-full flex items-center justify-between p-3"
                            style={{ background: `${filiere.couleur}06` }}>
                            <div className="text-left">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md mr-2"
                                style={{ background: `${filiere.couleur}15`, color: filiere.couleur }}>
                                {p.sigle}
                              </span>
                              <span className="text-xs font-semibold text-gray-700">{p.nom}</span>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {parcourOuvert === `${fi}-${pi}` ? '▲' : '▼'}
                            </span>
                          </button>

                          {parcourOuvert === `${fi}-${pi}` && (
                            <div className="p-4 flex flex-col gap-3" style={{ borderTop: `1px solid ${filiere.couleur}15` }}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl" style={{ background: '#f8f7f4' }}>
                                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: filiere.couleur }}>Séries autorisées</p>
                                  <p className="text-xs text-gray-600">{p.series}</p>
                                </div>
                                {p.duree && (
                                  <div className="p-3 rounded-xl" style={{ background: '#f8f7f4' }}>
                                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: filiere.couleur }}>Durée</p>
                                    <p className="text-xs text-gray-600">{p.duree}</p>
                                  </div>
                                )}
                              </div>
                              {p.conditions && (
                                <div className="p-3 rounded-xl" style={{ background: '#f8f7f4' }}>
                                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: filiere.couleur }}>Conditions d'accès</p>
                                  <p className="text-xs text-gray-600 leading-relaxed">{p.conditions}</p>
                                </div>
                              )}
                              {p.debouches && (
                                <div className="p-3 rounded-xl" style={{ background: '#f8f7f4' }}>
                                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: filiere.couleur }}>Débouchés</p>
                                  <p className="text-xs text-gray-600 leading-relaxed">{p.debouches}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Contenu onglet Sélection (INP-HB seulement) */}
          {onglet === 'selection' && ecoleActive.selection && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {ecoleActive.selection.map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5"
                    style={{ border: '1px solid #f0ece0' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: i === 0 ? '#C9A84C' : '#4C7BC9' }}>
                        {i + 1}
                      </div>
                      <h3 className="font-bold text-sm" style={{ color: '#071020' }}>{s.titre}</h3>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>

              {/* Chronogramme */}
              {ecoleActive.chronogramme && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
                  <h3 className="font-bold text-sm mb-4" style={{ color: '#071020' }}>
                    Chronogramme — Session 2024
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f0ece0' }}>
                          <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase tracking-widest">Phase</th>
                          <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase tracking-widest">Activité</th>
                          <th className="text-left py-2 font-semibold text-gray-400 uppercase tracking-widest hidden md:table-cell">Détail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ecoleActive.chronogramme.map((c, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f8f7f4' }}>
                            <td className="py-3 pr-3">
                              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', display: 'inline-flex' }}>
                                {c.phase}
                              </span>
                            </td>
                            <td className="py-3 pr-3 font-semibold text-gray-700 whitespace-nowrap">{c.date}</td>
                            <td className="py-3 pr-3 font-semibold" style={{ color: '#071020' }}>{c.activite}</td>
                            <td className="py-3 text-gray-500 hidden md:table-cell">{c.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenu onglet Dossier (INP-HB seulement) */}
          {onglet === 'dossier' && ecoleActive.dossier && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: '#071020' }}>
                Documents à fournir
              </h3>
              <div className="flex flex-col gap-2 mb-5">
                {ecoleActive.dossier.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(201,168,76,0.15)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C9A84C' }} />
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: '#C9A84C' }}>NB Important</p>
                <p className="text-xs text-gray-600">
                  Au dépôt du dossier physique de candidature, chaque document photocopié est reçu au vu de l'original.
                </p>
              </div>
            </div>
          )}

          {/* Contenu onglet Contact */}
          {onglet === 'contact' && (
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0ece0' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: '#071020' }}>
                Informations de contact
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Téléphone', value: ecoleActive.contact.telephone },
                  ecoleActive.contact.whatsapp && { label: 'WhatsApp', value: ecoleActive.contact.whatsapp },
                  ecoleActive.contact.email && { label: 'Email', value: ecoleActive.contact.email },
                  { label: 'Site web', value: ecoleActive.contact.site },
                  ecoleActive.contact.depot && { label: 'Dépôt des dossiers', value: ecoleActive.contact.depot },
                  ecoleActive.contact.adresse && { label: 'Adresse', value: ecoleActive.contact.adresse },
                ].filter(Boolean).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: '#f8f7f4', border: '1px solid #f0ece0' }}>
                    <p className="text-xs font-bold w-24 flex-shrink-0" style={{ color: ecoleActive.couleur }}>{c.label}</p>
                    <p className="text-xs text-gray-700">{c.value}</p>
                  </div>
                ))}
              </div>

              <a href={`https://${ecoleActive.contact.site}`} target="_blank" rel="noopener noreferrer"
                className="block mt-5 text-center py-3 rounded-xl text-xs font-bold tracking-widest transition"
                style={{
                  background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                  color: ecoleActive.couleur,
                  border: `1px solid ${ecoleActive.couleur}40`
                }}>
                Visiter le site officiel
              </a>
            </div>
          )}
        </div>
      )}

    </div>
  )
}