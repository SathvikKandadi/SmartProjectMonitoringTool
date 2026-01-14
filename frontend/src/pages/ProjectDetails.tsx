import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { submissionService } from '../services/submissionService';
import { reviewService } from '../services/reviewService';
import { useAuthStore } from '../store/authStore';
import type { Project, Submission } from '../types';

export const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Submission form
  const [abstractText, setAbstractText] = useState('');
  const [abstractInputMode, setAbstractInputMode] = useState<'text' | 'pdf'>('text');
  const [abstractPDF, setAbstractPDF] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // Project status update (for guides) - MOVED TO TOP TO FIX HOOKS ORDER
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newProjectStatus, setNewProjectStatus] = useState('');
  
  // Edit project details
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);
  
  // Comments system
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchComments();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const { project } = await projectService.getProjectById(parseInt(projectId!));
      setProject(project);
      setEditTitle(project.title);
      setEditDescription(project.description || '');
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { comments: projectComments } = await projectService.getProjectComments(parseInt(projectId!));
      setComments(projectComments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmit = async () => {
    if (abstractInputMode === 'text' && !abstractText.trim()) {
      alert('Please enter your abstract text');
      return;
    }

    if (abstractInputMode === 'pdf' && !abstractPDF) {
      alert('Please select an abstract PDF file');
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = {
        projectId: parseInt(projectId!),
        abstractText: abstractInputMode === 'text' ? abstractText : undefined,
        abstractPDF: abstractInputMode === 'pdf' ? abstractPDF : undefined,
        file: file || undefined,
      };

      const { submission } = await submissionService.createSubmission(submissionData);
      
      // Get AI review
      if (submission.submissionId) {
        if (abstractInputMode === 'text' && abstractText) {
          await reviewService.analyzeAbstract(abstractText, submission.submissionId);
        } else if (abstractInputMode === 'pdf' && abstractPDF) {
          await reviewService.analyzeAbstractPDF(abstractPDF, submission.submissionId);
        }
      }

      setAbstractText('');
      setAbstractPDF(null);
      setFile(null);
      fetchProject(); // Refresh project data
      alert('Submission created successfully! AI review in progress...');
    } catch (error) {
      console.error('Failed to create submission:', error);
      alert('Failed to create submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container">
        <div className="alert alert-error">Project not found</div>
      </div>
    );
  }

  const isStudent = user?.role === 'Student';
  const isGuide = user?.role === 'Guide';
  const canViewAndComment = !isStudent; // All non-students can view and comment

  const handleUpdateProjectStatus = async () => {
    if (!newProjectStatus) return;

    setUpdatingStatus(true);
    try {
      await projectService.updateProjectStatus(parseInt(projectId!), newProjectStatus);
      alert('Project status updated successfully!');
      fetchProject(); // Refresh
      setNewProjectStatus('');
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('Failed to update project status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editTitle.trim()) {
      alert('Project title is required');
      return;
    }

    setUpdatingProject(true);
    try {
      await projectService.updateProject(parseInt(projectId!), {
        title: editTitle,
        description: editDescription,
      });
      alert('Project details updated successfully!');
      fetchProject();
      setIsEditingProject(false);
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project details');
    } finally {
      setUpdatingProject(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setPostingComment(true);
    try {
      await projectService.addProjectComment(parseInt(projectId!), newComment);
      setNewComment('');
      fetchComments();
      alert('Comment posted successfully!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <Link to="/" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={{ marginTop: '8px' }}>{project.title}</h1>
          <div style={styles.metadata}>
            <span className={`badge badge-${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <span style={styles.metaItem}>
              👥 Group: {project.group?.groupName}
            </span>
            {project.guide && (
              <span style={styles.metaItem}>
                👨‍🏫 Guide: {project.guide.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={styles.sectionTitle}>Project Details</h2>
          {!isEditingProject && (
            <button
              onClick={() => setIsEditingProject(true)}
              className="btn btn-outline btn-sm"
            >
              ✏️ Edit Details
            </button>
          )}
        </div>

        {isEditingProject ? (
          <div>
            <div className="input-group">
              <label>Project Title *</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>

            <div className="input-group">
              <label>Project Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter project description"
                style={{ minHeight: '120px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleUpdateProject}
                className="btn btn-primary"
                disabled={updatingProject}
              >
                {updatingProject ? 'Saving...' : '✅ Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditingProject(false);
                  setEditTitle(project.title);
                  setEditDescription(project.description || '');
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p><strong>Title:</strong> {project.title}</p>
            <p style={{ marginTop: '12px' }}>
              <strong>Description:</strong><br />
              {project.description || 'No description provided'}
            </p>
          </div>
        )}
        
        {canViewAndComment && !isEditingProject && (
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
              Update Project Status
            </h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={newProjectStatus}
                onChange={(e) => setNewProjectStatus(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              >
                <option value="">Select new status...</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button
                onClick={handleUpdateProjectStatus}
                className="btn btn-primary btn-sm"
                disabled={!newProjectStatus || updatingStatus}
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={styles.sectionTitle}>Group Members</h2>
        <div style={styles.membersList}>
          {project.group?.members?.map((member) => (
            <div key={member.id} style={styles.memberItem}>
              <span>{member.user?.name}</span>
              <span className="badge badge-gray">{member.roleInGroup}</span>
            </div>
          ))}
        </div>
      </div>

      {isStudent && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Submit New Version</h2>
          
          {/* Abstract Input Mode Toggle */}
          <div style={styles.toggleContainer}>
            <button
              onClick={() => {
                setAbstractInputMode('text');
                setAbstractPDF(null);
              }}
              className={abstractInputMode === 'text' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            >
              📝 Type Abstract
            </button>
            <button
              onClick={() => {
                setAbstractInputMode('pdf');
                setAbstractText('');
              }}
              className={abstractInputMode === 'pdf' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            >
              📄 Upload Abstract PDF
            </button>
          </div>

          {abstractInputMode === 'text' ? (
            <div className="input-group">
              <label>Abstract Text *</label>
              <textarea
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="Enter your project abstract..."
                style={{ minHeight: '150px' }}
              />
            </div>
          ) : (
            <div className="input-group">
              <label>Upload Abstract PDF *</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setAbstractPDF(e.target.files?.[0] || null)}
              />
              {abstractPDF && (
                <div style={styles.fileSelected}>
                  ✅ Selected: {abstractPDF.name}
                </div>
              )}
              <small style={{ color: '#6b7280', marginTop: '4px' }}>
                Upload a PDF containing your abstract - text will be extracted automatically
              </small>
            </div>
          )}

          <div className="input-group">
            <label>Upload Supporting Document (Optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div style={styles.fileSelected}>
                ✅ Selected: {file.name}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '📤 Submit & Get AI Review'}
          </button>
        </div>
      )}

      <div className="card">
        <h2 style={styles.sectionTitle}>Submissions</h2>
        
        {!project.submissions || project.submissions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No submissions yet</p>
        ) : (
          <div style={styles.submissionsList}>
            {project.submissions.map((submission: Submission) => (
              <div key={submission.submissionId} style={styles.submissionItem}>
                <div style={styles.submissionHeader}>
                  <span style={styles.submissionDate}>
                    {new Date(submission.submissionDate).toLocaleString()}
                  </span>
                  <span className={`badge badge-${getSubmissionStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </div>

                {submission.abstractText && (
                  <p style={styles.abstractText}>{submission.abstractText}</p>
                )}

                {submission.aiReviews && submission.aiReviews.length > 0 && (
                  <div style={styles.aiReview}>
                    <strong>🤖 AI Review:</strong>
                    <div style={styles.reviewRating}>
                      Rating: {submission.aiReviews[0].rating}/10
                    </div>
                    <p>{submission.aiReviews[0].reviewText}</p>
                  </div>
                )}

                {submission.guideReviews && submission.guideReviews.length > 0 && (
                  <div style={styles.guideReview}>
                    <strong>👨‍🏫 Guide Review:</strong>
                    {submission.guideReviews.map((review) => (
                      <div key={review.reviewId} style={styles.reviewItem}>
                        <div style={styles.reviewRating}>
                          {review.guide?.name} - Rating: {review.rating}/10
                        </div>
                        <p>{review.comments}</p>
                      </div>
                    ))}
                  </div>
                )}

                {isGuide && (
                  <div style={styles.guideActions}>
                    <Link
                      to={`/review-submission/${submission.submissionId}`}
                      className="btn btn-primary btn-sm"
                    >
                      ✍️ Add Review
                    </Link>
                  </div>
                )}

                {canViewAndComment && !isGuide && !isStudent && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#92400e' }}>
                      ℹ️ Only Guides can submit reviews. You can view project details and add comments.
                    </span>
                  </div>
                )}

                {isStudent && submission.guideReviews && submission.guideReviews.length === 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#92400e' }}>
                      ⏳ Waiting for guide review...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="card">
        <h2 style={styles.sectionTitle}>💬 Discussion & Comments</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
          Communicate with {isStudent ? 'your guide' : 'students'} about this project
        </p>

        {/* Post New Comment */}
        <div style={styles.commentForm}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Write your comment or question here...`}
            style={{ 
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <button
            onClick={handlePostComment}
            className="btn btn-primary"
            disabled={postingComment || !newComment.trim()}
            style={{ marginTop: '12px' }}
          >
            {postingComment ? 'Posting...' : '📤 Post Comment'}
          </button>
        </div>

        {/* Comments List */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            Comments ({comments.length})
          </h3>

          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="spinner" />
            </div>
          ) : comments.length === 0 ? (
            <div style={styles.emptyComments}>
              <p>No comments yet. Be the first to start the discussion!</p>
            </div>
          ) : (
            <div style={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.commentId} style={styles.commentItem}>
                  <div style={styles.commentHeader}>
                    <div style={styles.commentAuthor}>
                      <span style={styles.commentAuthorName}>
                        {comment.user?.name}
                      </span>
                      <span className={`badge badge-${comment.user?.role === 'Student' ? 'primary' : 'success'}`}>
                        {comment.user?.role}
                      </span>
                    </div>
                    <span style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={styles.commentText}>{comment.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'success';
    case 'Rejected': return 'danger';
    default: return 'warning';
  }
};

const getSubmissionStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'success';
    case 'NeedsRevision': return 'warning';
    default: return 'primary';
  }
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    marginBottom: '30px',
  },
  backLink: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontSize: '14px',
  },
  metadata: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: '14px',
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  submissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  submissionItem: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  submissionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  submissionDate: {
    fontSize: '14px',
    color: '#6b7280',
  },
  abstractText: {
    color: '#374151',
    fontSize: '14px',
    marginBottom: '12px',
  },
  aiReview: {
    backgroundColor: '#eff6ff',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '14px',
  },
  guideReview: {
    backgroundColor: '#f0fdf4',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  reviewItem: {
    marginTop: '8px',
  },
  reviewRating: {
    fontWeight: '600',
    marginBottom: '4px',
  },
  guideActions: {
    marginTop: '12px',
  },
  toggleContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  fileSelected: {
    marginTop: '8px',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '500',
  },
  commentForm: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  emptyComments: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  commentItem: {
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  commentAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  commentAuthorName: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#1f2937',
  },
  commentDate: {
    fontSize: '13px',
    color: '#9ca3af',
  },
  commentText: {
    color: '#374151',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: 0,
  },
};

