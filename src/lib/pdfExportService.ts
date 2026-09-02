import jsPDF from 'jspdf';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  studentName?: string;
  date?: string;
  engineName: string;
  score?: number;
  sections: Array<{
    heading: string;
    content?: string | string[];
    items?: Array<{ label?: string; value: string; secondary?: string }>;
  }>;
}

/**
 * Universal Student Digital Twin PDF Export Engine
 * Generates high-density, beautifully formatted, print-ready reports.
 */
export async function generateStyledPDF(options: PDFExportOptions, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const addHeader = (pageNum: number, totalPages: number) => {
    // Top Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('STUDENT DIGITAL TWIN OS  •  AI CAREER INTELLIGENCE PLATFORM', margin, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const dateStr = options.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    doc.text(dateStr, pageWidth - margin, 8, { align: 'right' });

    // Bottom Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Official Academic & Technical Record  •  ${options.engineName}`, margin, pageHeight - 6);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  // Title Box
  cursorY = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(options.title, margin + 5, cursorY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const sub = options.subtitle || `Candidate: ${options.studentName || 'Verified Scholar'}`;
  doc.text(sub, margin + 5, cursorY + 15);

  if (typeof options.score === 'number') {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageWidth - margin - 28, cursorY + 4, 24, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${options.score}`, pageWidth - margin - 16, cursorY + 11, { align: 'center' });
    doc.setFontSize(6);
    doc.text('/ 100 PTS', pageWidth - margin - 16, cursorY + 16, { align: 'center' });
  }

  cursorY += 30;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 16) {
      doc.addPage();
      cursorY = 20;
    }
  };

  // Render Sections
  for (const section of options.sections) {
    checkPageBreak(15);

    // Section Heading
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(margin, cursorY, margin, cursorY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(section.heading.toUpperCase(), margin + 3, cursorY + 4.5);
    cursorY += 9;

    // Direct Text Content
    if (section.content) {
      const textLines = Array.isArray(section.content) ? section.content : [section.content];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      for (const line of textLines) {
        const splitText = doc.splitTextToSize(line, contentWidth - 4);
        checkPageBreak(splitText.length * 4.2 + 2);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 4.2 + 1.5;
      }
      cursorY += 2;
    }

    // Key-Value or List Items
    if (section.items && section.items.length > 0) {
      for (const item of section.items) {
        checkPageBreak(8);

        if (item.label) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(`• ${item.label}:`, margin + 2, cursorY);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const labelWidth = doc.getTextWidth(`• ${item.label}: `);
          const valLines = doc.splitTextToSize(item.value, contentWidth - labelWidth - 4);
          doc.text(valLines, margin + 2 + labelWidth, cursorY);
          cursorY += Math.max(valLines.length * 3.8, 4.5);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const splitVal = doc.splitTextToSize(`• ${item.value}`, contentWidth - 4);
          checkPageBreak(splitVal.length * 3.8 + 2);
          doc.text(splitVal, margin + 2, cursorY);
          cursorY += splitVal.length * 3.8 + 1.5;
        }

        if (item.secondary) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          const secLines = doc.splitTextToSize(`   ${item.secondary}`, contentWidth - 6);
          checkPageBreak(secLines.length * 3.5);
          doc.text(secLines, margin + 2, cursorY);
          cursorY += secLines.length * 3.5 + 1;
        }
      }
      cursorY += 2;
    }

    cursorY += 3;
  }

  // Add Headers & Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader(i, totalPages);
  }

  const safeName = (filename || `${options.engineName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.pdf`).replace(/\.pdf$/i, '') + '.pdf';
  doc.save(safeName);
}

/**
 * Generate ATS Compliant Single-Column Resume PDF
 */
export async function generateResumePDF(data: {
  name: string;
  role: string;
  university: string;
  degree?: string;
  branch?: string;
  year?: string;
  cgpa?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  summary: string;
  skills: string[];
  projects: Array<{ title: string; techStack: string[]; description: string }>;
  achievements?: Array<{ title: string; issuer?: string; date?: string }>;
}, filename: string = 'Resume.pdf'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 14) {
      doc.addPage();
      cursorY = 16;
    }
  };

  // Header: Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(data.name.toUpperCase(), pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${data.role} | ${data.university}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  // Links line
  const links = [
    data.githubUrl ? `GitHub: ${data.githubUrl.replace(/^https?:\/\//, '')}` : null,
    data.linkedinUrl ? `LinkedIn: ${data.linkedinUrl.replace(/^https?:\/\//, '')}` : null,
  ].filter(Boolean).join('  |  ');
  if (links) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(links, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  const renderSectionHeading = (title: string) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), margin, cursorY);
    cursorY += 2;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 5;
  };

  // 1. Professional Summary
  if (data.summary) {
    renderSectionHeading('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const sumLines = doc.splitTextToSize(data.summary, contentWidth);
    doc.text(sumLines, margin, cursorY);
    cursorY += sumLines.length * 4 + 4;
  }

  // 2. Education
  renderSectionHeading('Education');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.university, margin, cursorY);
  if (data.year) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${data.year} Year`, pageWidth - margin, cursorY, { align: 'right' });
  }
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const degreeLine = [data.degree, data.branch, data.cgpa ? `CGPA: ${data.cgpa}/10.0` : null].filter(Boolean).join(' • ');
  doc.text(degreeLine, margin, cursorY);
  cursorY += 6;

  // 3. Technical Skills
  if (data.skills && data.skills.length > 0) {
    renderSectionHeading('Technical Skills');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const skillText = `Languages, Frameworks & Systems: ${data.skills.join(', ')}`;
    const skillLines = doc.splitTextToSize(skillText, contentWidth);
    doc.text(skillLines, margin, cursorY);
    cursorY += skillLines.length * 4 + 4;
  }

  // 4. Projects
  if (data.projects && data.projects.length > 0) {
    renderSectionHeading('Verified Projects');
    for (const proj of data.projects) {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title, margin, cursorY);

      if (proj.techStack && proj.techStack.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(proj.techStack.join(' • '), pageWidth - margin, cursorY, { align: 'right' });
      }
      cursorY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const descLines = doc.splitTextToSize(`• ${proj.description}`, contentWidth);
      doc.text(descLines, margin, cursorY);
      cursorY += descLines.length * 4 + 3;
    }
  }

  // 5. Honors & Achievements
  if (data.achievements && data.achievements.length > 0) {
    renderSectionHeading('Honors & Achievements');
    for (const ach of data.achievements) {
      checkPageBreak(8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const achText = `• ${ach.title}${ach.issuer ? ` — ${ach.issuer}` : ''}${ach.date ? ` (${ach.date})` : ''}`;
      const achLines = doc.splitTextToSize(achText, contentWidth);
      doc.text(achLines, margin, cursorY);
      cursorY += achLines.length * 4 + 1.5;
    }
  }

  doc.save(filename);
}

/**
 * Generate Audit Report PDF for Project, GitHub, LinkedIn, and Internship Diagnostics
 */
export async function generateAuditReportPDF(data: {
  type: string;
  title: string;
  candidateName: string;
  score: number;
  maxScore: number;
  evaluation: string;
  breakdown: Array<{ label: string; score: number; max: number }>;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}, filename?: string): Promise<void> {
  const sections: PDFExportOptions['sections'] = [
    {
      heading: '1. Executive Diagnostic Evaluation',
      items: [
        { label: 'Evaluation Target', value: data.title },
        { label: 'Candidate', value: data.candidateName },
        { label: 'Overall Calibrated Score', value: `${data.score} / ${data.maxScore} (${data.evaluation})` },
      ],
    },
    {
      heading: '2. Competency Breakdown & Scorecard',
      items: data.breakdown.map((b) => ({
        label: b.label,
        value: `${b.score} / ${b.max} PTS (${Math.round((b.score / b.max) * 100)}%)`,
      })),
    },
    {
      heading: '3. Verified Strengths & Highlights',
      items: data.strengths.map((s) => ({ value: s })),
    },
    {
      heading: '4. Identified Deficiencies & Optimization Gaps',
      items: data.gaps.map((g) => ({ value: g })),
    },
    {
      heading: '5. High-Impact Action Items & Next Steps',
      items: data.recommendations.map((r, i) => ({
        label: `Action #${i + 1}`,
        value: r,
      })),
    },
  ];

  await generateStyledPDF(
    {
      title: data.title.toUpperCase(),
      subtitle: `Candidate: ${data.candidateName}  •  ${data.type}`,
      studentName: data.candidateName,
      engineName: data.type,
      score: data.score,
      sections,
    },
    filename || `${data.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-report.pdf`
  );
}

