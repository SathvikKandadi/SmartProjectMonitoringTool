import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import { ProjectReportButton } from '../components/ProjectReportButton';
import { downloadJsonFile } from '../services/reportService';
import type { Project } from '../types';

const IconChart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 19V5M4 19h16M8 17V11m4 6V8m4 9v-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconFolder = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconClock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v6l4 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const CoordinatorDashboard = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { projects: list } = await projectService.getMyProjects();
        setProjects(list);
        const years = list.map((p) => new Date(p.createdAt).getFullYear());
        const unique = Array.from(new Set(years)).sort((a, b) => b - a);
        setAvailableYears(unique);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  const projectStatusReport = useMemo(() => {
    return {
      total: filteredProjects.length,
      pending: filteredProjects.filter((p) => p.status === 'Pending').length,
      approved: filteredProjects.filter((p) => p.status === 'Approved').length,
      rejected: filteredProjects.filter((p) => p.status === 'Rejected').length,
    };
  }, [filteredProjects]);

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

  const consoleSubtitle =
    user?.role === 'Admin'
      ? 'Administrator'
      : user?.role === 'Coordinator'
        ? 'Coordinator'
        : 'HOD';

  const downloadPortfolioSummary = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const payload = {
      generatedAt: new Date().toISOString(),
      scopeRole: consoleSubtitle,
      yearFilter: selectedYear === 'all' ? null : selectedYear,
      projectStatusSummary: projectStatusReport,
      submissionStatusSummary: submissionStatusReport,
      projects: filteredProjects.map((p) => ({
        projectId: p.projectId,
        title: p.title,
        status: p.status,
        createdAt: p.createdAt,
        groupName: p.group?.groupName,
        submissionCount: p.submissions?.length ?? 0,
        submissions: (p.submissions || []).map((s) => ({
          submissionId: s.submissionId,
          status: s.status,
          submissionDate: s.submissionDate,
        })),
      })),
    };
    downloadJsonFile(`portfolio-summary-${stamp}.json`, payload);
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>Coordinator console</h1>
          <p style={styles.subtitle}>
            Welcome, {user?.name} ({consoleSubtitle}). Full status tables,
            year filters, per-project PDF reports, and a portfolio-wide
            summary export (JSON).
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>
            <IconChart />
          </div>
          <div style={styles.statValue}>{projectStatusReport.total}</div>
          <div style={styles.statLabel}>Projects (filtered)</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>
            <IconClock />
          </div>
          <div style={styles.statValue}>{projectStatusReport.pending}</div>
          <div style={styles.statLabel}>Pending projects</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>
            <IconCheck />
          </div>
          <div style={styles.statValue}>{projectStatusReport.approved}</div>
          <div style={styles.statLabel}>Approved projects</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>
            <IconFolder />
          </div>
          <div style={styles.statValue}>{submissionStatusReport.total}</div>
          <div style={styles.statLabel}>Total submissions</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={styles.sectionTitle}>Status report</h2>
        <p style={styles.muted}>
          Counts respect the year filter below. Use this as a live snapshot of
          portfolio health.
        </p>
        <div style={styles.statusTables}>
          <div>
            <h3 style={styles.tableTitle}>Project status</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>Pending</td>
                  <td style={styles.tdRight}>{projectStatusReport.pending}</td>
                </tr>
                <tr>
                  <td style={styles.td}>Approved</td>
                  <td style={styles.tdRight}>
                    {projectStatusReport.approved}
                  </td>
                </tr>
                <tr>
                  <td style={styles.td}>Rejected</td>
                  <td style={styles.tdRight}>
                    {projectStatusReport.rejected}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tdStrong}>Total projects</td>
                  <td style={styles.tdRightStrong}>
                    {projectStatusReport.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 style={styles.tableTitle}>Submission status</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>Under review</td>
                  <td style={styles.tdRight}>
                    {submissionStatusReport.underReview}
                  </td>
                </tr>
                <tr>
                  <td style={styles.td}>Approved</td>
                  <td style={styles.tdRight}>
                    {submissionStatusReport.approved}
                  </td>
                </tr>
                <tr>
                  <td style={styles.td}>Needs revision</td>
                  <td style={styles.tdRight}>
                    {submissionStatusReport.needsRevision}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tdStrong}>Total submissions</td>
                  <td style={styles.tdRightStrong}>
                    {submissionStatusReport.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={styles.portfolioExport}>
          <p style={styles.muted}>
            Export a single JSON file with all filtered projects, counts, and
            submission rows (respects the year filter above).
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={downloadPortfolioSummary}
            disabled={filteredProjects.length === 0}
          >
            Download portfolio summary
          </button>
        </div>
      </div>

      {availableYears.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={styles.filterSection}>
            <label htmlFor="year-filter" style={styles.filterLabel}>
              Filter by year
            </label>
            <select
              id="year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="btn btn-outline btn-sm"
              style={{ minWidth: '160px', padding: '8px 12px' }}
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
                Showing {filteredProjects.length} project(s) from{' '}
                {selectedYear}
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div className="card">
          <h2 style={styles.sectionTitle}>All projects</h2>
          {filteredProjects.length === 0 ? (
            <div style={styles.emptyState}>
              <p>
                {selectedYear !== 'all'
                  ? `No projects in ${selectedYear}.`
                  : 'No projects available in your scope yet.'}
              </p>
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {filteredProjects.map((project) => (
                <div
                  key={project.projectId}
                  style={styles.projectCardWrap}
                  className="card"
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
                      {project.submissions && project.submissions.length > 0 && (
                        <span style={styles.projectMeta}>
                          {project.submissions.length} submission(s)
                        </span>
                      )}
                    </div>
                  </Link>
                  <div style={styles.actions}>
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

const styles: { [key: string]: React.CSSProperties } = {
  header: { marginBottom: '30px' },
  subtitle: { color: '#6b7280', marginTop: '4px' },
  muted: { color: '#6b7280', fontSize: '14px', marginBottom: '16px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: { textAlign: 'center', padding: '24px' },
  statIcon: {
    color: '#4f46e5',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '4px',
  },
  statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: 500 },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
  },
  statusTables: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },
  tableTitle: { fontSize: '15px', fontWeight: 600, marginBottom: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: 600,
  },
  thRight: {
    textAlign: 'right',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
    color: '#6b7280',
    fontWeight: 600,
  },
  td: { padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  tdRight: { textAlign: 'right', padding: '8px 0', borderBottom: '1px solid #f3f4f6' },
  tdStrong: { padding: '10px 0 0', fontWeight: 600 },
  tdRightStrong: { textAlign: 'right', padding: '10px 0 0', fontWeight: 600 },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  filterLabel: { fontSize: '15px', fontWeight: 600, color: '#1f2937' },
  filterInfo: { fontSize: '14px', color: '#6b7280', fontStyle: 'italic' },
  emptyState: {
    textAlign: 'center',
    padding: '48px 16px',
    color: '#6b7280',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  projectCardWrap: { padding: 0, overflow: 'hidden' },
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
    gap: '8px',
  },
  projectTitle: { fontSize: '18px', fontWeight: 600, margin: 0 },
  projectDesc: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  projectFooter: { display: 'flex', flexDirection: 'column', gap: '6px' },
  projectMeta: { fontSize: '13px', color: '#6b7280' },
  actions: {
    padding: '0 20px 16px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '12px',
  },
  portfolioExport: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
};
