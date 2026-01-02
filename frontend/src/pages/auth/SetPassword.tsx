import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@components/layout/AuthLayout';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Lock, ArrowLeft } from 'lucide-react';
import styles from './Auth.module.scss';

export const SetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[@#$%^&+=!]/.test(password);

    return { minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar };
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const { minLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar } = 
      validatePassword(formData.password);

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      newErrors.password = 'Le mot de passe ne respecte pas tous les critères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    // TODO: Appeler l'API
    setTimeout(() => {
      setLoading(false);
      navigate('/login');
    }, 1500);
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <AuthLayout>
      <div className={styles.header}>
        <a href="/login" className={styles.backButton}>
          <ArrowLeft size={16} />
          Retour
        </a>

        <div className={styles.lockIcon}>
          <Lock size={24} />
        </div>

        <h1 className={styles.title}>Définissez un mot de passe sécurisé</h1>
        <p className={styles.subtitle}>Choisissez un mot de passe</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Nouveau mot de passe"
          name="password"
          type="password"
          placeholder="Nouveau mot de passe"
          value={formData.password}
          onChange={handleChange}
          icon={<Lock size={20} />}
          error={errors.password}
          required
        />

        <div className={styles.passwordRules}>
          <p className={styles.rulesTitle}>Minimum 8 caractères</p>
          <ul className={styles.rulesList}>
            <li className={passwordValidation.hasUpperCase ? styles.valid : ''}>
              1 majuscule, 1 minuscule
            </li>
            <li className={passwordValidation.hasNumber ? styles.valid : ''}>
              1 chiffre
            </li>
            <li className={passwordValidation.hasSpecialChar ? styles.valid : ''}>
              1 caractère spécial (@#$...etc)
            </li>
          </ul>
        </div>

        <Input
          label="Confirmer le mot de passe"
          name="confirmPassword"
          type="password"
          placeholder="Confirmer mot de passe"
          value={formData.confirmPassword}
          onChange={handleChange}
          icon={<Lock size={20} />}
          error={errors.confirmPassword}
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Enregistrer
        </Button>
      </form>
    </AuthLayout>
  );
};