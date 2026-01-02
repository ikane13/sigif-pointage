-- ============================================
-- SIGIF Pointage - Données de test
-- Mot de passe pour tous les users: Admin@2025!
-- ============================================

-- node -e "const bcrypt=require('bcrypt'); bcrypt.hash("Admin@2025!", 10).then(console.log)"
-- UPDATE users
-- SET password_hash = '$2b$10$Jt9R8XbFq9Hj3ZkU0QqM0eV9qXn0yE5x7YvZrW0x1Cz5fNnX6Qw1a'
-- WHERE email = 'admin@sigif.gouv.sn';

-- Récupérer le token 
-- curl -s -X POST "http://localhost:3000/api/auth/login" \
--  -H "Content-Type: application/json" \
--  -d '{"email":"admin@sigif.gouv.sn","password":"Admin@2025!"}'



-- Utilisateurs administrateurs
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('admin@sigif.gouv.sn', '$2b$10$a.6iFHc2rjtH0jA37gw5Su99Wl8kpLqbsmmoPHuyvHNONA8MYxV5q', 'Administrateur', 'Principal', 'admin', true),
('mamadou.diop@sigif.gouv.sn', '$2b$10$a.6iFHc2rjtH0jA37gw5Su99Wl8kpLqbsmmoPHuyvHNONA8MYxV5q', 'Mamadou', 'Diop', 'organizer', true),
('fatou.sall@sigif.gouv.sn', '$2b$10$a.6iFHc2rjtH0jA37gw5Su99Wl8kpLqbsmmoPHuyvHNONA8MYxV5q', 'Fatou', 'Sall', 'viewer', true);

-- Événements de test
INSERT INTO events (title, event_type, description, start_date, end_date, location, organizer, status, qr_code_data, qr_code_secret, qr_code_expires_at, created_by)
SELECT 
    'Atelier SIGIF - Interfaces NINEA',
    'workshop',
    'Atelier de formation sur les interfaces avec le système NINEA pour l''automatisation des processus fiscaux',
    CURRENT_TIMESTAMP + INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '8 hours',
    'Salle de conférence DTAI - Bâtiment Financière, Dakar',
    'Direction des Systèmes d''Information',
    'scheduled',
    'https://pointage.sigif.gouv.sn/e/A7KP2M',
    'hmac_secret_workshop_ninea_2025',
    CURRENT_TIMESTAMP + INTERVAL '3 days',
    id
FROM users WHERE email = 'admin@sigif.gouv.sn' LIMIT 1;

INSERT INTO events (title, event_type, description, start_date, end_date, location, organizer, status, qr_code_data, qr_code_secret, qr_code_expires_at, created_by)
SELECT 
    'Comité de Pilotage SIGIF Q4 2025',
    'committee',
    'Comité de pilotage trimestriel du projet SIGIF - Bilan et perspectives',
    CURRENT_TIMESTAMP + INTERVAL '7 days',
    CURRENT_TIMESTAMP + INTERVAL '7 days' + INTERVAL '3 hours',
    'Bureau du Directeur - Ministère des Finances',
    'Secrétariat Général',
    'scheduled',
    'https://pointage.sigif.gouv.sn/e/B9LM5N',
    'hmac_secret_committee_q4_2025',
    CURRENT_TIMESTAMP + INTERVAL '8 days',
    id
FROM users WHERE email = 'mamadou.diop@sigif.gouv.sn' LIMIT 1;

INSERT INTO events (title, event_type, description, start_date, end_date, location, organizer, status, qr_code_data, qr_code_secret, qr_code_expires_at, created_by)
SELECT 
    'Formation Continue - Module Budgétaire SIGIF',
    'training',
    'Formation des nouveaux utilisateurs sur le module de gestion budgétaire',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '6 hours',
    'Centre de Formation DRH - Plateau',
    'Direction des Ressources Humaines',
    'completed',
    'https://pointage.sigif.gouv.sn/e/C3TN8P',
    'hmac_secret_training_budget_2025',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    id
FROM users WHERE email = 'mamadou.diop@sigif.gouv.sn' LIMIT 1;

-- Participants de test
INSERT INTO participants (first_name, last_name, function, cni_number, origin_locality, email, phone, organization) VALUES
('Abdoulaye', 'Fall', 'Chef de Service Informatique', 'CNI1234567890', 'Dakar', 'afall@finances.gouv.sn', '+221 77 123 45 67', 'Direction Générale des Impôts'),
('Aïssatou', 'Ndiaye', 'Développeuse Full Stack', 'CNI0987654321', 'Thiès', 'andiaye@dtai.gouv.sn', '+221 76 987 65 43', 'DTAI - Ministère des Finances'),
('Cheikh', 'Sy', 'Consultant SIGIF', 'CNI1122334455', 'Saint-Louis', 'cheikh.sy@consulting.sn', '+221 70 112 23 34', 'Cabinet Conseil IT Sénégal'),
('Mariama', 'Ba', 'Responsable Formation', 'CNI5544332211', 'Ziguinchor', 'mba@finances.gouv.sn', '+221 78 554 43 32', 'Direction des Ressources Humaines'),
('Ousmane', 'Diallo', 'Analyste Fonctionnel', 'CNI6677889900', 'Kaolack', 'odiallo@finances.gouv.sn', '+221 77 667 78 89', 'Direction du Budget'),
('Khady', 'Sarr', 'Chef de Projet SIGIF', 'CNI3344556677', 'Louga', 'ksarr@finances.gouv.sn', '+221 76 334 45 56', 'DTAI - Ministère des Finances');

-- Présences pour la formation passée (avec signatures simulées)
INSERT INTO attendances (event_id, participant_id, check_in_time, check_in_mode, signature_data, signature_format, ip_address, user_agent)
SELECT 
    e.id,
    p.id,
    e.start_date + INTERVAL '15 minutes',
    'qr_code',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'png',
    '41.82.156.10'::inet,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
FROM events e
CROSS JOIN participants p
WHERE e.title = 'Formation Continue - Module Budgétaire SIGIF'
AND p.last_name IN ('Fall', 'Ndiaye', 'Ba', 'Sarr')
LIMIT 4;

-- Log d'audit initial
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
SELECT 
    id,
    'SYSTEM_INIT',
    'user',
    id,
    jsonb_build_object('email', email, 'role', role),
    '127.0.0.1'::inet
FROM users;

-- Afficher un résumé
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Base de données SIGIF Pointage initialisée avec succès!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Utilisateurs créés: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Événements créés: %', (SELECT COUNT(*) FROM events);
    RAISE NOTICE 'Participants créés: %', (SELECT COUNT(*) FROM participants);
    RAISE NOTICE 'Présences enregistrées: %', (SELECT COUNT(*) FROM attendances);
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Comptes de test:';
    RAISE NOTICE '  - admin@sigif.gouv.sn (admin)';
    RAISE NOTICE '  - mamadou.diop@sigif.gouv.sn (organizer)';
    RAISE NOTICE '  - fatou.sall@sigif.gouv.sn (viewer)';
    RAISE NOTICE 'Mot de passe: Admin@2025!';
    RAISE NOTICE '========================================';
END $$;