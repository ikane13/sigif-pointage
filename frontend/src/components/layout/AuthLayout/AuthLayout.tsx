import type { FC } from 'react';
import type { AuthLayoutProps } from './AuthLayout.types';
import styles from './AuthLayout.module.scss';

export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      {/* LEFT SIDE - Visuel */}
      <div className={styles.leftSide}>
        <div className={styles.logo}>
          <div className={styles.logoImage}>
            {/* TODO: Remplacer par le vrai logo DTAI */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: '#FFFFFF', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '700',
              color: '#0047AB'
            }}>
              DTAI
            </div>
          </div>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.republicFlag}>
            <div className={styles.flagIcon}>🇸🇳</div>
            <h2 className={styles.republicText}>RÉPUBLIQUE DU SÉNÉGAL</h2>
            <p className={styles.motto}>Un Peuple - Un But - Une Foi</p>
          </div>

          <h1 className={styles.heroTitle}>
            Bienvenue sur<br />
            le Système de Pointage<br />
            Numérique de la DTAI
          </h1>

          <p className={styles.heroSubtitle}>
            Cet espace sécurisé est réservé au suivi des données des ateliers organisé par la DTAI-CAGES
          </p>

          <div className={styles.illustration}>
            {/* Illustration simplifiée */}
            <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Dashboard mockup */}
              <rect x="50" y="40" width="300" height="200" rx="8" fill="rgba(255,255,255,0.2)" />
              <rect x="70" y="60" width="80" height="60" rx="4" fill="rgba(255,255,255,0.3)" />
              <rect x="160" y="60" width="80" height="60" rx="4" fill="rgba(255,255,255,0.3)" />
              <rect x="250" y="60" width="80" height="60" rx="4" fill="rgba(255,255,255,0.3)" />
              
              {/* Chart */}
              <path d="M 70 140 L 100 180 L 140 160 L 180 190 L 220 170 L 260 200 L 330 150" 
                    stroke="rgba(255,255,255,0.5)" strokeWidth="3" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Formulaire */}
      <div className={styles.rightSide}>
        <div className={styles.mobileLogo}>
          <div className={styles.logoText}>DTAI</div>
          <p style={{ fontSize: '0.875rem', color: '#6C757D', marginTop: '0.5rem' }}>
            Direction du Traitement Automatique de l'Information
          </p>
        </div>

        <div className={styles.formContainer}>
          {children}
        </div>
      </div>
    </div>
  );
};