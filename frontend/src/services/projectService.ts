import api from '../config/api';
import type { Project } from '../types';

export const projectService = {
  async getAllProjects(params?: {
    status?: string;
    groupId?: number;
  }): Promise<{ projects: Project[] }> {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  async getMyProjects(): Promise<{ projects: Project[] }> {
    const response = await api.get('/projects/my-projects');
    return response.data;
  },

  async getProjectById(projectId: number): Promise<{ project: Project }> {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  async createProject(data: {
    groupId: number;
    title: string;
    description?: string;
    assignedGuide?: number;
  }): Promise<{ message: string; project: Project }> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async updateProject(
    projectId: number,
    data: { title: string; description?: string }
  ): Promise<{ message: string; project: Project }> {
    const response = await api.put(`/projects/${projectId}`, data);
    return response.data;
  },

  async updateProjectStatus(
    projectId: number,
    status: string
  ): Promise<{ message: string; project: Project }> {
    const response = await api.patch(`/projects/${projectId}/status`, {
      status,
    });
    return response.data;
  },

  async assignGuide(
    projectId: number,
    guideId: number
  ): Promise<{ message: string; project: Project }> {
    const response = await api.patch(`/projects/${projectId}/assign-guide`, {
      guideId,
    });
    return response.data;
  },

  async deleteProject(projectId: number): Promise<{ message: string }> {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  async getProjectComments(projectId: number): Promise<{ comments: any[] }> {
    const response = await api.get(`/projects/${projectId}/comments`);
    return response.data;
  },

  async addProjectComment(
    projectId: number,
    comment: string
  ): Promise<{ message: string; comment: any }> {
    const response = await api.post(`/projects/${projectId}/comments`, {
      comment,
    });
    return response.data;
  },
};

