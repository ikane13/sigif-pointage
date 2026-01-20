--
-- PostgreSQL database dump
--

\restrict rjhmdzL42Nrzq0aA8QQuKpTEzTN5geMeloFV9EtDp2dNr6YPVOBjS1NDPERBAcZ

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

-- Started on 2026-01-04 20:31:52 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 16396)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 3543 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3544 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 240 (class 1255 OID 16514)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: sigif_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO sigif_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16464)
-- Name: attendances; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    event_id uuid NOT NULL,
    participant_id uuid NOT NULL,
    check_in_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    check_in_mode character varying(50) DEFAULT 'qr_code'::character varying NOT NULL,
    signature_data text,
    signature_format character varying(20) DEFAULT 'png'::character varying,
    ip_address inet,
    user_agent text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_check_in_mode CHECK (((check_in_mode)::text = ANY ((ARRAY['qr_code'::character varying, 'manual'::character varying, 'import'::character varying])::text[]))),
    CONSTRAINT chk_signature_format CHECK (((signature_format)::text = ANY ((ARRAY['png'::character varying, 'jpg'::character varying, 'svg'::character varying, 'base64'::character varying])::text[])))
);


ALTER TABLE public.attendances OWNER TO sigif_user;

--
-- TOC entry 3545 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE attendances; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON TABLE public.attendances IS 'Enregistrements de présence avec signatures numériques';


--
-- TOC entry 3546 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN attendances.signature_data; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON COLUMN public.attendances.signature_data IS 'Signature encodée en base64 (format PNG/JPG)';


