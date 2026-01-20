import { api } from './api';

export interface LoginDto {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

export interface UserProfile extends User {
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
  };
}

export const authService = {
  /**
   * Login et stockage du token
   */
  login: async (credentials: LoginDto): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Stocker le token
    if (data.success && data.data.accessToken) {
      localStorage.setItem('token', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  },

  /**
   * Logout et suppression du token
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  /**
   * Récupérer le token actuel
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Récupérer l'utilisateur actuel
   */
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Profil utilisateur connecté
   */
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/auth/me');
    return data.data || data;
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile: async (payload: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserProfile> => {
    const { data } = await api.patch('/auth/me', payload);
    const profile = data.data || data;
    if (profile) {
      authService.setUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        fullName: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim(),
        role: profile.role,
        isActive: profile.isActive,
      });
    }
    return profile;
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (payload: {
    userId: string;
    currentPassword: string;
    newPassword: string;
  }) => {
    const { data } = await api.patch(`/users/${payload.userId}/password`, {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });
    return data.data || data;
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
