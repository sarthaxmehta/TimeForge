import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export a timetable DOM element to a PDF file.
 * @param {string} elementId - ID of the DOM element to capture
 * @param {object} opts - settings/metadata fields
 */
export async function exportToPDF(elementId, opts = {}) {
  const {
    fileName = 'timetable.pdf',
    institutionName = 'TimeForge Academy',
    title = 'Timetable',
    academicYear = '',
    semester = '',
    address = '',
    phone = '',
    email = '',
    website = '',
    affiliation = '',
    principalName = '',
  } = opts;

  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Add capturing styling class for BOLD contrast print
  element.classList.add('pdf-capture-mode');

  const canvas = await html2canvas(element, {
    scale: 2.5,
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

  const isLandscape = imgW > imgH;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;

  // ── GRAND EUR NO-COLOR HEADER ──
  // Left Side: Institution Name and details
  pdf.setTextColor(15, 23, 42); // slate-900 (High contrast dark grey/black)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), margin, 11);

  let currentY = 15;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105); // slate-600

  if (affiliation) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Affiliation: ${affiliation}`, margin, currentY);
    pdf.setFont('helvetica', 'normal');
    currentY += 4;
  }

  if (address) {
    pdf.text(address, margin, currentY);
    currentY += 4;
  }

  const contactInfo = [
    phone && `Phone: ${phone}`,
    email && `Email: ${email}`,
    website && `Web: ${website}`
  ].filter(Boolean).join('   |   ');

  if (contactInfo) {
    pdf.text(contactInfo, margin, currentY);
  }

  // Right Side: Timetable info and signature
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  const rightTitle = title || 'Timetable';
  const rightTitleW = pdf.getTextWidth(rightTitle);
  pdf.text(rightTitle, pageW - margin - rightTitleW, 11);

  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(79, 70, 229); // Brand primary accent (Indigo)
  const termDetails = [academicYear, semester].filter(Boolean).join('   |   ');
  const termDetailsW = pdf.getTextWidth(termDetails);
  pdf.text(termDetails, pageW - margin - termDetailsW, 15.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105); // slate-600

  let rightY = 19.5;
  if (principalName) {
    const principalStr = `Principal: ${principalName}`;
    const principalW = pdf.getTextWidth(principalStr);
    pdf.text(principalStr, pageW - margin - principalW, rightY);
    rightY += 4;
  }

  const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  const dateW = pdf.getTextWidth(dateStr);
  pdf.text(dateStr, pageW - margin - dateW, rightY);

  // ── Elegance Double-Line Separator ──
  pdf.setDrawColor(15, 23, 42); // slate-900 (Thicker line)
  pdf.setLineWidth(0.6);
  pdf.line(margin, 28, pageW - margin, 28);

  pdf.setDrawColor(79, 70, 229); // Brand primary (Thinner accent line)
  pdf.setLineWidth(0.4);
  pdf.line(margin, 29.2, pageW - margin, 29.2);

  // ── Image Positioning ──
  const contentY = 32;
  const availW = pageW - margin * 2;
  const maxH = pageH - contentY - margin - 8;

  const finalScale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
  const finalW = (canvas.width / 3.7795) * finalScale;
  const finalH = (canvas.height / 3.7795) * finalScale;

  const xOffset = margin + (availW - finalW) / 2;

  pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

  // ── Footer ──
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, pageH - 8, pageW - margin, pageH - 8);

  pdf.setTextColor(71, 85, 105);
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
    academicYear = '',
    semester = '',
    address = '',
    phone = '',
    email = '',
    website = '',
    affiliation = '',
    principalName = '',
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

    element.classList.add('pdf-capture-mode');

    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    element.classList.remove('pdf-capture-mode');

    const imgData = canvas.toDataURL('image/png');

    // ── GRAND EUR NO-COLOR HEADER ──
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), margin, 11);

    let currentY = 15;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);

    if (affiliation) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Affiliation: ${affiliation}`, margin, currentY);
      pdf.setFont('helvetica', 'normal');
      currentY += 4;
    }

    if (address) {
      pdf.text(address, margin, currentY);
      currentY += 4;
    }

    const contactInfo = [
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      website && `Web: ${website}`
    ].filter(Boolean).join('   |   ');

    if (contactInfo) {
      pdf.text(contactInfo, margin, currentY);
    }

    // Right Side: Class specific info
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    const rightTitle = `Class ${className} Timetable`;
    const rightTitleW = pdf.getTextWidth(rightTitle);
    pdf.text(rightTitle, pageW - margin - rightTitleW, 11);

    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    const termDetails = [academicYear, semester].filter(Boolean).join('   |   ');
    const termDetailsW = pdf.getTextWidth(termDetails);
    pdf.text(termDetails, pageW - margin - termDetailsW, 15.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);

    let rightY = 19.5;
    if (principalName) {
      const principalStr = `Principal: ${principalName}`;
      const principalW = pdf.getTextWidth(principalStr);
      pdf.text(principalStr, pageW - margin - principalW, rightY);
      rightY += 4;
    }

    const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    const dateW = pdf.getTextWidth(dateStr);
    pdf.text(dateStr, pageW - margin - dateW, rightY);

    // Divider Line
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.6);
    pdf.line(margin, 28, pageW - margin, 28);

    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(0.4);
    pdf.line(margin, 29.2, pageW - margin, 29.2);

    // ── Image Scaling & Position ──
    const contentY = 32;
    const availW = pageW - margin * 2;
    const maxH = pageH - contentY - margin - 8;
    const finalScale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
    const finalW = (canvas.width / 3.7795) * finalScale;
    const finalH = (canvas.height / 3.7795) * finalScale;

    const xOffset = margin + (availW - finalW) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

    // Footer
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
