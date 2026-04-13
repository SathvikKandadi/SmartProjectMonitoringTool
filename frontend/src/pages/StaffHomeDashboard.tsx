import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export const StaffHomeDashboard = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { projects: list } = await projectService.getMyProjects();
        setProjects(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      pending: projects.filter((p) => p.status === 'Pending').length,
      approved: projects.filter((p) => p.status === 'Approved').length,
      rejected: projects.filter((p) => p.status === 'Rejected').length,
      submissions: projects.reduce(
        (n, p) => n + (p.submissions?.length ?? 0),
        0
      ),
    };
  }, [projects]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [projects]);

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

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome, {user?.name}. Quick view of your portfolio. Use the{' '}
            <strong>Coordinator</strong> page for full status tables, year
            filters, and report downloads.
          </p>
        </div>
        <Link to="/coordinator" className="btn btn-primary">
          Open coordinator console
        </Link>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div className="card" style={styles.statCard}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total projects</div>
            </div>
            <div className="card" style={styles.statCard}>
              <div style={styles.statValue}>{stats.pending}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
            <div className="card" style={styles.statCard}>
              <div style={styles.statValue}>{stats.approved}</div>
              <div style={styles.statLabel}>Approved</div>
            </div>
            <div className="card" style={styles.statCard}>
              <div style={styles.statValue}>{stats.submissions}</div>
              <div style={styles.statLabel}>Submissions</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h2 style={styles.sectionTitle}>Project status at a glance</h2>
            <p style={styles.muted}>
              All-time counts across every project in your scope. Filter by year
              and see submission breakdowns on the coordinator console.
            </p>
            <div style={styles.glanceRow}>
              <span className="badge badge-warning">Pending {stats.pending}</span>
              <span className="badge badge-success">
                Approved {stats.approved}
              </span>
              <span className="badge badge-danger">Rejected {stats.rejected}</span>
            </div>
          </div>

          <div className="card">
            <h2 style={styles.sectionTitle}>Recent projects</h2>
            {recentProjects.length === 0 ? (
              <p style={styles.muted}>No projects yet.</p>
            ) : (
              <ul style={styles.list}>
                {recentProjects.map((p) => (
                  <li key={p.projectId} style={styles.listItem}>
                    <Link
                      to={`/projects/${p.projectId}`}
                      style={styles.projectLink}
                    >
                      {p.title}
                    </Link>
                    <span className={`badge badge-${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: '16px', marginBottom: 0 }}>
              <Link to="/coordinator" className="btn btn-outline btn-sm">
                All projects and reports
              </Link>
              <Link
                to="/assigned-projects"
                className="btn btn-outline btn-sm"
                style={{ marginLeft: '8px' }}
              >
                Assigned projects list
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    marginBottom: '28px',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  subtitle: { color: '#6b7280', marginTop: '4px', maxWidth: '640px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: { textAlign: 'center', padding: '20px' },
  statValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#1f2937',
  },
  statLabel: { fontSize: '13px', color: '#6b7280', fontWeight: 500 },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
  },
  muted: { color: '#6b7280', fontSize: '14px', marginBottom: '12px' },
  glanceRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  projectLink: {
    fontWeight: 500,
    color: '#4f46e5',
    textDecoration: 'none',
  },
};
