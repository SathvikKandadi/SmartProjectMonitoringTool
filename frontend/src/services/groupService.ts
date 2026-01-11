import api from '../config/api';
import type { ProjectGroup } from '../types';

export const groupService = {
  async createGroup(data: {
    groupName: string;
    leaderId: number;
    members?: Array<{ userId: number; roleInGroup?: string }>;
  }): Promise<{ message: string; group: ProjectGroup }> {
    const response = await api.post('/groups', data);
    return response.data;
  },

  async getAllGroups(): Promise<{ groups: ProjectGroup[] }> {
    const response = await api.get('/groups');
    return response.data;
  },

  async searchGroups(query: string): Promise<{ groups: ProjectGroup[] }> {
    const response = await api.get('/groups/search', { params: { q: query } });
    return response.data;
  },

  async getGroupById(groupId: number): Promise<{ group: ProjectGroup }> {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  async addMember(
    groupId: number,
    userId: number,
    roleInGroup?: string
  ): Promise<{ message: string }> {
    const response = await api.post(`/groups/${groupId}/members`, {
      userId,
      roleInGroup,
    });
    return response.data;
  },

  async removeMember(
    groupId: number,
    userId: number
  ): Promise<{ message: string }> {
    const response = await api.delete(`/groups/${groupId}/members/${userId}`);
    return response.data;
  },
};

