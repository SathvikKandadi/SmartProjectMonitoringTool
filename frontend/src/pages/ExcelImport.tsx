import { useState } from 'react';
import api from '../config/api';

export const ExcelImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/excel/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data.results);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/excel/template', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1>📊 Excel Data Import</h1>
          <p style={styles.subtitle}>
            Bulk import users, groups, and projects from Excel
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={styles.sectionTitle}>Download Template</h2>
        <p style={{ marginBottom: '16px', color: '#6b7280' }}>
          Download the Excel template with sample data and required format
        </p>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary">
          ⬇️ Download Template
        </button>
      </div>

      <div className="card">
        <h2 style={styles.sectionTitle}>Upload Excel File</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div className="input-group">
          <label>Select Excel file (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          {file && (
            <div style={styles.fileName}>
              Selected: {file.name}
            </div>
          )}
        </div>

        <button
          onClick={handleUpload}
          className="btn btn-primary"
          disabled={loading || !file}
        >
          {loading ? 'Importing...' : '📤 Import Data'}
        </button>
      </div>

      {loading && (
        <div className="card">
          <div className="loading">
            <div className="spinner" />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>
              Importing data... This may take a moment.
            </p>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="card">
          <h2 style={styles.sectionTitle}>✅ Import Results</h2>

          {result.summary && (
            <div className="alert alert-info" style={{ marginBottom: '20px' }}>
              <strong>Summary:</strong> Created/Found {result.summary.totalUsers} users, {result.summary.totalGroups} groups, {result.summary.totalMembers} group memberships, and {result.summary.totalProjects} projects.
            </div>
          )}

          <div style={styles.resultsGrid}>
            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>👤 Users</h3>
              <div style={styles.resultStats}>
                <div style={styles.statItem}>
                  <span className="badge badge-success">
                    {result.users.created} Created
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span className="badge badge-warning">
                    {result.users.skipped} Skipped
                  </span>
                </div>
                {result.users.errors.length > 0 && (
                  <div style={styles.statItem}>
                    <span className="badge badge-danger">
                      {result.users.errors.length} Errors
                    </span>
                  </div>
                )}
              </div>
              {result.users.errors.length > 0 && (
                <div style={styles.errorList}>
                  {result.users.errors.slice(0, 5).map((err: string, idx: number) => (
                    <div key={idx} style={styles.errorItem}>
                      {err}
                    </div>
                  ))}
                  {result.users.errors.length > 5 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      ... and {result.users.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>👥 Groups</h3>
              <div style={styles.resultStats}>
                <div style={styles.statItem}>
                  <span className="badge badge-success">
                    {result.groups.created} Created
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span className="badge badge-warning">
                    {result.groups.skipped} Skipped
                  </span>
                </div>
                {result.groups.errors.length > 0 && (
                  <div style={styles.statItem}>
                    <span className="badge badge-danger">
                      {result.groups.errors.length} Errors
                    </span>
                  </div>
                )}
              </div>
              {result.groups.errors.length > 0 && (
                <div style={styles.errorList}>
                  {result.groups.errors.slice(0, 5).map((err: string, idx: number) => (
                    <div key={idx} style={styles.errorItem}>
                      {err}
                    </div>
                  ))}
                  {result.groups.errors.length > 5 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      ... and {result.groups.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              )}
            </div>

            {result.groupMembers && (
              <div style={styles.resultCard}>
                <h3 style={styles.resultTitle}>🔗 Group Members</h3>
                <div style={styles.resultStats}>
                  <div style={styles.statItem}>
                    <span className="badge badge-success">
                      {result.groupMembers.added} Added
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span className="badge badge-warning">
                      {result.groupMembers.skipped} Skipped
                    </span>
                  </div>
                  {result.groupMembers.errors.length > 0 && (
                    <div style={styles.statItem}>
                      <span className="badge badge-danger">
                        {result.groupMembers.errors.length} Errors
                      </span>
                    </div>
                  )}
                </div>
                {result.groupMembers.errors.length > 0 && (
                  <div style={styles.errorList}>
                    {result.groupMembers.errors.slice(0, 5).map((err: string, idx: number) => (
                      <div key={idx} style={styles.errorItem}>
                        {err}
                      </div>
                    ))}
                    {result.groupMembers.errors.length > 5 && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                        ... and {result.groupMembers.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>📊 Projects</h3>
              <div style={styles.resultStats}>
                <div style={styles.statItem}>
                  <span className="badge badge-success">
                    {result.projects.created} Created
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span className="badge badge-warning">
                    {result.projects.skipped} Skipped
                  </span>
                </div>
                {result.projects.errors.length > 0 && (
                  <div style={styles.statItem}>
                    <span className="badge badge-danger">
                      {result.projects.errors.length} Errors
                    </span>
                  </div>
                )}
              </div>
              {result.projects.errors.length > 0 && (
                <div style={styles.errorList}>
                  {result.projects.errors.slice(0, 5).map((err: string, idx: number) => (
                    <div key={idx} style={styles.errorItem}>
                      {err}
                    </div>
                  ))}
                  {result.projects.errors.length > 5 && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                      ... and {result.projects.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={styles.sectionTitle}>📝 Import Instructions</h2>
        
        <div style={styles.instructionSection}>
          <h3 style={styles.instructionTitle}>Excel Format</h3>
          <p>The template contains a single sheet named <strong>"ProjectData"</strong> with the following columns:</p>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Column</th>
                <th style={styles.th}>Required</th>
                <th style={styles.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}><strong>studentName</strong></td>
                <td style={styles.td}>✅ Yes</td>
                <td style={styles.td}>Full name of the student</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>studentEmail</strong></td>
                <td style={styles.td}>✅ Yes</td>
                <td style={styles.td}>Student's email (must be unique)</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>groupName</strong></td>
                <td style={styles.td}>✅ Yes</td>
                <td style={styles.td}>Name of the project group</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>leaderEmail</strong></td>
                <td style={styles.td}>✅ Yes</td>
                <td style={styles.td}>Email of group leader (must be a student)</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>projectTitle</strong></td>
                <td style={styles.td}>✅ Yes</td>
                <td style={styles.td}>Title of the project</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>projectDescription</strong></td>
                <td style={styles.td}>⚪ No</td>
                <td style={styles.td}>Detailed project description</td>
              </tr>
              <tr>
                <td style={styles.td}><strong>guideEmail</strong></td>
                <td style={styles.td}>⚪ No</td>
                <td style={styles.td}>Email of assigned guide/mentor</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={styles.instructionSection}>
          <h3 style={styles.instructionTitle}>⚠️ Important Notes</h3>
          <ul style={styles.instructionsList}>
            <li>
              <strong>Default Password:</strong> All users (students and guides) will be created with password: <code style={styles.code}>default@123</code>
            </li>
            <li>
              <strong>Multiple Students:</strong> Add one row per student. Students in the same group should have the same groupName, projectTitle, and leaderEmail
            </li>
            <li>
              <strong>Example:</strong> If Team Alpha has 3 members, add 3 rows with the same groupName but different studentName and studentEmail
            </li>
            <li>
              <strong>Leader:</strong> The leaderEmail must match one of the studentEmail entries in the group
            </li>
            <li>
              <strong>Guides:</strong> Will be automatically created if they don't exist. Name is derived from email
            </li>
            <li>
              <strong>Duplicates:</strong> Existing users, groups, and projects will be skipped (not duplicated)
            </li>
            <li>
              <strong>After Import:</strong> Students can login and update project title/description. Guides can also update and reassign
            </li>
          </ul>
        </div>

        <div style={styles.exampleSection}>
          <h3 style={styles.instructionTitle}>📋 Example Data</h3>
          <div style={styles.exampleBox}>
            <p><strong>Team Alpha (3 members):</strong></p>
            <pre style={styles.examplePre}>
Row 1: John Doe | john@college.edu | Team Alpha | john@college.edu | AI Healthcare | ... | dr.smith@college.edu{'\n'}
Row 2: Jane Smith | jane@college.edu | Team Alpha | john@college.edu | AI Healthcare | ... | dr.smith@college.edu{'\n'}
Row 3: Bob Wilson | bob@college.edu | Team Alpha | john@college.edu | AI Healthcare | ... | dr.smith@college.edu
            </pre>
            <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '13px' }}>
              ✅ Same group, same project, same leader and guide - creates 1 group, 1 project, 3 members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    marginBottom: '30px',
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  fileInput: {
    padding: '8px',
  },
  fileName: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '500',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  resultCard: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
  },
  resultTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  resultStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  statItem: {},
  errorList: {
    marginTop: '12px',
    fontSize: '13px',
  },
  errorItem: {
    padding: '6px 8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  instructionSection: {
    marginBottom: '24px',
  },
  instructionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#1f2937',
  },
  instructionsList: {
    lineHeight: '1.8',
    color: '#374151',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f3f4f6',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#ef4444',
  },
  exampleSection: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    borderLeft: '4px solid #3b82f6',
  },
  exampleBox: {
    marginTop: '12px',
  },
  examplePre: {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'monospace',
    lineHeight: '1.6',
  },
};

