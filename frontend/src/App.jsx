import AccueilPublic from './pages/AccueilPublic'
import Admin from './pages/admin/Admin'
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs'
import CreerUtilisateur from './pages/admin/CreerUtilisateur'
import GestionPlanning from './pages/admin/GestionPlanning'
import EspaceProfesseur from './pages/professeur/EspaceProfesseur'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Accueil from './pages/Accueil'
import Planning from './pages/Planning'
import Ressources from './pages/Ressources'
import Aides from './pages/Aides'
import Outils from './pages/Outils'
import TableauDeBord from './pages/accueil/TableauDeBord'
import Actualites from './pages/accueil/Actualites'
import Fiches from './pages/accueil/Fiches'
import Guide from './pages/accueil/Guide'
import Statistiques from './pages/accueil/Statistiques'
import Calendrier from './pages/accueil/Calendrier'
import Ecoles from './pages/accueil/Ecoles'
import Tendances from './pages/accueil/Tendances'
import EmploiDuTemps from './pages/Planning/EmploiDuTemps'
import SuiviProgression from './pages/Planning/SuiviProgression'
import PlanningPerso from './pages/Planning/PlanningPerso'
import Meetings from './pages/meetings/Meetings'
import MesNotes from './pages/notes/MesNotes'
import GeniusEval from './pages/eval/GeniusEval'
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
          <Route path="notes" element={<MesNotes />} />
          <Route path="genius-eval" element={<GeniusEval />} />
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
        </Route>

      </Routes>
    </BrowserRouter>
  )
}