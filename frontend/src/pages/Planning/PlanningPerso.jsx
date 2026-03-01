export default function PlanningPerso() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">🤖 Planning personnalisé</h2>
      <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full mb-4 inline-block">IA</span>
      <p className="text-gray-500 text-sm mb-6">
        L'IA analyse ta progression et génère un planning de révision optimisé pour toi.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="font-bold text-green-800 mb-3">📌 Recommandations de cette semaine</h3>
        <ul className="flex flex-col gap-2 text-sm text-gray-700">
          {[
            '📘 Renforcer les Mathématiques : 3h supplémentaires conseillées',
            '🔬 Physique-Chimie : revoir la thermodynamique avant la session blanc',
            '🇬🇧 Anglais : niveau satisfaisant, maintenir 1h/semaine',
            '📝 Français : travailler la méthodologie de la dissertation',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}