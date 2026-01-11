import api from '../config/api';
import type { User } from '../types';

export const userService = {
  async getAllUsers(): Promise<{ users: User[] }> {
    const response = await api.get('/users');
    return response.data;
  },

  async getUsersByRole(role: string): Promise<{ users: User[] }> {
    const response = await api.get(`/users/by-role/${role}`);
    return response.data;
  },

  async getUserById(userId: number): Promise<{ user: User }> {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

