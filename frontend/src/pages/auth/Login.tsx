import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@components/layout/AuthLayout';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Mail, Lock } from 'lucide-react';
import styles from './Auth.module.scss';

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    // TODO: Appeler l'API de connexion
    setTimeout(() => {
      setLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <AuthLayout>
      <div className={styles.header}>
        <div className={styles.lockIcon}>
          <Lock size={24} />
        </div>
        <h1 className={styles.title}>Connectez-vous à votre espace.</h1>
        <p className={styles.subtitle}>
          Sécurisé et réservé exclusivement données administratives
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Login"
          name="email"
          type="email"
          placeholder="Login ou identifiant"
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={20} />}
          error={errors.email}
          helperText="Saisissez votre login ou autre identifiant valide"
          required
        />

        <Input
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          icon={<Lock size={20} />}
          error={errors.password}
          helperText="Saisissez votre mot de passe"
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
};