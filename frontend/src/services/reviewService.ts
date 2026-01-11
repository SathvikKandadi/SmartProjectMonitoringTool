import api from '../config/api';
import type { AIReview, GuideReview } from '../types';

export const reviewService = {
  async analyzeAbstract(
    abstractText: string,
    submissionId?: number
  ): Promise<{
    message: string;
    analysis: {
      feedback: string;
      rating: number;
      suggestions: string;
    };
    aiReview: AIReview | null;
  }> {
    const response = await api.post('/reviews/ai/analyze', {
      abstractText,
      submissionId,
    });
    return response.data;
  },

  async analyzeAbstractPDF(
    file: File,
    submissionId?: number
  ): Promise<{
    message: string;
    analysis: {
      feedback: string;
      rating: number;
      suggestions: string;
    };
    aiReview: AIReview | null;
    extractedText: string;
  }> {
    const formData = new FormData();
    formData.append('pdf', file);
    if (submissionId) {
      formData.append('submissionId', submissionId.toString());
    }

    const response = await api.post('/reviews/ai/analyze-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getAIReviewsBySubmission(
    submissionId: number
  ): Promise<{ aiReviews: AIReview[] }> {
    const response = await api.get(`/reviews/ai/submission/${submissionId}`);
    return response.data;
  },

  async createGuideReview(data: {
    submissionId: number;
    comments?: string;
    rating?: number;
  }): Promise<{ message: string; guideReview: GuideReview }> {
    const response = await api.post('/reviews/guide', data);
    return response.data;
  },

  async getGuideReviewsBySubmission(
    submissionId: number
  ): Promise<{ guideReviews: GuideReview[] }> {
    const response = await api.get(
      `/reviews/guide/submission/${submissionId}`
    );
    return response.data;
  },

  async updateGuideReview(
    reviewId: number,
    data: { comments?: string; rating?: number }
  ): Promise<{ message: string; guideReview: GuideReview }> {
    const response = await api.put(`/reviews/guide/${reviewId}`, data);
    return response.data;
  },
};

