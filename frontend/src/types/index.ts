export type Role = 'Student' | 'Guide' | 'Admin' | 'Coordinator' | 'HOD';

export type ProjectStatus = 'Pending' | 'Approved' | 'Rejected';

export type SubmissionStatus = 'UnderReview' | 'Approved' | 'NeedsRevision';

export type NotificationStatus = 'Read' | 'Unread';

export interface User {
  userId: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ProjectGroup {
  groupId: number;
  groupName: string;
  leaderId: number;
  createdAt: string;
  leader?: User;
  members?: GroupMember[];
  projects?: Project[];
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  roleInGroup: string;
  addedAt: string;
  user?: User;
}

export interface Project {
  projectId: number;
  groupId: number;
  title: string;
  description?: string;
  status: ProjectStatus;
  assignedGuide?: number;
  createdAt: string;
  group?: ProjectGroup;
  guide?: User;
  submissions?: Submission[];
}

export interface Submission {
  submissionId: number;
  projectId: number;
  submissionDate: string;
  documentUrl?: string;
  abstractText?: string;
  status: SubmissionStatus;
  project?: Project;
  aiReviews?: AIReview[];
  guideReviews?: GuideReview[];
}

export interface AIReview {
  reviewId: number;
  submissionId: number;
  reviewText: string;
  rating?: number;
  suggestions?: string;
  createdAt: string;
}

export interface GuideReview {
  reviewId: number;
  submissionId: number;
  guideId: number;
  comments?: string;
  rating?: number;
  createdAt: string;
  guide?: User;
}

export interface Notification {
  notificationId: number;
  userId: number;
  message: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

