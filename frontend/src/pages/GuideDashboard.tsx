import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import { ProjectReportButton } from '../components/ProjectReportButton';
import type { Project, Submission } from '../types';

export const GuideDashboard = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'submissions'>(
    'submissions'
  );

  const isGuide = user?.role === 'Guide';
  const isCoordinator =
    user?.role === 'Coordinator' ||
    user?.role === 'HOD' ||
    user?.role === 'Admin';

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { projects: list } = await projectService.getMyProjects();
      setProjects(list);

      if (isCoordinator && list.length > 0) {
        const years = list.map((p) => new Date(p.createdAt).getFullYear());
        const uniqueYears = Array.from(new Set(years)).sort((a, b) => b - a);
        setAvailableYears(uniqueYears);
      }

      if (isGuide) {
        const allSubmissions: Submission[] = [];
        for (const project of list) {
          if (project.submissions) {
            allSubmissions.push(...project.submissions);
          }
        }
        const pending = allSubmissions.filter((s) => s.status === 'UnderReview');
        setPendingSubmissions(pending);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(
    () =>
      selectedYear === 'all'
        ? projects
        : projects.filter(
            (p) =>
              new Date(p.createdAt).getFullYear().toString() === selectedYear
          ),
    [projects, selectedYear]
  );

  const projectStats = useMemo(
    () => ({
      total: filteredProjects.length,
      pending: filteredProjects.filter((p) => p.status === 'Pending').length,
      approved: filteredProjects.filter((p) => p.status === 'Approved').length,
      rejected: filteredProjects.filter((p) => p.status === 'Rejected').length,
    }),
    [filteredProjects]
  );

  const submissionStatusReport = useMemo(() => {
    const acc = {
      total: 0,
      underReview: 0,
      approved: 0,
      needsRevision: 0,
    };
    for (const p of filteredProjects) {
      for (const s of p.submissions || []) {
        acc.total += 1;
        if (s.status === 'UnderReview') acc.underReview += 1;
        else if (s.status === 'Approved') acc.approved += 1;
        else if (s.status === 'NeedsRevision') acc.needsRevision += 1;
      }
    }
    return acc;
  }, [filteredProjects]);

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>
            {isGuide
              ? 'Guide dashboard'
              : `${user?.role ?? 'Staff'} dashboard`}
          </h1>
          <p style={styles.subtitle}>
            Welcome, {user?.name}.{' '}
            {isGuide
              ? 'Review submissions and download reports for assigned projects.'
              : 'View assigned projects, track status, and export reports.'}
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statValue}>{projectStats.total}</div>
          <div style={styles.statLabel}>Total projects (filtered)</div>
        </div>

        {isGuide && (
          <div className="card" style={styles.statCard}>
            <div style={styles.statValue}>{pendingSubmissions.length}</div>
            <div style={styles.statLabel}>Pending reviews</div>
          </div>
        )}

        <div className="card" style={styles.statCard}>
          <div style={styles.statValue}>{projectStats.approved}</div>
          <div style={styles.statLabel}>Approved projects</div>
        </div>

        <div className="card" style={styles.statCard}>
          <div style={styles.statValue}>{projectStats.pending}</div>
          <div style={styles.statLabel}>Pending projects</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={styles.sectionTitle}>Status report</h2>
        <p style={styles.muted}>
          Submission counts use the same year filter as the project list below.
        </p>
        <div style={styles.statusRow}>
          <div style={styles.statusPill}>
            <span style={styles.pillLabel}>Under review</span>
            <span style={styles.pillValue}>
              {submissionStatusReport.underReview}
            </span>
          </div>
          <div style={styles.statusPill}>
            <span style={styles.pillLabel}>Approved</span>
            <span style={styles.pillValue}>
              {submissionStatusReport.approved}
            </span>
          </div>
          <div style={styles.statusPill}>
            <span style={styles.pillLabel}>Needs revision</span>
            <span style={styles.pillValue}>
              {submissionStatusReport.needsRevision}
            </span>
          </div>
          <div style={styles.statusPill}>
            <span style={styles.pillLabel}>Total submissions</span>
            <span style={styles.pillValue}>{submissionStatusReport.total}</span>
          </div>
        </div>
      </div>

      {isCoordinator && availableYears.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={styles.filterSection}>
            <label htmlFor="guide-year-filter" style={styles.filterLabel}>
              Filter by year
            </label>
            <select
              id="guide-year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="btn btn-outline btn-sm"
              style={{ minWidth: '150px', padding: '8px 12px' }}
            >
              <option value="all">All years</option>
              {availableYears.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            {selectedYear !== 'all' && (
              <span style={styles.filterInfo}>
                Showing {filteredProjects.length} project(s) from {selectedYear}
              </span>
            )}
          </div>
        </div>
      )}

      {isGuide && (
        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={
              activeTab === 'submissions'
                ? 'btn btn-primary btn-sm'
                : 'btn btn-outline btn-sm'
            }
          >
            Pending reviews ({pendingSubmissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={
              activeTab === 'projects'
                ? 'btn btn-primary btn-sm'
                : 'btn btn-outline btn-sm'
            }
          >
            All projects ({projects.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : isGuide && activeTab === 'submissions' ? (
        <div className="card">
          <h2 style={styles.sectionTitle}>Submissions waiting for review</h2>

          {pendingSubmissions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No pending submissions. You are caught up.</p>
            </div>
          ) : (
            <div style={styles.submissionsList}>
              {pendingSubmissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  style={styles.submissionCard}
                  className="card"
                >
                  <div style={styles.submissionHeader}>
                    <div>
                      <h3 style={styles.submissionTitle}>
                        {submission.project?.title}
                      </h3>
                      <p style={styles.submissionGroup}>
                        Group: {submission.project?.group?.groupName}
                      </p>
                    </div>
                    <span className="badge badge-warning">Under review</span>
                  </div>

                  <div style={styles.submissionMeta}>
                    <span>
                      Submitted{' '}
                      {new Date(
                        submission.submissionDate
                      ).toLocaleDateString()}
                    </span>
                    {submission.abstractText && <span>Abstract included</span>}
                    {submission.documentUrl && <span>Document attached</span>}
                    {submission.aiReviews &&
                      submission.aiReviews.length > 0 && (
                        <span>
                          AI reviewed (
                          {submission.aiReviews[0].rating ?? '—'}/10)
                        </span>
                      )}
                  </div>

                  {submission.abstractText && (
                    <div style={styles.abstractPreview}>
                      <strong>Abstract preview</strong>
                      <p style={styles.abstractText}>
                        {submission.abstractText.substring(0, 200)}
                        {submission.abstractText.length > 200 && '…'}
                      </p>
                    </div>
                  )}

                  <Link
                    to={`/review-submission/${submission.submissionId}`}
                    className="btn btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    Open review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2 style={styles.sectionTitle}>
            {isGuide ? 'Your assigned projects' : 'Assigned / visible projects'}
          </h2>

          {filteredProjects.length === 0 ? (
            <div style={styles.emptyState}>
              <p>
                {selectedYear !== 'all'
                  ? `No projects found for ${selectedYear}`
                  : 'No projects assigned yet'}
              </p>
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {filteredProjects.map((project) => (
                <div
                  key={project.projectId}
                  className="card"
                  style={styles.projectCardWrap}
                >
                  <Link
                    to={`/projects/${project.projectId}`}
                    style={styles.projectCardLink}
                  >
                    <div style={styles.projectHeader}>
                      <h3 style={styles.projectTitle}>{project.title}</h3>
                      <span
                        className={`badge badge-${getStatusColor(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <p style={styles.projectDesc}>
                      {project.description || 'No description provided'}
                    </p>

                    <div style={styles.projectFooter}>
                      <span style={styles.projectMeta}>
                        Group: {project.group?.groupName}
                      </span>
                      {project.submissions &&
                        project.submissions.length > 0 && (
                          <span style={styles.projectMeta}>
                            {project.submissions.length} submission(s)
                          </span>
                        )}
                    </div>
                  </Link>
                  <div style={styles.projectActions}>
                    <ProjectReportButton
                      projectId={project.projectId}
                      projectTitle={project.title}
                    />
                  </div>
                </div>
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
  muted: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '12px',
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
  statusRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  statusPill: {
    flex: '1 1 140px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  pillLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  pillValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
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
  projectCardWrap: {
    padding: 0,
    overflow: 'hidden',
  },
  projectCardLink: {
    display: 'block',
    padding: '20px',
    textDecoration: 'none',
    color: 'inherit',
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
  projectActions: {
    padding: '0 20px 16px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '12px',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  filterInfo: {
    fontSize: '14px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
};
