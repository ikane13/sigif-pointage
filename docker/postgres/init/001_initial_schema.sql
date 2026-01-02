-- ============================================
-- SIGIF Pointage System - Initial Schema
-- PostgreSQL 15+
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour recherche fulltext français
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================
-- Table: USERS (Administrateurs)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_role CHECK (role IN ('admin', 'organizer', 'viewer'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Utilisateurs administrateurs du système';
COMMENT ON COLUMN users.role IS 'admin: tous droits | organizer: gestion événements | viewer: consultation seule';

-- ============================================
-- Table: PARTICIPANTS
-- ============================================
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    function VARCHAR(150),
    cni_number VARCHAR(50) UNIQUE,
    origin_locality VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(20),
    organization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-()]{8,20}$')
);

CREATE INDEX idx_participants_last_name ON participants(last_name);
CREATE INDEX idx_participants_first_name ON participants(first_name);
CREATE INDEX idx_participants_cni ON participants(cni_number) WHERE cni_number IS NOT NULL;
CREATE INDEX idx_participants_email ON participants(email) WHERE email IS NOT NULL;
CREATE INDEX idx_participants_organization ON participants(organization) WHERE organization IS NOT NULL;

-- Index fulltext pour recherche
CREATE INDEX idx_participants_fulltext ON participants 
    USING gin(to_tsvector('french', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(organization, '')
    ));

COMMENT ON TABLE participants IS 'Profils des participants aux événements SIGIF';
COMMENT ON COLUMN participants.cni_number IS 'Numéro de Carte Nationale d''Identité (unique)';

-- ============================================
-- Table: EVENTS
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    organizer VARCHAR(150),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    qr_code_data TEXT NOT NULL,
    qr_code_secret VARCHAR(255) NOT NULL,
    qr_code_expires_at TIMESTAMP,
    additional_info JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_event_type CHECK (event_type IN ('workshop', 'meeting', 'committee', 'training', 'seminar', 'other')),
    CONSTRAINT chk_status CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_events_start_date ON events(start_date DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_events_fulltext ON events 
    USING gin(to_tsvector('french', 
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(location, '')
    ));

COMMENT ON TABLE events IS 'Événements (réunions, ateliers, formations, comités)';
COMMENT ON COLUMN events.qr_code_secret IS 'Secret HMAC pour validation des QR codes';
COMMENT ON COLUMN events.additional_info IS 'Métadonnées supplémentaires au format JSON';

-- ============================================
-- Table: ATTENDANCES (Présences)
-- ============================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_in_mode VARCHAR(50) NOT NULL DEFAULT 'qr_code',
    signature_data TEXT,
    signature_format VARCHAR(20) DEFAULT 'png',
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_check_in_mode CHECK (check_in_mode IN ('qr_code', 'manual', 'import')),
    CONSTRAINT chk_signature_format CHECK (signature_format IN ('png', 'jpg', 'svg', 'base64')),
    CONSTRAINT uniq_attendance_event_participant UNIQUE (event_id, participant_id)
);

CREATE INDEX idx_attendances_event ON attendances(event_id);
CREATE INDEX idx_attendances_participant ON attendances(participant_id);
CREATE INDEX idx_attendances_check_in_time ON attendances(check_in_time DESC);
CREATE INDEX idx_attendances_event_time ON attendances(event_id, check_in_time DESC);

COMMENT ON TABLE attendances IS 'Enregistrements de présence avec signatures numériques';
COMMENT ON COLUMN attendances.signature_data IS 'Signature encodée en base64 (format PNG/JPG)';
COMMENT ON CONSTRAINT uniq_attendance_event_participant ON attendances IS 'Un participant ne peut pointer qu''une seule fois par événement';

-- ============================================
-- Table: AUDIT_LOGS
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_entity_type CHECK (entity_type IN ('user', 'event', 'participant', 'attendance'))
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Journal d''audit pour traçabilité complète des actions';

-- ============================================
-- Triggers pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Vues pour statistiques
-- ============================================

-- Vue: Statistiques par événement
CREATE OR REPLACE VIEW event_statistics AS
SELECT 
    e.id AS event_id,
    e.title,
    e.event_type,
    e.start_date,
    e.location,
    e.status,
    COUNT(DISTINCT a.participant_id) AS total_participants,
    COUNT(DISTINCT CASE WHEN a.signature_data IS NOT NULL THEN a.participant_id END) AS signed_participants,
    COUNT(DISTINCT CASE WHEN a.signature_data IS NULL THEN a.participant_id END) AS unsigned_participants,
    MIN(a.check_in_time) AS first_check_in,
    MAX(a.check_in_time) AS last_check_in,
    ROUND(
        (COUNT(DISTINCT CASE WHEN a.signature_data IS NOT NULL THEN a.participant_id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT a.participant_id), 0) * 100), 2
    ) AS signature_rate
FROM events e
LEFT JOIN attendances a ON e.id = a.event_id
GROUP BY e.id, e.title, e.event_type, e.start_date, e.location, e.status;

COMMENT ON VIEW event_statistics IS 'Statistiques temps réel par événement';

-- Vue: Statistiques par organisation
CREATE OR REPLACE VIEW organization_statistics AS
SELECT 
    p.organization,
    COUNT(DISTINCT p.id) AS total_participants,
    COUNT(DISTINCT a.event_id) AS events_attended,
    COUNT(DISTINCT a.id) AS total_attendances,
    MAX(a.check_in_time) AS last_attendance_date,
    ARRAY_AGG(DISTINCT e.event_type) FILTER (WHERE e.event_type IS NOT NULL) AS event_types_attended
FROM participants p
LEFT JOIN attendances a ON p.id = a.participant_id
LEFT JOIN events e ON a.event_id = e.id
WHERE p.organization IS NOT NULL
GROUP BY p.organization
ORDER BY total_participants DESC;

COMMENT ON VIEW organization_statistics IS 'Statistiques de participation par organisation';

-- Vue: Dashboard global
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM events WHERE status = 'scheduled') AS upcoming_events,
    (SELECT COUNT(*) FROM events WHERE status = 'ongoing') AS ongoing_events,
    (SELECT COUNT(*) FROM events WHERE status = 'completed') AS completed_events,
    (SELECT COUNT(DISTINCT id) FROM participants) AS total_participants,
    (SELECT COUNT(*) FROM attendances WHERE DATE(check_in_time) = CURRENT_DATE) AS today_check_ins,
    (SELECT COUNT(*) FROM attendances WHERE DATE(check_in_time) >= CURRENT_DATE - INTERVAL '7 days') AS week_check_ins,
    (SELECT COUNT(*) FROM attendances WHERE DATE(check_in_time) >= CURRENT_DATE - INTERVAL '30 days') AS month_check_ins;

COMMENT ON VIEW dashboard_summary IS 'Résumé global pour le tableau de bord administrateur';