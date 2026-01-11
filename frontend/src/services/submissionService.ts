import api from '../config/api';
import type { Submission } from '../types';

export const submissionService = {
  async createSubmission(data: {
    projectId: number;
    abstractText?: string;
    file?: File;
    abstractPDF?: File;
  }): Promise<{ message: string; submission: Submission }> {
    const formData = new FormData();
    formData.append('projectId', data.projectId.toString());
    if (data.abstractText) {
      formData.append('abstractText', data.abstractText);
    }
    if (data.file) {
      formData.append('document', data.file);
    }
    if (data.abstractPDF) {
      formData.append('abstractPDF', data.abstractPDF);
    }

    const response = await api.post('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAllSubmissions(params?: {
    projectId?: number;
    status?: string;
  }): Promise<{ submissions: Submission[] }> {
    const response = await api.get('/submissions', { params });
    return response.data;
  },

  async getSubmissionById(
    submissionId: number
  ): Promise<{ submission: Submission }> {
    const response = await api.get(`/submissions/${submissionId}`);
    return response.data;
  },

  async updateSubmissionStatus(
    submissionId: number,
    status: string
  ): Promise<{ message: string; submission: Submission }> {
    const response = await api.patch(`/submissions/${submissionId}/status`, {
      status,
    });
    return response.data;
  },
};

