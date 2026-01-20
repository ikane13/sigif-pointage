import type { FC } from 'react';
import type { AuthLayoutProps } from './AuthLayout.types';
import loginBg from '@/assets/branding/login-background.jpg'; // ← Ton image
import styles from './AuthLayout.module.scss';

export const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className={styles.authLayout}>
      {/* LEFT SIDE - Image de fond */}
      <div className={styles.leftSide}>
        <div 
          className={styles.backgroundImage}
          style={{ backgroundImage: `url(${loginBg})` }}
        />
      </div>

      {/* RIGHT SIDE - Formulaire */}
      <div className={styles.rightSide}>
        <div className={styles.mobileLogo}>
          <div className={styles.logoText}>DTAI</div>
          <p>Direction du Traitement Automatique de l'Information</p>
        </div>

        <div className={styles.formContainer}>
          {children}
        </div>
      </div>
    </div>
  );
};