--
-- TOC entry 220 (class 1259 OID 16495)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_entity_type CHECK (((entity_type)::text = ANY ((ARRAY['user'::character varying, 'event'::character varying, 'participant'::character varying, 'attendance'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO sigif_user;

--
-- TOC entry 3547 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON TABLE public.audit_logs IS 'Journal d''audit pour traçabilité complète des actions';


--
-- TOC entry 218 (class 1259 OID 16440)
-- Name: events; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    event_type character varying(50) NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    location character varying(255),
    organizer character varying(150),
    status character varying(50) DEFAULT 'scheduled'::character varying NOT NULL,
    additional_info jsonb,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "qrToken" character varying(64),
    "qrGeneratedAt" timestamp without time zone,
    "qrScanCount" integer DEFAULT 0 NOT NULL,
    capacity integer,
    CONSTRAINT chk_dates CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT chk_event_type CHECK (((event_type)::text = ANY ((ARRAY['workshop'::character varying, 'meeting'::character varying, 'committee'::character varying, 'training'::character varying, 'seminar'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT chk_status CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'ongoing'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT events_capacity_positive CHECK (((capacity IS NULL) OR (capacity >= 1)))
);


ALTER TABLE public.events OWNER TO sigif_user;

--
-- TOC entry 3548 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON TABLE public.events IS 'Événements (réunions, ateliers, formations, comités)';


--
-- TOC entry 3549 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN events.additional_info; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON COLUMN public.events.additional_info IS 'Métadonnées supplémentaires au format JSON';


--
-- TOC entry 217 (class 1259 OID 16420)
-- Name: participants; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.participants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    function character varying(150),
    cni_number character varying(50),
    origin_locality character varying(150),
    email character varying(255),
    phone character varying(20),
    organization character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (((email IS NULL) OR ((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
    CONSTRAINT chk_phone_format CHECK (((phone IS NULL) OR ((phone)::text ~* '^\+?[0-9\s\-()]{8,20}$'::text)))
);


ALTER TABLE public.participants OWNER TO sigif_user;

--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 217
-- Name: TABLE participants; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON TABLE public.participants IS 'Profils des participants aux événements SIGIF';


--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN participants.cni_number; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON COLUMN public.participants.cni_number IS 'Numéro de Carte Nationale d''Identité (unique)';


--
-- TOC entry 223 (class 1259 OID 16529)
-- Name: dashboard_summary; Type: VIEW; Schema: public; Owner: sigif_user
--

CREATE VIEW public.dashboard_summary AS
 SELECT ( SELECT count(*) AS count
           FROM public.events
          WHERE ((events.status)::text = 'scheduled'::text)) AS upcoming_events,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE ((events.status)::text = 'ongoing'::text)) AS ongoing_events,
    ( SELECT count(*) AS count
           FROM public.events
          WHERE ((events.status)::text = 'completed'::text)) AS completed_events,
    ( SELECT count(DISTINCT participants.id) AS count
           FROM public.participants) AS total_participants,
    ( SELECT count(*) AS count
           FROM public.attendances
          WHERE (date(attendances.check_in_time) = CURRENT_DATE)) AS today_check_ins,
    ( SELECT count(*) AS count
           FROM public.attendances
          WHERE (date(attendances.check_in_time) >= (CURRENT_DATE - '7 days'::interval))) AS week_check_ins,
    ( SELECT count(*) AS count
           FROM public.attendances
          WHERE (date(attendances.check_in_time) >= (CURRENT_DATE - '30 days'::interval))) AS month_check_ins;


ALTER TABLE public.dashboard_summary OWNER TO sigif_user;

--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 223
-- Name: VIEW dashboard_summary; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON VIEW public.dashboard_summary IS 'Résumé global pour le tableau de bord administrateur';


--
-- TOC entry 221 (class 1259 OID 16519)
-- Name: event_statistics; Type: VIEW; Schema: public; Owner: sigif_user
--

CREATE VIEW public.event_statistics AS
 SELECT e.id AS event_id,
    e.title,
    e.event_type,
    e.start_date,
    e.location,
    e.status,
    count(DISTINCT a.participant_id) AS total_participants,
    count(DISTINCT
        CASE
            WHEN (a.signature_data IS NOT NULL) THEN a.participant_id
            ELSE NULL::uuid
        END) AS signed_participants,
    count(DISTINCT
        CASE
            WHEN (a.signature_data IS NULL) THEN a.participant_id
            ELSE NULL::uuid
        END) AS unsigned_participants,
    min(a.check_in_time) AS first_check_in,
    max(a.check_in_time) AS last_check_in,
    round((((count(DISTINCT
        CASE
            WHEN (a.signature_data IS NOT NULL) THEN a.participant_id
            ELSE NULL::uuid
        END))::numeric / (NULLIF(count(DISTINCT a.participant_id), 0))::numeric) * (100)::numeric), 2) AS signature_rate
   FROM (public.events e
     LEFT JOIN public.attendances a ON ((e.id = a.event_id)))
  GROUP BY e.id, e.title, e.event_type, e.start_date, e.location, e.status;


ALTER TABLE public.event_statistics OWNER TO sigif_user;

--
-- TOC entry 3553 (class 0 OID 0)
-- Dependencies: 221
-- Name: VIEW event_statistics; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON VIEW public.event_statistics IS 'Statistiques temps réel par événement';


--
-- TOC entry 225 (class 1259 OID 24997)
-- Name: migrations; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO sigif_user;

--
-- TOC entry 224 (class 1259 OID 24996)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: sigif_user
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO sigif_user;

--
-- TOC entry 3554 (class 0 OID 0)
-- Dependencies: 224
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sigif_user
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 222 (class 1259 OID 16524)
-- Name: organization_statistics; Type: VIEW; Schema: public; Owner: sigif_user
--

CREATE VIEW public.organization_statistics AS
 SELECT p.organization,
    count(DISTINCT p.id) AS total_participants,
    count(DISTINCT a.event_id) AS events_attended,
    count(DISTINCT a.id) AS total_attendances,
    max(a.check_in_time) AS last_attendance_date,
    array_agg(DISTINCT e.event_type) FILTER (WHERE (e.event_type IS NOT NULL)) AS event_types_attended
   FROM ((public.participants p
     LEFT JOIN public.attendances a ON ((p.id = a.participant_id)))
     LEFT JOIN public.events e ON ((a.event_id = e.id)))
  WHERE (p.organization IS NOT NULL)
  GROUP BY p.organization
  ORDER BY (count(DISTINCT p.id)) DESC;


ALTER TABLE public.organization_statistics OWNER TO sigif_user;

--
-- TOC entry 3555 (class 0 OID 0)
-- Dependencies: 222
-- Name: VIEW organization_statistics; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON VIEW public.organization_statistics IS 'Statistiques de participation par organisation';


--
-- TOC entry 216 (class 1259 OID 16403)
-- Name: users; Type: TABLE; Schema: public; Owner: sigif_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(50) DEFAULT 'viewer'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'organizer'::character varying, 'viewer'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO sigif_user;

--
-- TOC entry 3556 (class 0 OID 0)
-- Dependencies: 216
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON TABLE public.users IS 'Utilisateurs administrateurs du système';


--
-- TOC entry 3557 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON COLUMN public.users.role IS 'admin: tous droits | organizer: gestion événements | viewer: consultation seule';


--
-- TOC entry 3332 (class 2604 OID 25000)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 3384 (class 2606 OID 25004)
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- TOC entry 3361 (class 2606 OID 25010)
-- Name: events UQ_events_qrToken; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "UQ_events_qrToken" UNIQUE ("qrToken");


--
-- TOC entry 3370 (class 2606 OID 16478)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3378 (class 2606 OID 16504)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3363 (class 2606 OID 16453)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3356 (class 2606 OID 16433)
-- Name: participants participants_cni_number_key; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_cni_number_key UNIQUE (cni_number);


--
-- TOC entry 3358 (class 2606 OID 16431)
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- TOC entry 3376 (class 2606 OID 16480)
-- Name: attendances uniq_attendance_event_participant; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT uniq_attendance_event_participant UNIQUE (event_id, participant_id);


--
-- TOC entry 3558 (class 0 OID 0)
-- Dependencies: 3376
-- Name: CONSTRAINT uniq_attendance_event_participant ON attendances; Type: COMMENT; Schema: public; Owner: sigif_user
--

COMMENT ON CONSTRAINT uniq_attendance_event_participant ON public.attendances IS 'Un participant ne peut pointer qu''une seule fois par événement';


--
-- TOC entry 3346 (class 2606 OID 16417)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3348 (class 2606 OID 16415)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3359 (class 1259 OID 25012)
-- Name: IDX_events_qrToken; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX "IDX_events_qrToken" ON public.events USING btree ("qrToken");


--
-- TOC entry 3371 (class 1259 OID 16493)
-- Name: idx_attendances_check_in_time; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_attendances_check_in_time ON public.attendances USING btree (check_in_time DESC);


--
-- TOC entry 3372 (class 1259 OID 16491)
-- Name: idx_attendances_event; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_attendances_event ON public.attendances USING btree (event_id);


--
-- TOC entry 3373 (class 1259 OID 16494)
-- Name: idx_attendances_event_time; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_attendances_event_time ON public.attendances USING btree (event_id, check_in_time DESC);


--
-- TOC entry 3374 (class 1259 OID 16492)
-- Name: idx_attendances_participant; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_attendances_participant ON public.attendances USING btree (participant_id);


--
-- TOC entry 3379 (class 1259 OID 16513)
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- TOC entry 3380 (class 1259 OID 16512)
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- TOC entry 3381 (class 1259 OID 16511)
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- TOC entry 3382 (class 1259 OID 16510)
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- TOC entry 3364 (class 1259 OID 16462)
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- TOC entry 3365 (class 1259 OID 16463)
-- Name: idx_events_fulltext; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_events_fulltext ON public.events USING gin (to_tsvector('french'::regconfig, (((((COALESCE(title, ''::character varying))::text || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || (COALESCE(location, ''::character varying))::text)));


--
-- TOC entry 3366 (class 1259 OID 16459)
-- Name: idx_events_start_date; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_events_start_date ON public.events USING btree (start_date DESC);


--
-- TOC entry 3367 (class 1259 OID 16460)
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- TOC entry 3368 (class 1259 OID 16461)
-- Name: idx_events_type; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_events_type ON public.events USING btree (event_type);


--
-- TOC entry 3349 (class 1259 OID 16436)
-- Name: idx_participants_cni; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_cni ON public.participants USING btree (cni_number) WHERE (cni_number IS NOT NULL);


--
-- TOC entry 3350 (class 1259 OID 16437)
-- Name: idx_participants_email; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_email ON public.participants USING btree (email) WHERE (email IS NOT NULL);


--
-- TOC entry 3351 (class 1259 OID 16435)
-- Name: idx_participants_first_name; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_first_name ON public.participants USING btree (first_name);


--
-- TOC entry 3352 (class 1259 OID 16439)
-- Name: idx_participants_fulltext; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_fulltext ON public.participants USING gin (to_tsvector('french'::regconfig, (((((COALESCE(first_name, ''::character varying))::text || ' '::text) || (COALESCE(last_name, ''::character varying))::text) || ' '::text) || (COALESCE(organization, ''::character varying))::text)));


--
-- TOC entry 3353 (class 1259 OID 16434)
-- Name: idx_participants_last_name; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_last_name ON public.participants USING btree (last_name);


--
-- TOC entry 3354 (class 1259 OID 16438)
-- Name: idx_participants_organization; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_participants_organization ON public.participants USING btree (organization) WHERE (organization IS NOT NULL);


--
-- TOC entry 3343 (class 1259 OID 16418)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3344 (class 1259 OID 16419)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: sigif_user
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 3392 (class 2620 OID 16518)
-- Name: attendances update_attendances_updated_at; Type: TRIGGER; Schema: public; Owner: sigif_user
--

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON public.attendances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3391 (class 2620 OID 16517)
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: sigif_user
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3390 (class 2620 OID 16516)
-- Name: participants update_participants_updated_at; Type: TRIGGER; Schema: public; Owner: sigif_user
--

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3389 (class 2620 OID 16515)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: sigif_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3386 (class 2606 OID 16481)
-- Name: attendances attendances_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- TOC entry 3387 (class 2606 OID 16486)
-- Name: attendances attendances_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- TOC entry 3388 (class 2606 OID 16505)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3385 (class 2606 OID 16454)
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sigif_user
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-01-04 20:31:52 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict rjhmdzL42Nrzq0aA8QQuKpTEzTN5geMeloFV9EtDp2dNr6YPVOBjS1NDPERBAcZ

