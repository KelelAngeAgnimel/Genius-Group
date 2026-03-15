export default function Contacts() {

  const equipe = [
    {
      nom: 'JEAN-LOIC AMON',
      poste: 'Responsable Pédagogique',
      description: 'Supervision de l\'ensemble du programme pédagogique et de la qualité des formations.',
      email: 'j.amon@geniusgroup.ci',
      telephone: '+225 05 64 77 33 70',
      couleur: '#C9A84C',
      // REMPLACE LA LIGNE CI-DESSOUS PAR LE CHEMIN DE LA PHOTO DE JEAN-LOIC AMON
      // Exemple : photo: '/photos/jean-loic-amon.jpg'
      photo: null,
    },
    {
      nom: 'JEAN-MARIE MICHEL ZAGO',
      poste: 'Coordinateur Concours',
      description: 'Coordination et organisation de tous les concours blancs et examens de préparation.',
      email: 'jm.zago@geniusgroup.ci',
      telephone: '+212 648-109513',
      couleur: '#4C7BC9',
      // REMPLACE LA LIGNE CI-DESSOUS PAR LE CHEMIN DE LA PHOTO DE JEAN-MARIE MICHEL ZAGO
      // Exemple : photo: '/photos/jean-marie-zago.jpg'
      photo:  '/photo/michel.jpeg',
    },
    {
      nom: 'KELEL ANGE AGNIMEL',
      poste: 'Support Technique',
      description: 'Gestion de la plateforme numérique et assistance technique aux étudiants et professeurs.',
      email: 'ka.agnimel@geniusgroup.ci',
      telephone: '+33 07 59 19 05 20',
      couleur: '#4CC9A8',
      // REMPLACE LA LIGNE CI-DESSOUS PAR LE CHEMIN DE LA PHOTO DE KELEL ANGE AGNIMEL
      // Exemple : photo: '/photos/kelel-ange-agnimel.jpg'
      photo: '/photo/kelel.png',
    },
  ]

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* EN-TETE */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#C9A84C' }}>
          Aides
        </p>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#071020' }}>
          Contacts et équipe
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Notre équipe est disponible pour vous accompagner
        </p>
      </div>

      {/* CARTES EQUIPE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {equipe.map((membre, i) => (
          <div key={i}
            className="bg-white rounded-2xl overflow-hidden"
            style={{
              border: '1px solid #f0ece0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
            }}>

            {/* Bande colorée + Photo */}
            <div className="relative"
              style={{
                background: 'linear-gradient(135deg, #071020, #0d1f3c)',
                borderBottom: `3px solid ${membre.couleur}`,
                padding: '24px 24px 0 24px'
              }}>
              <div className="flex justify-center pb-0">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 mb-0"
                  style={{
                    borderColor: membre.couleur,
                    background: `${membre.couleur}15`,
                    marginBottom: '-48px'
                  }}>
                  {membre.photo ? (
                    <img
                      src={membre.photo}
                      alt={membre.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* ZONE PHOTO — quand tu auras la photo remplace photo: null par photo: '/photos/nom.jpg' */
                    <span className="text-3xl font-bold" style={{ color: membre.couleur }}>
                      {membre.nom.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ height: '48px' }} />
            </div>

            {/* Infos */}
            <div className="p-5 pt-14 text-center">
              <h3 className="font-bold text-sm" style={{ color: '#071020' }}>{membre.nom}</h3>
              <p className="text-xs font-semibold mt-1 mb-3" style={{ color: membre.couleur }}>
                {membre.poste}
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                {membre.description}
              </p>

              {/* Contacts */}
              <div className="flex flex-col gap-2">
                <a href={`mailto:${membre.email}`}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition"
                  style={{
                    background: `${membre.couleur}10`,
                    color: membre.couleur,
                    border: `1px solid ${membre.couleur}25`
                  }}>
                  {membre.email}
                </a>
                <a href={`tel:${membre.telephone}`}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition"
                  style={{
                    background: 'rgba(7,16,32,0.05)',
                    color: '#071020',
                    border: '1px solid #f0ece0'
                  }}>
                  {membre.telephone}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORMULAIRE CONTACT */}
      <div className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #f0ece0' }}>
        <h2 className="font-bold text-base mb-1" style={{ color: '#071020' }}>
          Envoyer un message
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          Nous vous répondrons dans les plus brefs délais
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nom complet</label>
            <input
              type="text"
              placeholder="Votre nom"
              className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
              style={{ borderColor: '#f0ece0' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#f0ece0'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="Votre email"
              className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none transition"
              style={{ borderColor: '#f0ece0' }}
              onFocus={e => e.target.style.borderColor = '#C9A84C'}
              onBlur={e => e.target.style.borderColor = '#f0ece0'}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sujet</label>
          <select
            className="w-full border rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none"
            style={{ borderColor: '#f0ece0' }}>
            <option>Question pédagogique</option>
            <option>Problème technique</option>
            <option>Concours et inscriptions</option>
            <option>Autre</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
          <textarea
            rows={4}
            placeholder="Décrivez votre question ou problème..."
            className="w-full border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none transition"
            style={{ borderColor: '#f0ece0' }}
            onFocus={e => e.target.style.borderColor = '#C9A84C'}
            onBlur={e => e.target.style.borderColor = '#f0ece0'}
          />
        </div>

        <button
          className="px-6 py-3 rounded-xl text-sm font-bold tracking-widest transition"
          style={{
            background: 'linear-gradient(135deg, #071020, #0d1f3c)',
            color: '#C9A84C',
            border: '1px solid rgba(201,168,76,0.4)'
          }}>
          Envoyer le message
        </button>
      </div>

    </div>
  )
}