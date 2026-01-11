import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { submissionService } from '../services/submissionService';
import { reviewService } from '../services/reviewService';
import type { Submission } from '../types';

export const GuideReviewSubmission = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Review form
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [status, setStatus] = useState('UnderReview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      const { submission } = await submissionService.getSubmissionById(parseInt(submissionId!));
      setSubmission(submission);
      setStatus(submission.status);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
      setError('Failed to load submission');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comments.trim()) {
      setError('Please enter your review comments');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Submit guide review
      await reviewService.createGuideReview({
        submissionId: parseInt(submissionId!),
        comments,
        rating,
      });

      // Update submission status if changed
      if (status !== submission?.status) {
        await submissionService.updateSubmissionStatus(parseInt(submissionId!), status);
      }

      setSuccess('Review submitted successfully!');
      setComments('');
      
      // Refresh submission
      setTimeout(() => {
        fetchSubmission();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
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

  if (!submission) {
    return (
      <div className="container">
        <div className="alert alert-error">Submission not found</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <Link to="/" style={styles.backLink}>← Back to Dashboard</Link>
          <h1 style={{ marginTop: '8px' }}>Review Submission</h1>
        </div>
      </div>

      {/* Submission Details */}
      <div className="card">
        <h2 style={styles.sectionTitle}>Submission Details</h2>
        
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Project:</span>
            <span style={styles.detailValue}>{submission.project?.title}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Group:</span>
            <span style={styles.detailValue}>{submission.project?.group?.groupName}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Submitted:</span>
            <span style={styles.detailValue}>
              {new Date(submission.submissionDate).toLocaleString()}
            </span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Current Status:</span>
            <span className={`badge badge-${getStatusColor(submission.status)}`}>
              {submission.status}
            </span>
          </div>
        </div>
      </div>

      {/* Group Members */}
      {submission.project?.group?.members && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Group Members</h2>
          <div style={styles.membersList}>
            {submission.project.group.members.map((member) => (
              <div key={member.id} style={styles.memberItem}>
                <span>{member.user?.name}</span>
                <span className="badge badge-gray">{member.roleInGroup}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abstract Text */}
      {submission.abstractText && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Abstract</h2>
          <div style={styles.abstractBox}>
            <p style={styles.abstractText}>{submission.abstractText}</p>
          </div>
        </div>
      )}

      {/* Document Download */}
      {submission.documentUrl && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Supporting Documents</h2>
          <a
            href={`http://localhost:5000${submission.documentUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            📥 Download Document
          </a>
        </div>
      )}

      {/* AI Review */}
      {submission.aiReviews && submission.aiReviews.length > 0 && (
        <div className="card">
          <h2 style={styles.sectionTitle}>🤖 AI Review</h2>
          {submission.aiReviews.map((aiReview) => (
            <div key={aiReview.reviewId} style={styles.aiReviewBox}>
              <div style={styles.ratingDisplay}>
                <span style={styles.ratingLabel}>AI Rating:</span>
                <span style={styles.ratingValue}>{aiReview.rating}/10</span>
              </div>
              <div style={styles.reviewSection}>
                <strong>Feedback:</strong>
                <p style={styles.reviewText}>{aiReview.reviewText}</p>
              </div>
              {aiReview.suggestions && (
                <div style={styles.reviewSection}>
                  <strong>Suggestions:</strong>
                  <p style={styles.reviewText}>{aiReview.suggestions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Previous Guide Reviews */}
      {submission.guideReviews && submission.guideReviews.length > 0 && (
        <div className="card">
          <h2 style={styles.sectionTitle}>Previous Reviews</h2>
          {submission.guideReviews.map((review) => (
            <div key={review.reviewId} style={styles.previousReviewBox}>
              <div style={styles.reviewHeader}>
                <span style={styles.reviewerName}>
                  👨‍🏫 {review.guide?.name}
                </span>
                <span style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={styles.reviewRating}>
                Rating: <strong>{review.rating}/10</strong>
              </div>
              <p style={styles.reviewText}>{review.comments}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add Review Form */}
      <div className="card">
        <h2 style={styles.sectionTitle}>Add Your Review</h2>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="input-group">
          <label>Rating (0-10) *</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
          />
        </div>

        <div className="input-group">
          <label>Update Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="NeedsRevision">Needs Revision</option>
          </select>
        </div>

        <div className="input-group">
          <label>Comments *</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Provide detailed feedback to the students..."
            style={{ minHeight: '150px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSubmitReview}
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : '✅ Submit Review'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
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
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '15px',
    color: '#1f2937',
    fontWeight: '600',
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
  abstractBox: {
    backgroundColor: '#f9fafb',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  abstractText: {
    color: '#374151',
    lineHeight: '1.7',
    fontSize: '15px',
    whiteSpace: 'pre-wrap',
  },
  aiReviewBox: {
    backgroundColor: '#eff6ff',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #3b82f6',
  },
  ratingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  ratingLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
  },
  ratingValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  reviewSection: {
    marginBottom: '16px',
  },
  reviewText: {
    marginTop: '8px',
    color: '#374151',
    lineHeight: '1.6',
  },
  previousReviewBox: {
    backgroundColor: '#f0fdf4',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #10b981',
    marginBottom: '12px',
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  reviewerName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewDate: {
    fontSize: '13px',
    color: '#6b7280',
  },
  reviewRating: {
    fontSize: '14px',
    color: '#065f46',
    marginBottom: '8px',
  },
};

