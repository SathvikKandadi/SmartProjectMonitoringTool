import api from '../config/api';

export interface ProjectReportPayload {
  project: {
    title: string;
    description?: string;
    status: string;
    createdAt: string;
  };
  group: {
    name: string;
    leader: unknown;
    members: unknown[];
  };
  guide: { userId: number; name: string; email: string } | null;
  statistics: {
    totalSubmissions: number;
    approvedSubmissions: number;
    underReviewSubmissions: number;
    needsRevisionSubmissions: number;
    averageAIRating: number;
    averageGuideRating: number;
  };
  submissions: Array<{
    submissionId: number;
    submissionDate: string;
    status: string;
    abstractText?: string;
    aiReview: unknown;
    guideReviews: unknown[];
  }>;
}

export interface ProjectReportResponse {
  report: ProjectReportPayload;
}

export const reportService = {
  async getProjectReport(projectId: number): Promise<ProjectReportResponse> {
    const response = await api.get<ProjectReportResponse>(
      `/reports/project/${projectId}`
    );
    return response.data;
  },
};

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
