import { supabase } from '@/lib/supabase';
import { getBatchRangeFromYear } from '@/lib/batch-utils';

// Fetch placement history from DB (seeded mock data, replaces hardcoded FALLBACK_* and _gen* functions)
export async function getPlacementHistoryFallback(filters: { year?: number; dept?: string; company?: string } = {}) {
  let query = supabase.from('placement_history').select('year, dept_name, company_name, hires, avg_ctc');
  if (filters.year)    query = query.eq('year', filters.year);
  if (filters.dept)    query = query.eq('dept_name', filters.dept);
  if (filters.company) query = query.eq('company_name', filters.company);
  const { data, error } = await query.order('hires', { ascending: false });
  if (error) { console.error('placement_history fetch error:', error); return []; }
  return data || [];
}


export async function getDashboardStats() {
  const [students, companies, drives, offersCount, placedStudents, avgCTCPromise] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('job_drives').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.rpc('get_average_ctc')
  ]);

  const avgCTC = avgCTCPromise.data || 0;

  return {
    totalStudents: students.count || 0,
    totalCompanies: companies.count || 0,
    totalDrives: drives.count || 0,
    totalOffers: offersCount.count || 0,
    placedStudents: placedStudents.count || 0,
    averagePackage: parseFloat(Number(avgCTC).toFixed(1))
  };
}

export async function getStudentDashboardStats(studentId: string) {
  const { data, error } = await supabase
    .rpc('get_student_dashboard_stats', { p_student_id: studentId });
  if (error) throw error;
  
  const stats = data && data.length > 0 ? data[0] : { applications_count: 0, offers_count: 0, interviews_count: 0 };

  return {
    applicationsCount: Number(stats.applications_count),
    offersCount: Number(stats.offers_count),
    interviewsCount: Number(stats.interviews_count),
    tasksCount: 0
  };
}

export async function getApplicationStats(driveId?: string) {
  const filterDriveId = (driveId && driveId !== "All") ? driveId : null;
  const { data, error } = await supabase.rpc('get_application_status_stats', {
    filter_drive_id: filterDriveId
  });
  
  if (error) throw error;

  const stats = {
    pending: 0,
    shortlisted: 0,
    interviews: 0,
    offers: 0
  };

  (data || []).forEach((row: any) => {
    if (row.status === 'applied') stats.pending = Number(row.count);
    else if (row.status === 'shortlisted') stats.shortlisted = Number(row.count);
    else if (row.status === 'interviewing') stats.interviews = Number(row.count);
    else if (row.status === 'offered') stats.offers = Number(row.count);
  });

  return stats;
}

export async function getReportStats() {
  const [students, placed, offers] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.from('offers').select('package_ctc')
  ]);

  const totalStudents = students.count || 0;
  const placedStudents = placed.count || 0;
  const placementRate = totalStudents ? (placedStudents / totalStudents) * 100 : 0;

  const offersData = offers.data || [];
  const avgCTC = offersData.length > 0
    ? (offersData.reduce((acc, o) => {
        const val = parseFloat(o.package_ctc.replace(/[^0-9.]/g, ''));
        return acc + (isNaN(val) ? 0 : val);
      }, 0) / offersData.length)
    : 0;

  const [eligibleCount, appliedCount, shortlistedCount, interviewedCount, offeredCount] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('student_id', { count: 'exact', head: true }),
    supabase.from('applications').select('student_id', { count: 'exact', head: true }).in('status', ['shortlisted', 'interviewing', 'offered']),
    supabase.from('applications').select('student_id', { count: 'exact', head: true }).in('status', ['interviewing', 'offered']),
    supabase.from('applications').select('student_id', { count: 'exact', head: true }).eq('status', 'offered'),
  ]);

  return {
    placementRate: placementRate.toFixed(1) + '%',
    avgCTC: avgCTC.toFixed(1) + ' LPA',
    totalOffers: offersData.length,
    atRisk: 0,
    funnel: [
      { stage: 'Eligible', count: eligibleCount.count || 0, pct: '100%' },
      { stage: 'Applied', count: appliedCount.count || 0, pct: eligibleCount.count ? ((appliedCount.count || 0) / eligibleCount.count * 100).toFixed(1) + '%' : '0%' },
      { stage: 'Shortlisted', count: shortlistedCount.count || 0, pct: appliedCount.count ? ((shortlistedCount.count || 0) / appliedCount.count * 100).toFixed(1) + '%' : '0%' },
      { stage: 'Interviewed', count: interviewedCount.count || 0, pct: shortlistedCount.count ? ((interviewedCount.count || 0) / shortlistedCount.count * 100).toFixed(1) + '%' : '0%' },
      { stage: 'Offered', count: offeredCount.count || 0, pct: interviewedCount.count ? ((offeredCount.count || 0) / interviewedCount.count * 100).toFixed(1) + '%' : '0%' },
    ]
  };
}

