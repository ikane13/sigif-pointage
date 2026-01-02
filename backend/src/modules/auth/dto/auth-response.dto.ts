import { UserRole } from '@/database/entities';

export class AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
  };
}
