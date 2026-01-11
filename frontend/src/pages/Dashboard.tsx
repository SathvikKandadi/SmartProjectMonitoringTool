import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/projectService';
import type { Project } from '../types';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { projects } = await projectService.getMyProjects();
      setProjects(projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === 'Student';

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>Welcome, {user?.name}!</h1>
          <p style={styles.subtitle}>
            {isStudent
              ? 'Manage your projects and get AI-powered feedback'
              : 'Review and guide student projects'}
          </p>
        </div>

        {isStudent && (
          <Link to="/create-project" className="btn btn-primary">
            + Create New Project
          </Link>
        )}
      </div>

      <div className="card">
        <h2 style={styles.sectionTitle}>
          {isStudent ? 'My Projects' : 'Assigned Projects'}
        </h2>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : projects.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No projects found</p>
            {isStudent && (
              <Link to="/create-project" className="btn btn-primary">
                Create Your First Project
              </Link>
            )}
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
                  {isStudent && project.guide && (
                    <span style={styles.guide}>
                      👨‍🏫 Guide: {project.guide.name}
                    </span>
                  )}
                  {!isStudent && project.group && (
                    <span style={styles.group}>
                      👥 Group: {project.group.groupName}
                    </span>
                  )}
                  {project.submissions && project.submissions.length > 0 && (
                    <span style={styles.submissions}>
                      📄 {project.submissions.length} submission(s)
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isStudent && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          <div style={styles.actionGrid}>
            <Link to="/ai-reviewer" className="card" style={styles.actionCard}>
              <div style={styles.actionIcon}>🤖</div>
              <h3>AI Abstract Reviewer</h3>
              <p>Get instant AI feedback on your project abstract</p>
            </Link>
            <Link to="/projects" className="card" style={styles.actionCard}>
              <div style={styles.actionIcon}>📊</div>
              <h3>View All Projects</h3>
              <p>See all your group projects and submissions</p>
            </Link>
            <Link to="/join-group" className="card" style={styles.actionCard}>
              <div style={styles.actionIcon}>👥</div>
              <h3>Join a Group</h3>
              <p>Search and join an existing project group</p>
            </Link>
          </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
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
    fontSize: '13px',
    color: '#6b7280',
  },
  guide: {},
  group: {},
  submissions: {},
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  actionCard: {
    textAlign: 'center',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s',
  },
  actionIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
};

