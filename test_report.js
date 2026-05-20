const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mock browser global environment if needed for jsPDF
global.window = global;
global.navigator = { userAgent: 'node' };

async function test() {
  try {
    const studentId = '5d2eb3d7-a63f-496a-a05d-8b10337a7831'; // Akash Gupta
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        users (name, email),
        student_academics (*),
        student_profiles (*)
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      console.error("Query Error:", error);
      return;
    }

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- Header Background ---
    doc.setFillColor(33, 33, 33); // Dark gray header
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // --- Header Text ---
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text('Placely', 14, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text('Official Student Record', pageWidth - 14, 25, { align: 'right' });

    // --- Title & Date ---
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.setFont("helvetica", "bold");
    doc.text('Comprehensive Performance Report', 14, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 62);
    doc.text(`Record ID: ${student.id.substring(0, 8).toUpperCase()}`, pageWidth - 14, 62, { align: 'right' });

    // --- Divider ---
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 66, pageWidth - 14, 66);

    // --- Personal Information Section ---
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text('Personal Information', 14, 78);

    const userName = (Array.isArray(student.users) ? student.users[0] : student.users)?.name || 'N/A';
    const userEmail = (Array.isArray(student.users) ? student.users[0] : student.users)?.email || 'N/A';

    autoTable(doc, {
      startY: 82,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4, lineColor: [230, 230, 230] },
      columnStyles: { 
        0: { fontStyle: 'bold', fillColor: [248, 248, 248], cellWidth: 50, textColor: [50, 50, 50] }, 
        1: { cellWidth: 'auto', textColor: [30, 30, 30] } 
      },
      body: [
        ['Full Name', userName],
        ['Register Number', student.register_number || 'N/A'],
        ['Email Address', userEmail],
        ['Department', student.department || 'N/A'],
        ['Batch Year', student.year || 'N/A'],
      ]
    });

    console.log("Personal info table added.");

    // --- Academic Performance ---
    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text('Academic & Professional Profile', 14, currentY);

    const cgpa = student.student_academics?.[0]?.cgpa || student.student_academics?.cgpa || 'N/A';
    const leetcode = student.student_profiles?.[0]?.leetcode_count || student.student_profiles?.leetcode_count || 0;
    const specializations = student.student_profiles?.[0]?.specializations || student.student_profiles?.specializations || [];

    autoTable(doc, {
      startY: currentY + 4,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4, lineColor: [230, 230, 230] },
      columnStyles: { 
        0: { fontStyle: 'bold', fillColor: [248, 248, 248], cellWidth: 50, textColor: [50, 50, 50] }, 
        1: { cellWidth: 'auto', textColor: [30, 30, 30] } 
      },
      body: [
        ['Current CGPA', String(cgpa)],
        ['LeetCode Progress', `${leetcode} Problems Solved`],
        ['Specializations', specializations.join(', ') || 'None Listed'],
      ]
    });

    console.log("Academic table added.");

    // --- Status Summary ---
    const statusY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text('Current Standing', 14, statusY);

    const verStatus = (student.verification_status || 'PENDING').toUpperCase();
    const plcStatus = (student.placement_status || 'NOT_PLACED').replace('_', ' ').toUpperCase();

    autoTable(doc, {
      startY: statusY + 4,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4, lineColor: [230, 230, 230] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.cell.text[0] === 'VERIFIED' || data.cell.text[0] === 'PLACED') {
            data.cell.styles.textColor = [34, 139, 34]; // Green
          } else if (data.cell.text[0] === 'PENDING' || data.cell.text[0] === 'UNPLACED') {
            data.cell.styles.textColor = [255, 140, 0]; // Orange
          } else if (data.cell.text[0] === 'REJECTED') {
            data.cell.styles.textColor = [220, 20, 60]; // Red
          }
        }
      },
      body: [
        ['Verification Status', verStatus],
        ['Placement Status', plcStatus]
      ]
    });

    console.log("Status table added.");

    // --- Footer ---
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "italic");
    doc.text('This is a system-generated official document by the Placely Admin Portal.', 14, pageHeight - 15);
    doc.text('© 2026 Placely System', pageWidth - 14, pageHeight - 15, { align: 'right' });

    console.log("PDF created successfully!");

  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
