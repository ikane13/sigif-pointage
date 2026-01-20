import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@components/layout/AuthLayout';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Mail, Lock } from 'lucide-react';
import { api } from '@services/api'; //  Import API
import styles from './Auth.module.scss';

export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // ✅ Erreur API

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError(null);
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

    try {
      setLoading(true);
      setApiError(null);

      // ✅ Appel API de connexion
      const { data } = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // ✅ Stocker le token (backend renvoie data.data.accessToken)
      if (data.success && data.data.accessToken) {
        localStorage.setItem('token', data.data.accessToken);
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
        
        // Rediriger vers les événements
        navigate('/events');
      } else {
        setApiError('Réponse invalide du serveur');
      }
    } catch (err: any) {
      console.error('Erreur login:', err);
      
      // Gérer les différentes erreurs
      if (err.response?.status === 401) {
        setApiError('Email ou mot de passe incorrect');
      } else if (err.response?.status === 403) {
        setApiError('Compte désactivé. Contactez l\'administrateur.');
      } else if (err.response?.data?.message) {
        setApiError(err.response.data.message);
      } else {
        setApiError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
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

      {/* Afficher l'erreur API si présente */}
      {apiError && (
        <div style={{
          padding: '1rem',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          borderRadius: '8px',
          color: '#DC2626',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {apiError}
        </div>
      )}

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