export async function getTrendData() {
  try {
    const { data, error } = await supabase.rpc('get_monthly_trend_data');
    if (error) throw error;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (data || []).map((row: any) => {
      const parts = row.month_date.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;

      return {
        month: monthNames[monthIndex] || 'Jan',
        placements: Number(row.placements),
        offers: Number(row.offers),
        drives: Number(row.drives)
      };
    });
  } catch (error) {
    console.error("Trend data aggregation failed:", error);
    return [];
  }
}

export async function getDepartmentAnalytics() {
  try {
    const { data, error } = await supabase.rpc('get_department_analytics');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      name: r.dept || 'Unknown',
      dept: r.dept || 'Unknown',
      total: Number(r.total || 0),
      placed: Number(r.placed || 0),
      unplaced: Number(r.total || 0) - Number(r.placed || 0),
      placementRate: Number(r.rate || 0),
      avgCTC: 0,
      topCTC: 0
    }));
  } catch (error) {
    console.error("Department analytics failed:", error);
    return [];
  }
}

export async function getCompanyAnalytics() {
  try {
    const { data, error } = await supabase.rpc('get_company_analytics');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      name: r.company || 'Unknown',
      company: r.company || 'Unknown',
      hires: Number(r.offers || 0),
      offers: Number(r.offers || 0),
      avgCTC: Number(r.avg_ctc || 0),
      topCTC: Number(r.avg_ctc || 0),
      industry: 'Technology',
      departments: [],
      departmentCount: 0
    }));
  } catch (error) {
    console.error("Company analytics failed:", error);
    return [];
  }
}

export async function getYearAnalytics() {
  try {
    const { data, error } = await supabase.rpc('get_year_analytics');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      year: String(r.year || ''),
      totalStudents: Number(r.total || 0),
      totalOffers: Number(r.placed || 0),
      placed: Number(r.placed || 0),
      placementRate: Number(r.rate || 0),
      avgCTC: 0
    }));
  } catch (error) {
    console.error("Year analytics failed:", error);
    return [];
  }
}

export async function getCrossAnalytics(filters: { dept?: string; company?: string; year?: string }) {
  try {
    const { data: offers, error } = await supabase
      .from('offers')
      .select('package_ctc, created_at, students(department), companies(name, industry), job_drives(batch)');

    if (error || !offers || offers.length === 0) return { companies: [], depts: [], years: [] };

    const allOffers = offers.map((o: any) => ({
      dept:    o.students?.department    || o.students?.[0]?.department    || '',
      company: o.companies?.name         || o.companies?.[0]?.name         || '',
      industry:o.companies?.industry     || o.companies?.[0]?.industry     || 'Technology',
      year:    o.job_drives?.batch       || o.job_drives?.[0]?.batch       || String(new Date(o.created_at).getFullYear()),
      ctc:     parseFloat((o.package_ctc||'0').replace(/[^0-9.]/g,'')) || 0,
    }));

    let filtered = allOffers;
    if (filters.dept)    filtered = filtered.filter(o => o.dept    === filters.dept);
    if (filters.company) filtered = filtered.filter(o => o.company === filters.company);
    if (filters.year)    filtered = filtered.filter(o => o.year    === filters.year);

    function aggregate(key: 'company'|'dept'|'year', nameKey: string) {
      const map: Record<string,{hires:number;ctcSum:number}> = {};
      filtered.forEach(o => {
        const k = o[key as keyof typeof o] as string;
        if (!k) return;
        if (!map[k]) map[k] = { hires: 0, ctcSum: 0 };
        map[k].hires++;
        if (o.ctc > 0) map[k].ctcSum += o.ctc;
      });
      return Object.entries(map)
        .map(([name, d]) => ({ name, hires: d.hires, avgCTC: d.hires > 0 ? parseFloat((d.ctcSum/d.hires).toFixed(1)) : 0 }))
        .sort((a,b) => b.hires - a.hires);
    }

    const companies = aggregate('company','name');
    const depts     = aggregate('dept','name');
    const years     = Object.entries(
      filtered.reduce((acc,o) => { if(o.year){ acc[o.year]=(acc[o.year]||0)+1; } return acc; }, {} as Record<string,number>)
    ).map(([year,hires])=>({ year, hires: hires as number, avgCTC: 0 })).sort((a,b)=>parseInt(a.year)-parseInt(b.year));

    return { companies, depts, years };
  } catch {
    return { companies: [], depts: [], years: [] };
  }
}

export async function generateStudentProfilePDF(studentId: string) {
  return generateStudentReport(studentId);
}

