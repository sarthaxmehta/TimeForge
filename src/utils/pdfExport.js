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
    scale: 3.0,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    scrollX: 0,
    scrollY: 0,
    allowTaint: true,
  });

  element.classList.remove('pdf-capture-mode');

  const imgData = canvas.toDataURL('image/png');
  const imgW = canvas.width;
  const imgH = canvas.height;

  // Always use landscape A4 for timetables — better readability
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const centerX = pageW / 2;

  // ── GRAND EUR CENTER-ORIENTED HEADER ──
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16.5);
  pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), centerX, 10, { align: 'center' });

  let currentY = 14;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105); // slate-600

  if (affiliation) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Affiliation: ${affiliation}`, centerX, currentY, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    currentY += 3.8;
  }

  if (address) {
    pdf.text(address, centerX, currentY, { align: 'center' });
    currentY += 3.8;
  }

  const contactInfo = [
    phone && `Phone: ${phone}`,
    email && `Email: ${email}`,
    website && `Web: ${website}`
  ].filter(Boolean).join('   |   ');

  if (contactInfo) {
    pdf.text(contactInfo, centerX, currentY, { align: 'center' });
    currentY += 3.8;
  }

  // Class/Timetable Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(79, 70, 229); // brand Indigo
  const fullTitle = `${title || 'Timetable'}`;
  pdf.text(fullTitle, centerX, currentY + 0.5, { align: 'center' });
  currentY += 4.5;

  // Term / Year / Principal info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  const termDetails = [
    academicYear && `Year: ${academicYear}`,
    semester && `Semester: ${semester}`,
    principalName && `Principal: ${principalName}`
  ].filter(Boolean).join('   |   ');
  if (termDetails) {
    pdf.text(termDetails, centerX, currentY, { align: 'center' });
    currentY += 4;
  }

  const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(dateStr, centerX, currentY, { align: 'center' });
  currentY += 4;

  // Elegance Double Divider Line
  const dividerY = currentY + 0.25;
  pdf.setDrawColor(15, 23, 42); // slate-900
  pdf.setLineWidth(0.6);
  pdf.line(margin, dividerY, pageW - margin, dividerY);

  pdf.setDrawColor(79, 70, 229); // brand Accent
  pdf.setLineWidth(0.4);
  pdf.line(margin, dividerY + 1.1, pageW - margin, dividerY + 1.1);

  // Content start position
  const contentY = dividerY + 3.5;
  const availW = pageW - margin * 2;
  const maxH = pageH - contentY - margin - 8;

  const scaleX = availW / (canvas.width / 3.7795);
  const scaleY = maxH / (canvas.height / 3.7795);
  const finalScale = Math.min(scaleX, scaleY);
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
  const centerX = pageW / 2;

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

    // ── GRAND EUR CENTER-ORIENTED HEADER ──
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16.5);
    pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), centerX, 11, { align: 'center' });

    let currentY = 15.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105); // slate-600

    if (affiliation) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Affiliation: ${affiliation}`, centerX, currentY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      currentY += 4;
    }

    if (address) {
      pdf.text(address, centerX, currentY, { align: 'center' });
      currentY += 4;
    }

    const contactInfo = [
      phone && `Phone: ${phone}`,
      email && `Email: ${email}`,
      website && `Web: ${website}`
    ].filter(Boolean).join('   |   ');

    if (contactInfo) {
      pdf.text(contactInfo, centerX, currentY, { align: 'center' });
      currentY += 4;
    }

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229); // brand Indigo
    const rightTitle = `Class ${className} Timetable`;
    pdf.text(rightTitle, centerX, currentY + 0.5, { align: 'center' });
    currentY += 4.5;

    // Term / Year / Principal info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    const termDetails = [
      academicYear && `Year: ${academicYear}`,
      semester && `Semester: ${semester}`,
      principalName && `Principal: ${principalName}`
    ].filter(Boolean).join('   |   ');
    pdf.text(termDetails, centerX, currentY, { align: 'center' });
    currentY += 4;

    const dateStr = `Exported: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(dateStr, centerX, currentY, { align: 'center' });
    currentY += 4.5;

    // Divider Line
    const dividerY = currentY + 0.5;
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.6);
    pdf.line(margin, dividerY, pageW - margin, dividerY);

    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(0.4);
    pdf.line(margin, dividerY + 1.2, pageW - margin, dividerY + 1.2);

    // Image Positioning
    const contentY = dividerY + 4;
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
