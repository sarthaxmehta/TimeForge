import jsPDF from 'jsPDF';
import html2canvas from 'html2canvas';

/**
 * Export a timetable DOM element to a PDF file.
 * @param {string} elementId - ID of the DOM element to capture
 * @param {object} opts - { fileName, institutionName, title, academicYear, semester }
 */
export async function exportToPDF(elementId, opts = {}) {
  const {
    fileName = 'timetable.pdf',
    institutionName = 'TimeForge Academy',
    title = 'Timetable',
    academicYear = '2025–2026',
    semester = '',
  } = opts;

  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Add capturing styling class for BOLD contrast print
  element.classList.add('pdf-capture-mode');

  const canvas = await html2canvas(element, {
    scale: 2.5, // High resolution scale
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
  });

  element.classList.remove('pdf-capture-mode');

  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  // A4 landscape if wide, else portrait
  const isLandscape = imgW > imgH;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;

  // ── Header Banner ──
  // Vibrant violet/indigo banner
  pdf.setFillColor(79, 70, 229); // Brand primary
  pdf.rect(0, 0, pageW, 24, 'F');

  // Top accent border line
  pdf.setFillColor(124, 58, 237); // Accent color
  pdf.rect(0, 24, pageW, 1.5, 'F');

  // Institution text
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(institutionName.toUpperCase(), margin, 10.5);

  // Subtitle info
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  const subLine = [title, academicYear, semester].filter(Boolean).join('   |   ');
  pdf.text(subLine, margin, 18);

  // Generated timestamp (right-aligned)
  const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  const dateW = pdf.getTextWidth(dateStr);
  pdf.text(dateStr, pageW - margin - dateW, 18);

  // ── Image Scaling & Centering ──
  const contentY = 28;
  const availW = pageW - margin * 2;
  const maxH = pageH - contentY - margin - 8;

  // Fit width and height proportionally
  const finalScale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
  const finalW = (canvas.width / 3.7795) * finalScale;
  const finalH = (canvas.height / 3.7795) * finalScale;

  // Center horizontally
  const xOffset = margin + (availW - finalW) / 2;

  pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

  // ── Bold Footer ──
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageH - 8, pageW - margin, pageH - 8);

  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TimeForge Timetable System  |  Developed by Sarthak Mehta', margin, pageH - 4);

  const footerRight = 'Official Schedule Document';
  const footerRightW = pdf.getTextWidth(footerRight);
  pdf.text(footerRight, pageW - margin - footerRightW, pageH - 4);

  pdf.save(fileName);
}

/**
 * Export ALL class timetables as a multi-page PDF.
 */
export async function exportAllTimetablesPDF(classIds, getElementId, opts = {}) {
  const {
    institutionName = 'TimeForge Academy',
    academicYear = '2025–2026',
    semester = ''
  } = opts;

  const isLandscape = true;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;

  for (let i = 0; i < classIds.length; i++) {
    const { classId, className } = classIds[i];
    const elementId = getElementId(classId);
    const element = document.getElementById(elementId);
    if (!element) continue;

    if (i > 0) pdf.addPage();

    // Add capturing styling class for BOLD contrast print
    element.classList.add('pdf-capture-mode');

    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    element.classList.remove('pdf-capture-mode');

    const imgData = canvas.toDataURL('image/png');

    // ── Header Banner ──
    pdf.setFillColor(79, 70, 229);
    pdf.rect(0, 0, pageW, 24, 'F');

    // Accent line
    pdf.setFillColor(124, 58, 237);
    pdf.rect(0, 24, pageW, 1.5, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(institutionName.toUpperCase(), margin, 10.5);

    pdf.setFontSize(9.5);
    const subLine = [`Class ${className} Timetable`, academicYear, semester].filter(Boolean).join('   |   ');
    pdf.text(subLine, margin, 18);

    const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    pdf.setFontSize(9);
    const dateW = pdf.getTextWidth(dateStr);
    pdf.text(dateStr, pageW - margin - dateW, 18);

    // ── Image Scaling & Positioning ──
    const contentY = 28;
    const availW = pageW - margin * 2;
    const maxH = pageH - contentY - margin - 8;
    const finalScale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
    const finalW = (canvas.width / 3.7795) * finalScale;
    const finalH = (canvas.height / 3.7795) * finalScale;

    // Center horizontally
    const xOffset = margin + (availW - finalW) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

    // ── Bold Footer ──
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageH - 8, pageW - margin, pageH - 8);

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Page ${i + 1} of ${classIds.length}   |   TimeForge System (Developed by Sarthak Mehta)`, margin, pageH - 4);

    const footerRight = 'Official Schedule Document';
    const footerRightW = pdf.getTextWidth(footerRight);
    pdf.text(footerRight, pageW - margin - footerRightW, pageH - 4);
  }

  const cleanName = institutionName.replace(/\s+/g, '_');
  pdf.save(`${cleanName}_Timetables.pdf`);
}