/**
 * Generate 30-60-90 Sprint Roadmap PDF
 */
export async function generateRoadmapPDF(data: {
  targetRole: string;
  candidateName: string;
  timeline: string;
  phases: Array<{
    phase: string;
    theme: string;
    focus: string;
    milestones: string[];
    deliverables?: string[];
  }>;
}, filename?: string): Promise<void> {
  const sections: PDFExportOptions['sections'] = [
    {
      heading: '1. Sprint Overview & Target Parameters',
      items: [
        { label: 'Target Engineering Role', value: data.targetRole },
        { label: 'Scholar Candidate', value: data.candidateName },
        { label: 'Sprint Horizon', value: data.timeline },
      ],
    },
    ...data.phases.map((p, idx) => ({
      heading: `${idx + 2}. ${p.phase.toUpperCase()}: ${p.theme.toUpperCase()}`,
      content: `Focus Domain: ${p.focus}`,
      items: [
        ...p.milestones.map((m) => ({ label: 'Milestone', value: m })),
        ...(p.deliverables ? p.deliverables.map((d) => ({ label: 'Deliverable', value: d })) : []),
      ],
    })),
  ];

  await generateStyledPDF(
    {
      title: '30-60-90 DAY ACCELERATED SPRINT ROADMAP',
      subtitle: `Target Role: ${data.targetRole}  •  Candidate: ${data.candidateName}`,
      studentName: data.candidateName,
      engineName: 'Engine 9 • 30-60-90 Sprint Roadmap',
      score: 92,
      sections,
    },
    filename || `${data.candidateName.replace(/\s+/g, '_')}_30_60_90_Roadmap.pdf`
  );
}
