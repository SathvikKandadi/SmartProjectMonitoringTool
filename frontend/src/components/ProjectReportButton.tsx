import { useState } from 'react';
import { reportService } from '../services/reportService';
import { downloadProjectReportPdf } from '../utils/projectReportPdf';

type Props = {
  projectId: number;
  projectTitle?: string;
  className?: string;
};

export const ProjectReportButton = ({
  projectId,
  projectTitle,
  className = 'btn btn-outline btn-sm',
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const { report } = await reportService.getProjectReport(projectId);
      const safeTitle = (projectTitle || report.project.title || 'project')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .slice(0, 48);
      downloadProjectReportPdf(report, `project-report-${projectId}-${safeTitle}`);
    } catch (err) {
      console.error('Report download failed:', err);
      window.alert(
        'Could not generate the PDF report. You may not have access to this project, or the server returned an error.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      disabled={loading}
      onClick={handleClick}
      aria-busy={loading}
    >
      {loading ? 'Generating…' : 'Download PDF report'}
    </button>
  );
};