export async function generateStudentReport(studentId: string) {
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

  if (error) throw error;

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
  doc.text('CareerBridge', 14, 25);
  
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

  autoTable(doc, {
    startY: 82,
    theme: 'grid',
    styles: { fontSize: 11, cellPadding: 4, lineColor: [230, 230, 230] },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: [248, 248, 248], cellWidth: 50, textColor: [50, 50, 50] }, 
      1: { cellWidth: 'auto', textColor: [30, 30, 30] } 
    },
    body: [
      ['Full Name', student.users?.name || 'N/A'],
      ['Register Number', student.register_number || 'N/A'],
      ['Email Address', student.users?.email || 'N/A'],
      ['Department', student.department || 'N/A'],
      ['Batch Year', student.year ? (() => { const r = getBatchRangeFromYear(student.year); return `${r.startYear}-${r.endYear}`; })() : 'N/A'],
    ]
  });

  // --- Academic Performance ---
  const currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text('Academic & Professional Profile', 14, currentY);

  const cgpaVal = (Array.isArray(student.student_academics) ? student.student_academics[0] : student.student_academics)?.cgpa || 'N/A';
  const leetcodeVal = (Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles)?.leetcode_count || 0;
  const specList = (Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles)?.specializations || [];

  autoTable(doc, {
    startY: currentY + 4,
    theme: 'grid',
    styles: { fontSize: 11, cellPadding: 4, lineColor: [230, 230, 230] },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: [248, 248, 248], cellWidth: 50, textColor: [50, 50, 50] }, 
      1: { cellWidth: 'auto', textColor: [30, 30, 30] } 
    },
    body: [
      ['Current CGPA', String(cgpaVal)],
      ['LeetCode Progress', `${leetcodeVal} Problems Solved`],
      ['Specializations', (specList).join(', ') || 'None Listed'],
    ]
  });

  // --- Status Summary ---
  const statusY = (doc as any).lastAutoTable.finalY + 15;
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

  // --- Footer ---
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text('This is a system-generated official document by the CareerBridge Admin Portal.', 14, pageHeight - 15);
  doc.text('© 2026 CareerBridge System', pageWidth - 14, pageHeight - 15, { align: 'right' });

  return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
}

export async function generateSystemReport() {
  const stats = await getDashboardStats(); 
  
  const { count: totalPlaced } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('placement_status', 'placed');
    
  const totalUnplaced = (stats.totalStudents || 0) - (totalPlaced || 0);
  
  const { data: studentsData } = await supabase
    .from('students')
    .select('department, placement_status');
    
  const deptMap: Record<string, { total: number, placed: number, unplaced: number }> = {};
  if (studentsData) {
    studentsData.forEach(s => {
      const dept = s.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, placed: 0, unplaced: 0 };
      deptMap[dept].total++;
      if (s.placement_status === 'placed') deptMap[dept].placed++;
      else deptMap[dept].unplaced++;
    });
  }
  
  const placementByDept = Object.entries(deptMap).map(([department, counts]) => ({
    department,
    ...counts
  }));
  
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text('CareerBridge Admin', 14, 28);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text('Placement Operations Report', pageWidth - 14, 28, { align: 'right' });

  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.setFont("helvetica", "bold");
  doc.text('System Dashboard Report', 14, 60);
  
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(`Report Period: As of ${new Date().toLocaleDateString()}`, 14, 67);
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, pageWidth - 14, 67, { align: 'right' });

  doc.setDrawColor(220, 220, 220);
  doc.line(14, 72, pageWidth - 14, 72);

  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text('Overall Executive Summary', 14, 85);

  autoTable(doc, {
    startY: 90,
    theme: 'grid',
    headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 11, cellPadding: 5 },
    body: [
      ['Metric', 'Recorded Value'],
      ['Total Registered Students', String(stats.totalStudents)],
      ['Total Placed Students', String(totalPlaced || 0)],
      ['Total Unplaced Students', String(totalUnplaced)],
      ['Total Recruitment Drives', String(stats.totalDrives)],
    ]
  });

  const currentY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "bold");
  doc.text('Placement Analytics by Department', 14, currentY);

  const placementByDeptBody = placementByDept.map((dept: any) => {
    const placementRate = dept.total > 0 ? Math.round((dept.placed / dept.total) * 100) : 0;
    return [
      dept.department, 
      String(dept.total), 
      String(dept.placed), 
      String(dept.unplaced),
      `${placementRate}%`
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    head: [['Department', 'Total Students', 'Placed', 'Unplaced', 'Placement Rate']],
    body: placementByDeptBody
  });

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text('Strictly Confidential • For Administrative Use Only', 14, pageHeight - 15);
  doc.text('© 2026 CareerBridge Systems', pageWidth - 14, pageHeight - 15, { align: 'right' });

  return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
}

