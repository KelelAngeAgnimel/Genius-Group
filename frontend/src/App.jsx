import AccueilPublic from './pages/AccueilPublic'
import Admin from './pages/admin/Admin'
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs'
import CreerUtilisateur from './pages/admin/CreerUtilisateur'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Accueil from './pages/Accueil'
import Planning from './pages/Planning'
import Ressources from './pages/Ressources'
import Aides from './pages/Aides'
import Actualites from './pages/accueil/Actualites'
import Fiches from './pages/accueil/Fiches'
import Calendrier from './pages/accueil/Calendrier'
import Ecoles from './pages/accueil/Ecoles'
import Statistiques from './pages/accueil/Statistiques'
import Guide from './pages/accueil/Guide'
import Tendances from './pages/accueil/Tendances'
import EmploiDuTemps from './pages/Planning/EmploiDuTemps'
import SuiviProgression from './pages/Planning/SuiviProgression'
import Rappels from './pages/Planning/Rappels'
import CalendrierRevisions from './pages/Planning/CalendrierRevisions'
import SessionsBlanc from './pages/Planning/SessionsBlanc'
import StatsTravail from './pages/Planning/StatsTravail'
import PlanningPerso from './pages/Planning/PlanningPerso'
import Mathematiques from './pages/ressources/Mathematiques'
import PhysiqueChimie from './pages/ressources/PhysiqueChimie'
import Anglais from './pages/ressources/Anglais'
import Francais from './pages/ressources/Francais'
import CoursVideo from './pages/ressources/CoursVideo'
import FichesRevision from './pages/ressources/FichesRevision'
import ExercicesCorriges from './pages/ressources/ExercicesCorriges'
import TuteurIA from './pages/ressources/TuteurIA'
import FaqGenerale from './pages/aides/FaqGenerales'
import FaqConcours from './pages/aides/FaqConcours'
import Contacts from './pages/aides/Contacts'
import Orientation from './pages/aides/Orientation'
import PreparationMentale from './pages/aides/PreparationMentale'
import Forum from './pages/aides/Forum'
import Chatbot from './pages/aides/Chatbot'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/public" element={<AccueilPublic />} />
        <Route path="/" element={<Login />} />

        <Route path="/accueil" element={
          <ProtectedRoute><Layout><Accueil /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="actualites" />} />
          <Route path="actualites" element={<Actualites />} />
          <Route path="fiches" element={<Fiches />} />
          <Route path="calendrier" element={<Calendrier />} />
          <Route path="ecoles" element={<Ecoles />} />
          <Route path="statistiques" element={<Statistiques />} />
          <Route path="guide" element={<Guide />} />
          <Route path="tendances" element={<Tendances />} />
        </Route>

        <Route path="/planning" element={
          <ProtectedRoute><Layout><Planning /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="emploi-du-temps" />} />
          <Route path="emploi-du-temps" element={<EmploiDuTemps />} />
          <Route path="suivi-progression" element={<SuiviProgression />} />
          <Route path="rappels" element={<Rappels />} />
          <Route path="calendrier-revisions" element={<CalendrierRevisions />} />
          <Route path="sessions-blanc" element={<SessionsBlanc />} />
          <Route path="stats-travail" element={<StatsTravail />} />
          <Route path="planning-perso" element={<PlanningPerso />} />
        </Route>

        <Route path="/ressources" element={
          <ProtectedRoute><Layout><Ressources /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="mathematiques" />} />
          <Route path="mathematiques" element={<Mathematiques />} />
          <Route path="physique-chimie" element={<PhysiqueChimie />} />
          <Route path="anglais" element={<Anglais />} />
          <Route path="francais" element={<Francais />} />
          <Route path="cours-video" element={<CoursVideo />} />
          <Route path="fiches-revision" element={<FichesRevision />} />
          <Route path="exercices-corriges" element={<ExercicesCorriges />} />
          <Route path="tuteur-ia" element={<TuteurIA />} />
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

        <Route path="/admin" element={
          <ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>
        }>
          <Route index element={<Navigate to="utilisateurs" />} />
          <Route path="utilisateurs" element={<GestionUtilisateurs />} />
          <Route path="creer" element={<CreerUtilisateur />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}