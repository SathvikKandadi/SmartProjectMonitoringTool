import api from '../config/api';
import type { AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};

