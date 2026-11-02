import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

// Tous les graphiques (recharts) dans un seul module : chargé à la demande via React.lazy
// pour ne pas alourdir le reste de l'application.

const OR = '#C9A84C'
const VIOLET = '#7B4CC9'

// Courbe d'évolution des notes d'une matière : points = [{ periode, note }]
export function CourbeNotes({ points, couleur = OR }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" />
        <XAxis dataKey="periode" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} tick={{ fontSize: 11 }} />
        <ReferenceLine y={10} stroke="#e5e7eb" strokeDasharray="4 4" />
        <Tooltip formatter={(v) => [`${v} / 20`, 'Note']} />
        <Line type="monotone" dataKey="note" stroke={couleur} strokeWidth={2.5} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Histogramme simple : data = [{ nom, valeur }], max = borne haute de l'axe
export function Histogramme({ data, max = 20, unite = '', couleur = VIOLET }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ece0" />
        <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, max]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${v}${unite}`, '']} />
        <Bar dataKey="valeur" fill={couleur} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Radar des compétences : data = [{ nom, score, seuil }] (score sur 100 ; seuil = limite de renforcement)
export function RadarCompetences({ data, couleur = VIOLET }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="nom" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar name="Seuil" dataKey="seuil" stroke="#C94C7B" strokeDasharray="4 4" fill="none" />
        <Radar name="Mon score" dataKey="score" stroke={couleur} fill={couleur} fillOpacity={0.35} />
        <Tooltip formatter={(v, nom) => [`${v} / 100`, nom]} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
