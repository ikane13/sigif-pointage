import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { Dashboard } from '@pages/admin/Dashboard/Dashboard';
import { EventsPage } from '@pages/admin/Events/EventsPage';
import { EventDetailPage } from '@pages/admin/Events/EventDetailPage';
import { ParticipantsPage } from '@pages/admin/Participants/ParticipantsPage';
import { Login } from '@pages/auth/Login';
import { SetPassword } from '@pages/auth/SetPassword';
import { PointagePage } from '@pages/public/PointagePage';
import { ConfirmationPage } from '@pages/public/ConfirmationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Public Routes */}
        <Route path="/pointage" element={<PointagePage />} />
        <Route path="/pointage/confirmation" element={<ConfirmationPage />} />

        {/* Admin Routes */}
        <Route path="/" element={<Layout title="Dashboard"><Dashboard /></Layout>} />
        <Route path="/events" element={<Layout title="Événements"><EventsPage /></Layout>} />
        <Route path="/events/:id" element={<Layout title="Détail événement"><EventDetailPage /></Layout>} />
        <Route path="/participants" element={<Layout title="Participants"><ParticipantsPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;