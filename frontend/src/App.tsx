import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@components/layout/Layout";
import { Dashboard } from "@pages/admin/Dashboard/Dashboard";
import { EventsPage } from "@pages/admin/Events/EventsPage";
import { EventDetailPage } from "@pages/admin/Events/EventDetailPage";
import { EventCreatePage } from "@pages/admin/Events/EventCreatePage";
import { EventEditPage } from "@pages/admin/Events/EventEditPage";
import { ParticipantsPage } from "@pages/admin/Participants/ParticipantsPage";
import { ParticipantDetailPage } from "@pages/admin/Participants/ParticipantDetailPage";
import { Login } from "@pages/auth/Login";
import { SetPassword } from "@pages/auth/SetPassword";
import { PointagePage } from "@pages/public/PointagePage";
import { ConfirmationPage } from "@pages/public/ConfirmationPage";
import { SessionAttendancesPrintPage } from "@pages/admin/Attendances/SessionAttendancesPrintPage";
import { EventAttendancesPage } from "@pages/admin/Attendances/EventAttendancesPage";
import { EventAttendancesPrintPage } from "@pages/admin/Attendances/EventAttendancesPrintPage";
import { SessionQrDisplayPage } from "@pages/admin/Sessions/SessionQrDisplayPage";
import CertificatesPrintPage from "@pages/print/CertificatesPrintPage";
import { AdminUsersPage } from "@pages/admin/Admin/AdminUsersPage";
import { AdminSecurityPage } from "@pages/admin/Admin/AdminSecurityPage";
import { AdminSettingsPage } from "@pages/admin/Admin/AdminSettingsPage";
import { AdminAuditLogsPage } from "@pages/admin/Admin/AdminAuditLogsPage";
import { AccountPage } from "@pages/admin/Account/AccountPage";
import { ToastProvider } from "@components/common/Toast";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Public Routes */}
        <Route path="/pointage" element={<PointagePage />} />
        <Route path="/pointage/confirmation" element={<ConfirmationPage />} />

        {/* Admin Routes */}
        <Route
          path="/"
          element={
            <Layout title="Dashboard">
              <Dashboard />
            </Layout>
          }
        />

        {/* Events Routes */}
        <Route
          path="/events"
          element={
            <Layout title="Événements">
              <EventsPage />
            </Layout>
          }
        />

        <Route
          path="/events/new"
          element={
            <Layout title="Créer un événement">
              <EventCreatePage />
            </Layout>
          }
        />

        <Route
          path="/events/:id"
          element={
            <Layout title="Détail événement">
              <EventDetailPage />
            </Layout>
          }
        />

        <Route
          path="/events/:id/edit"
          element={
            <Layout title="Modifier l’événement">
              <EventEditPage />
            </Layout>
          }
        />
        <Route
          path="/events/:id/attendances"
          element={
            <Layout title="Présences événement">
              <EventAttendancesPage />
            </Layout>
          }
        />
        <Route
          path="/events/:id/attendances/print"
          element={<EventAttendancesPrintPage />}
        />
        <Route
          path="/sessions/:sessionId/qr-display"
          element={<SessionQrDisplayPage />}
        />

        {/* Participants Routes */}
        <Route
          path="/participants"
          element={
            <Layout title="Participants">
              <ParticipantsPage />
            </Layout>
          }
        />
        <Route
          path="/participants/:id"
          element={
            <Layout title="Fiche participant">
              <ParticipantDetailPage />
            </Layout>
          }
        />
        <Route
          path="/account"
          element={
            <Layout title="Mon compte">
              <AccountPage />
            </Layout>
          }
        />
        <Route
          path="/admin/users"
          element={
            <Layout title="Administration — Utilisateurs">
              <AdminUsersPage />
            </Layout>
          }
        />
        <Route
          path="/admin/security"
          element={
            <Layout title="Administration — Sécurité">
              <AdminSecurityPage />
            </Layout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <Layout title="Administration — Paramètres généraux">
              <AdminSettingsPage />
            </Layout>
          }
        />
        <Route
          path="/admin/audits"
          element={
            <Layout title="Administration — Logs & audits">
              <AdminAuditLogsPage />
            </Layout>
          }
        />
        <Route
          path="/sessions/:sessionId/attendances/print"
          element={<SessionAttendancesPrintPage />}
        />
        <Route
          path="/print/certificates/:eventId"
          element={<CertificatesPrintPage />}
        />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
