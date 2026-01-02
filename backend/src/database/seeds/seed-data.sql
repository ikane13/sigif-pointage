-- ============================================
-- Données de test pour développement
-- ============================================

-- Utilisateurs administrateurs
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@sigif.gouv.sn', '$2b$10$rQJ5qZ5Y5ZxK5Z5Y5ZxK5O5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5u', 'Administrateur', 'Principal', 'admin'),
('organisateur@sigif.gouv.sn', '$2b$10$rQJ5qZ5Y5ZxK5Z5Y5ZxK5O5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5u', 'Mamadou', 'Diop', 'organizer'),
('viewer@sigif.gouv.sn', '$2b$10$rQJ5qZ5Y5ZxK5Z5Y5ZxK5O5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5Z5Y5ZxK5u', 'Fatou', 'Sall', 'viewer');

-- Événements de test
INSERT INTO events (title, event_type, description, start_date, end_date, location, organizer, status, qr_code_data, qr_code_secret, created_by)
SELECT 
    'Atelier SIGIF - Interfaces NINEA',
    'workshop',
    'Atelier de formation sur les interfaces avec le NINEA',
    '2025-12-15 09:00:00',
    '2025-12-15 17:00:00',
    'Salle de conférence DTAI - Bâtiment Financière',
    'Direction des Systèmes d''Information',
    'scheduled',
    'https://pointage.sigif.gouv.sn/e/A7KP2M?t=1734620400&s=abc123',
    'secret_hmac_key_12345',
id
FROM users WHERE email = 'admin@sigif.gouv.sn' LIMIT 1;

INSERT INTO events (title, event_type, description, start_date, end_date, location, organizer, status, qr_code_data, qr_code_secret, created_by)
SELECT
'Comité de Pilotage SIGIF Q4 2025',
'committee',
'Comité de pilotage trimestriel du projet SIGIF',
'2025-12-20 10:00:00',
'2025-12-20 13:00:00',
'Bureau du Directeur - Ministère des Finances',
'Secrétariat Général',
'scheduled',
'https://pointage.sigif.gouv.sn/e/B9LM5N?t=1735020400&s=def456',
'secret_hmac_key_67890',
id
FROM users WHERE email = 'organisateur@sigif.gouv.sn' LIMIT 1;

-- Participants de test
INSERT INTO participants (first_name, last_name, function, cni_number, origin_locality, email, phone, organization) VALUES
('Abdoulaye', 'Fall', 'Chef de Service Informatique', 'CNI1234567890', 'Dakar', 'afall@finances.gouv.sn', '+221 77 123 45 67', 'Direction Générale des Impôts'),
('Aïssatou', 'Ndiaye', 'Développeuse Full Stack', 'CNI0987654321', 'Thiès', 'andiaye@dtai.gouv.sn', '+221 76 987 65 43', 'DTAI - Ministère des Finances'),
('Cheikh', 'Sy', 'Consultant SIGIF', 'CNI1122334455', 'Saint-Louis', 'cheikh.sy@consulting.sn', '+221 70 112 23 34', 'Cabinet Conseil IT Sénégal'),
('Mariama', 'Ba', 'Responsable Formation', 'CNI5544332211', 'Ziguinchor', 'mba@finances.gouv.sn', '+221 78 554 43 32', 'Direction des Ressources Humaines');