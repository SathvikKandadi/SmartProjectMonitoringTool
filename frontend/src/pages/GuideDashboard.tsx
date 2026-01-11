import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import { submissionService } from '../services/submissionService';
import type { Project, Submission } from '../types';

export const GuideDashboard = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions'>('submissions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { projects } = await projectService.getMyProjects();
      setProjects(projects);

      // Get all submissions from assigned projects that need review
      const allSubmissions: Submission[] = [];
      for (const project of projects) {
        if (project.submissions) {
          allSubmissions.push(...project.submissions);
        }
      }

      // Filter for pending submissions (UnderReview status)
      const pending = allSubmissions.filter(s => s.status === 'UnderReview');
      setPendingSubmissions(pending);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectStats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'Pending').length,
    approved: projects.filter(p => p.status === 'Approved').length,
    rejected: projects.filter(p => p.status === 'Rejected').length,
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>Guide Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome, {user?.name}! Review and manage your assigned projects
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{projectStats.total}</div>
          <div style={styles.statLabel}>Total Projects</div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statValue}>{pendingSubmissions.length}</div>
          <div style={styles.statLabel}>Pending Reviews</div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>{projectStats.approved}</div>
          <div style={styles.statLabel}>Approved Projects</div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>⏰</div>
          <div style={styles.statValue}>{projectStats.pending}</div>
          <div style={styles.statLabel}>Pending Projects</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('submissions')}
          className={activeTab === 'submissions' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          📋 Pending Reviews ({pendingSubmissions.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={activeTab === 'projects' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
        >
          📊 All Projects ({projects.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : activeTab === 'submissions' ? (
        <div className="card">
          <h2 style={styles.sectionTitle}>Submissions Waiting for Your Review</h2>
          
          {pendingSubmissions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>🎉 All caught up! No pending submissions to review.</p>
            </div>
          ) : (
            <div style={styles.submissionsList}>
              {pendingSubmissions.map((submission) => (
                <div key={submission.submissionId} style={styles.submissionCard} className="card">
                  <div style={styles.submissionHeader}>
                    <div>
                      <h3 style={styles.submissionTitle}>
                        {submission.project?.title}
                      </h3>
                      <p style={styles.submissionGroup}>
                        👥 {submission.project?.group?.groupName}
                      </p>
                    </div>
                    <span className="badge badge-warning">Under Review</span>
                  </div>

                  <div style={styles.submissionMeta}>
                    <span>📅 {new Date(submission.submissionDate).toLocaleDateString()}</span>
                    {submission.abstractText && (
                      <span>📝 Abstract included</span>
                    )}
                    {submission.documentUrl && (
                      <span>📄 Document attached</span>
                    )}
                    {submission.aiReviews && submission.aiReviews.length > 0 && (
                      <span>🤖 AI Reviewed ({submission.aiReviews[0].rating}/10)</span>
                    )}
                  </div>

                  {submission.abstractText && (
                    <div style={styles.abstractPreview}>
                      <strong>Abstract Preview:</strong>
                      <p style={styles.abstractText}>
                        {submission.abstractText.substring(0, 200)}
                        {submission.abstractText.length > 200 && '...'}
                      </p>
                    </div>
                  )}

                  <Link
                    to={`/review-submission/${submission.submissionId}`}
                    className="btn btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    ✍️ Review Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2 style={styles.sectionTitle}>Your Assigned Projects</h2>
          
          {projects.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No projects assigned yet</p>
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {projects.map((project) => (
                <Link
                  key={project.projectId}
                  to={`/projects/${project.projectId}`}
                  style={styles.projectCard}
                  className="card"
                >
                  <div style={styles.projectHeader}>
                    <h3 style={styles.projectTitle}>{project.title}</h3>
                    <span className={`badge badge-${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <p style={styles.projectDesc}>
                    {project.description || 'No description provided'}
                  </p>

                  <div style={styles.projectFooter}>
                    <span style={styles.projectMeta}>
                      👥 {project.group?.groupName}
                    </span>
                    {project.submissions && project.submissions.length > 0 && (
                      <span style={styles.projectMeta}>
                        📄 {project.submissions.length} submission(s)
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Rejected':
      return 'danger';
    default:
      return 'warning';
  }
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    marginBottom: '30px',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    textAlign: 'center',
    padding: '24px',
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  submissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  submissionCard: {
    padding: '20px',
  },
  submissionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  submissionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#1f2937',
  },
  submissionGroup: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0',
  },
  submissionMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  abstractPreview: {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '12px',
  },
  abstractText: {
    fontSize: '13px',
    color: '#374151',
    marginTop: '8px',
    lineHeight: '1.5',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  projectCard: {
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  projectTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  projectDesc: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  projectFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  projectMeta: {
    fontSize: '13px',
    color: '#6b7280',
  },
};

