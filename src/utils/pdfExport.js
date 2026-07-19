import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Shared helper to capture a DOM element to canvas.
 * If the element is currently hidden/invisible, it clones it and renders it offscreen
 * at a standard desktop width of 1200px to ensure correct canvas sizing and avoid NaN layout calculations.
 */
async function captureElementToCanvas(element) {
  // If the element is visible, capture it directly
  if (element.offsetWidth > 0 && element.offsetHeight > 0) {
    element.classList.add('pdf-capture-mode');
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      allowTaint: true,
    });
    element.classList.remove('pdf-capture-mode');
    return canvas;
  }

  // If invisible/hidden, clone it and render offscreen
  const clone = element.cloneNode(true);
  clone.removeAttribute('id');
  
  clone.style.display = 'block';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.width = '1200px'; 
  clone.style.height = 'auto';
  clone.style.background = '#ffffff';
  clone.style.padding = '10px';
  clone.style.boxSizing = 'border-box';
  
  document.body.appendChild(clone);
  clone.classList.add('pdf-capture-mode');

  // Wait slightly for DOM rendering/layout
  await new Promise(r => setTimeout(r, 60));

  const canvas = await html2canvas(clone, {
    scale: 2.2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  clone.classList.remove('pdf-capture-mode');
  document.body.removeChild(clone);
  return canvas;
}

/**
 * Export a single timetable DOM element to a PDF file.
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

  const canvas = await captureElementToCanvas(element);
  const imgData = canvas.toDataURL('image/png');

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

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(79, 70, 229); // brand Indigo
  const fullTitle = `${title || 'Timetable'}`;
  pdf.text(fullTitle, centerX, currentY + 0.5, { align: 'center' });
  currentY += 4.5;

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

  const dividerY = currentY + 0.25;
  pdf.setDrawColor(15, 23, 42); // slate-900
  pdf.setLineWidth(0.6);
  pdf.line(margin, dividerY, pageW - margin, dividerY);

  pdf.setDrawColor(79, 70, 229); // brand Accent
  pdf.setLineWidth(0.4);
  pdf.line(margin, dividerY + 1.1, pageW - margin, dividerY + 1.1);

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

  // Footer
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

  const pdf = new jsPDF({
    orientation: 'landscape',
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

    const canvas = await captureElementToCanvas(element);
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

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(79, 70, 229); // brand Indigo
    const rightTitle = `Class ${className} Timetable`;
    pdf.text(rightTitle, centerX, currentY + 0.5, { align: 'center' });
    currentY += 4.5;

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

    const dividerY = currentY + 0.5;
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.6);
    pdf.line(margin, dividerY, pageW - margin, dividerY);

    pdf.setDrawColor(79, 70, 229);
    pdf.setLineWidth(0.4);
    pdf.line(margin, dividerY + 1.2, pageW - margin, dividerY + 1.2);

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

/**
 * Export a complete Master Schedule booklet (Cover page, indices, class timetables, and teacher timetables) as a single PDF.
 */
export async function exportMasterSchedulePDF(classes, teachers, subjects, settings) {
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
  } = settings;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const centerX = pageW / 2;

  // ── PAGE 1: COVER PAGE ──
  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(1.0);
  pdf.rect(10, 10, pageW - 20, pageH - 20);

  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.4);
  pdf.rect(11.5, 11.5, pageW - 23, pageH - 23);

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), centerX, 45, { align: 'center' });

  pdf.setDrawColor(79, 70, 229);
  pdf.setLineWidth(1.5);
  pdf.line(40, 55, pageW - 40, 55);

  pdf.setTextColor(79, 70, 229);
  pdf.setFontSize(28);
  pdf.text('MASTER INSTITUTIONAL\nSCHEDULE BOOKLET', centerX, 85, { align: 'center' });

  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('A Complete Compilation of Classes, Teachers, and Timetables', centerX, 110, { align: 'center' });

  const boxY = 135;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.rect(25, boxY, pageW - 50, 75, 'FD');

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('INSTITUTION METADATA', centerX, boxY + 10, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  
  let metaY = boxY + 20;
  const printMetaLine = (label, val) => {
    if (val) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${label}:`, 30, metaY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(val), 75, metaY);
      metaY += 6.5;
    }
  };

  printMetaLine('Academic Year', academicYear);
  printMetaLine('Semester', semester);
  printMetaLine('Affiliation', affiliation);
  printMetaLine('Address', address);
  printMetaLine('Principal', principalName);
  
  const contacts = [phone && `Tel: ${phone}`, email && `Email: ${email}`].filter(Boolean).join('  |  ');
  printMetaLine('Contact Info', contacts);

  const statsY = boxY + 95;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('SCHEDULE STATISTICS', centerX, statsY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Total Classes Registered: ${classes.length}`, 30, statsY + 8);
  pdf.text(`Total Teachers Active: ${teachers.length}`, 30, statsY + 14);
  pdf.text(`Total Subject Placements: ${subjects.length}`, 30, statsY + 20);

  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(8.5);
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, centerX, pageH - 20, { align: 'center' });

  // ── PAGE 2: DIRECTORY SUMMARY ──
  pdf.addPage('portrait');
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text('INSTITUTIONAL DIRECTORY', margin, 20);

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(margin, 24, pageW - margin, 24);

  pdf.setFontSize(11);
  pdf.text('ACTIVE TEACHERS & LOAD LIMITS', margin, 34);
  
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, 38, pageW - margin * 2, 8, 'F');
  
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Teacher Name', margin + 3, 43.5);
  pdf.text('Department', margin + 70, 43.5);
  pdf.text('Max Load', margin + 120, 43.5);
  pdf.text('Color Accent', margin + 155, 43.5);

  let rowY = 51;
  pdf.setFont('helvetica', 'normal');
  teachers.forEach(t => {
    if (rowY > pageH - 30) return;
    pdf.text(t.name, margin + 3, rowY);
    pdf.text(t.department || 'General', margin + 70, rowY);
    pdf.text(`${t.maxPeriods || 24} periods`, margin + 120, rowY);
    pdf.setFillColor(t.color || '#6366f1');
    pdf.rect(margin + 155, rowY - 2.5, 12, 3, 'F');
    rowY += 6.5;
  });

  let classY = rowY + 12;
  if (classY < pageH - 85) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('REGISTERED CLASSES', margin, classY);

    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, classY + 4, pageW - margin * 2, 8, 'F');

    pdf.setFontSize(9.5);
    pdf.text('Class Name', margin + 3, classY + 9.5);
    pdf.text('Class Room', margin + 70, classY + 9.5);
    pdf.text('Class Teacher', margin + 120, classY + 9.5);

    let cRowY = classY + 17;
    pdf.setFont('helvetica', 'normal');
    classes.forEach(c => {
      if (cRowY > pageH - 20) return;
      const cTeacher = teachers.find(t => t.id === c.classTeacherId)?.name || 'None';
      pdf.text(`${c.name} ${c.section ? ` - ${c.section}` : ''}`, margin + 3, cRowY);
      pdf.text(c.roomNo || 'N/A', margin + 70, cRowY);
      pdf.text(cTeacher, margin + 120, cRowY);
      cRowY += 6.5;
    });
  }

  // Class Timetables
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const elementId = `grid-class-${cls.id}`;
    const element = document.getElementById(elementId);
    if (!element) continue;

    pdf.addPage('landscape');
    const lpW = pdf.internal.pageSize.getWidth();
    const lpH = pdf.internal.pageSize.getHeight();
    const lMargin = 12;

    const canvas = await captureElementToCanvas(element);
    const imgData = canvas.toDataURL('image/png');

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), lpW / 2, 10, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(79, 70, 229);
    pdf.text(`Class Timetable  |  Class ${cls.name}${cls.section ? ` - ${cls.section}` : ''}`, lpW / 2, 15, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${academicYear} · ${semester} · Room: ${cls.roomNo || 'N/A'}`, lpW / 2, 19, { align: 'center' });

    const contentY = 22;
    const availW = lpW - lMargin * 2;
    const maxH = lpH - contentY - lMargin - 6;
    const scale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
    const finalW = (canvas.width / 3.7795) * scale;
    const finalH = (canvas.height / 3.7795) * scale;
    const xOffset = lMargin + (availW - finalW) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(lMargin, lpH - 7, lpW - lMargin, lpH - 7);
    pdf.text(`Master schedule booklet  |  Class ${cls.name}${cls.section ? `-${cls.section}` : ''}`, lMargin, lpH - 3);
  }

  // Teacher Timetables
  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const elementId = `grid-teacher-${t.id}`;
    const element = document.getElementById(elementId);
    if (!element) continue;

    pdf.addPage('landscape');
    const lpW = pdf.internal.pageSize.getWidth();
    const lpH = pdf.internal.pageSize.getHeight();
    const lMargin = 12;

    const canvas = await captureElementToCanvas(element);
    const imgData = canvas.toDataURL('image/png');

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text((institutionName || 'TimeForge Academy').toUpperCase(), lpW / 2, 10, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(79, 70, 229);
    pdf.text(`Teacher Timetable  |  ${t.name} (${t.department || 'General'})`, lpW / 2, 15, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${academicYear} · ${semester}`, lpW / 2, 19, { align: 'center' });

    const contentY = 22;
    const availW = lpW - lMargin * 2;
    const maxH = lpH - contentY - lMargin - 6;
    const scale = Math.min(availW / (canvas.width / 3.7795), maxH / (canvas.height / 3.7795));
    const finalW = (canvas.width / 3.7795) * scale;
    const finalH = (canvas.height / 3.7795) * scale;
    const xOffset = lMargin + (availW - finalW) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, contentY, finalW, finalH);

    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(lMargin, lpH - 7, lpW - lMargin, lpH - 7);
    pdf.text(`Master schedule booklet  |  Teacher ${t.name}`, lMargin, lpH - 3);
  }

  const cleanName = institutionName.replace(/\s+/g, '_') || 'TimeForge';
  pdf.save(`${cleanName}_Master_Booklet.pdf`);
}
