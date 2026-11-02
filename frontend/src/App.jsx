import { lazy, Suspense } from 'react'
import Loader from './components/Loader'
const AccueilPublic = lazy(() => import('./pages/AccueilPublic'))
const Admin = lazy(() => import('./pages/admin/Admin'))
const GestionUtilisateurs = lazy(() => import('./pages/admin/GestionUtilisateurs'))
const CreerUtilisateur = lazy(() => import('./pages/admin/CreerUtilisateur'))
const GestionPlanning = lazy(() => import('./pages/admin/GestionPlanning'))
const EspaceProfesseur = lazy(() => import('./pages/professeur/EspaceProfesseur'))
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
const Accueil = lazy(() => import('./pages/Accueil'))
const Planning = lazy(() => import('./pages/Planning'))
const Ressources = lazy(() => import('./pages/Ressources'))
const Aides = lazy(() => import('./pages/Aides'))
const Outils = lazy(() => import('./pages/Outils'))
const TableauDeBord = lazy(() => import('./pages/accueil/TableauDeBord'))
const Actualites = lazy(() => import('./pages/accueil/Actualites'))
const Fiches = lazy(() => import('./pages/accueil/Fiches'))
const Guide = lazy(() => import('./pages/accueil/Guide'))
const Statistiques = lazy(() => import('./pages/accueil/Statistiques'))
const Calendrier = lazy(() => import('./pages/accueil/Calendrier'))
const Ecoles = lazy(() => import('./pages/accueil/Ecoles'))
const Tendances = lazy(() => import('./pages/accueil/Tendances'))
const EmploiDuTemps = lazy(() => import('./pages/Planning/EmploiDuTemps'))
const SuiviProgression = lazy(() => import('./pages/Planning/SuiviProgression'))
const PlanningPerso = lazy(() => import('./pages/Planning/PlanningPerso'))
const Meetings = lazy(() => import('./pages/meetings/Meetings'))
const PageNotes = lazy(() => import('./pages/notes/PageNotes'))
const Seances = lazy(() => import('./pages/professeur/Seances'))
const MesCompetences = lazy(() => import('./pages/competences/MesCompetences'))
const Difficultes = lazy(() => import('./pages/professeur/Difficultes'))
const GestionCompetences = lazy(() => import('./pages/admin/GestionCompetences'))
const VueGlobale = lazy(() => import('./pages/admin/VueGlobale'))
const GeniusEval = lazy(() => import('./pages/eval/GeniusEval'))
const Evaluations = lazy(() => import('./pages/eval/Evaluations'))
const EvaluationsEnsea = lazy(() => import('./pages/eval/EvaluationsEnsea'))
const FaqGenerale = lazy(() => import('./pages/aides/FaqGenerales'))
const FaqConcours = lazy(() => import('./pages/aides/FaqConcours'))
const Contacts = lazy(() => import('./pages/aides/Contacts'))
const Orientation = lazy(() => import('./pages/aides/Orientation'))
const PreparationMentale = lazy(() => import('./pages/aides/PreparationMentale'))
const Forum = lazy(() => import('./pages/aides/Forum'))
const Chatbot = lazy(() => import('./pages/aides/Chatbot'))
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader plein />}>
        <Routes>

        <Route path="/public" element={<AccueilPublic />} />
        <Route path="/" element={<Login />} />

        <Route path="/accueil" element={
          <ProtectedRoute><Layout><Accueil /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="tableau-de-bord" />} />
          <Route path="tableau-de-bord" element={<TableauDeBord />} />
          <Route path="actualites" element={<Actualites />} />
          <Route path="fiches" element={<Fiches />} />
          <Route path="guide" element={<Guide />} />
          <Route path="statistiques" element={<Statistiques />} />
          <Route path="calendrier" element={<Calendrier />} />
          <Route path="ecoles" element={<Ecoles />} />
          <Route path="tendances" element={<Tendances />} />
        </Route>

        <Route path="/planning" element={
          <ProtectedRoute><Layout><Planning /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="emploi-du-temps" />} />
          <Route path="emploi-du-temps" element={<EmploiDuTemps />} />
          <Route path="suivi-progression" element={<SuiviProgression />} />
          <Route path="planning-perso" element={<PlanningPerso />} />
        </Route>

        <Route path="/ressources" element={
          <ProtectedRoute><Layout><Ressources /></Layout></ProtectedRoute>
        } />

        <Route path="/outils" element={
          <ProtectedRoute><Layout><Outils /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="teams" />} />
          <Route path="teams" element={<Meetings />} />
          <Route path="notes" element={<PageNotes />} />
          <Route path="seances" element={<Seances />} />
          <Route path="competences" element={<MesCompetences />} />
          <Route path="difficultes" element={<Difficultes />} />
          <Route path="genius-eval" element={<GeniusEval />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="evaluations-ensea" element={<EvaluationsEnsea />} />
        </Route>

        <Route path="/aides" element={
          <ProtectedRoute><Layout><Aides /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="faq-generale" />} />
          <Route path="faq-generale" element={<FaqGenerale />} />
          <Route path="faq-concours" element={<FaqConcours />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="orientation" element={<Orientation />} />
          <Route path="preparation-mentale" element={<PreparationMentale />} />
          <Route path="forum" element={<Forum />} />
          <Route path="chatbot" element={<Chatbot />} />
        </Route>

        <Route path="/professeur" element={
          <ProtectedRoute roles={['professeur', 'admin']}>
            <Layout><EspaceProfesseur /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <Layout><Admin /></Layout>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="utilisateurs" />} />
          <Route path="utilisateurs" element={<GestionUtilisateurs />} />
          <Route path="creer" element={<CreerUtilisateur />} />
          <Route path="planning" element={<GestionPlanning />} />
          <Route path="competences" element={<GestionCompetences />} />
          <Route path="vue-globale" element={<VueGlobale />} />
        </Route>

      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}