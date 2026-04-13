import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProjectReportPayload } from '../services/reportService';

type PdfDoc = jsPDF & { lastAutoTable?: { finalY: number } };

function truncate(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatPerson(value: unknown): string {
  if (!value || typeof value !== 'object') return '—';
  const o = value as Record<string, unknown>;
  const name = o.name != null ? String(o.name) : '';
  const email = o.email != null ? String(o.email) : '';
  if (name && email) return `${name} (${email})`;
  return name || email || '—';
}

function formatMembers(members: unknown[]): string {
  if (!members?.length) return '—';
  const parts = members
    .map((m) => {
      if (!m || typeof m !== 'object') return '';
      const o = m as Record<string, unknown>;
      const u = o.user;
      if (u && typeof u === 'object') return formatPerson(u);
      return formatPerson(m);
    })
    .filter(Boolean);
  return parts.length ? parts.join('; ') : '—';
}

function formatAiReview(value: unknown): string {
  if (!value || typeof value !== 'object') return '—';
  const o = value as Record<string, unknown>;
  const rating = o.rating != null ? `Rating ${o.rating}` : '';
  const text =
    o.reviewText != null ? truncate(String(o.reviewText), 160) : '';
  return [rating, text].filter(Boolean).join('. ') || '—';
}

function formatGuideReviews(reviews: unknown[]): string {
  if (!reviews?.length) return '—';
  const parts = reviews.map((gr) => {
    if (!gr || typeof gr !== 'object') return '';
    const o = gr as Record<string, unknown>;
    const guide = o.guide as Record<string, unknown> | undefined;
    const name = guide?.name != null ? String(guide.name) : 'Guide';
    const rating = o.rating != null ? String(o.rating) : '';
    return rating ? `${name} (${rating})` : name;
  });
  return parts.filter(Boolean).join('; ') || '—';
}

/**
 * Build a printable PDF from the API project report payload and trigger download.
 */
export function downloadProjectReportPdf(
  report: ProjectReportPayload,
  filenameBase: string
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as PdfDoc;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Project report', margin, y);
  y += 9;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const projBits = [
    `Title: ${report.project.title}`,
    `Status: ${report.project.status}`,
    `Created: ${new Date(report.project.createdAt).toLocaleString()}`,
  ];
  if (report.project.description) {
    projBits.push(`Description: ${truncate(report.project.description, 700)}`);
  }
  projBits.forEach((line) => {
    const lines = doc.splitTextToSize(line, pageW - margin * 2);
    lines.forEach((t: string) => {
      if (y > 275) {
        doc.addPage();
        y = 16;
      }
      doc.text(t, margin, y);
      y += 4.5;
    });
    y += 1;
  });
  y += 3;

  if (y > 240) {
    doc.addPage();
    y = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Group', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const groupLines = [
    `Name: ${report.group.name}`,
    `Leader: ${formatPerson(report.group.leader)}`,
    `Members: ${formatMembers(report.group.members)}`,
  ];
  groupLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
    wrapped.forEach((t: string) => {
      if (y > 275) {
        doc.addPage();
        y = 16;
      }
      doc.text(t, margin, y);
      y += 4.5;
    });
  });
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Guide', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const guideText = report.guide
    ? `${report.guide.name} (${report.guide.email})`
    : 'Not assigned';
  doc.splitTextToSize(guideText, pageW - margin * 2).forEach((t: string) => {
    if (y > 275) {
      doc.addPage();
      y = 16;
    }
    doc.text(t, margin, y);
    y += 4.5;
  });
  y += 4;

  const statsBody = [
    ['Total submissions', String(report.statistics.totalSubmissions)],
    ['Approved submissions', String(report.statistics.approvedSubmissions)],
    ['Under review', String(report.statistics.underReviewSubmissions)],
    ['Needs revision', String(report.statistics.needsRevisionSubmissions)],
    [
      'Average AI rating',
      Number.isFinite(report.statistics.averageAIRating)
        ? report.statistics.averageAIRating.toFixed(2)
        : '—',
    ],
    [
      'Average guide rating',
      Number.isFinite(report.statistics.averageGuideRating)
        ? report.statistics.averageGuideRating.toFixed(2)
        : '—',
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: statsBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  const subBody = report.submissions.map((s) => [
    String(s.submissionId),
    new Date(s.submissionDate).toLocaleString(),
    s.status,
    truncate(s.abstractText ? String(s.abstractText) : '—', 90),
    truncate(formatAiReview(s.aiReview), 70),
    truncate(formatGuideReviews(s.guideReviews), 70),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Submitted', 'Status', 'Abstract', 'AI review', 'Guide']],
    body: subBody.length ? subBody : [['—', '—', '—', 'No submissions', '—', '—']],
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 26 },
      2: { cellWidth: 20 },
      3: { cellWidth: 36 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
  });

  const safe = filenameBase.replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 64);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${safe}-${stamp}.pdf`);
}
