import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawPlacements = [
  { regNo: '722823243055', rollNo: '23AD055', name: 'JEEVANANTHAM S', section: 'A', company: 'Anthill Networks', ctc: 8.0, role: 'Backend Engineer' },
  { regNo: '722823243098', rollNo: '23AD098', name: 'Peer Mohideen Hameed A', section: 'A', company: 'Anthill Networks', ctc: 8.0, role: 'Backend Engineer' },
  { regNo: '722823243111', rollNo: '23AD111', name: 'Ramya T', section: 'B', company: 'ServiceNow', ctc: 44.0, role: 'Software Development Engineer' },
  { regNo: '722823243120', rollNo: '23AD120', name: 'SANJANA S PILLAI', section: 'B', company: 'Metropolis Technologies', ctc: 14.0, role: 'AI Specialist' },
  { regNo: '722823243140', rollNo: '23AD140', name: 'Sruthy Suji', section: 'C', company: 'Caterpillar', ctc: 10.0, role: 'Data Engineer' },
  { regNo: '722823243149', rollNo: '23AD149', name: 'Tarun J', section: 'C', company: 'ServiceNow', ctc: 44.0, role: 'Software Development Engineer' },
  { regNo: '722823243046', rollNo: '23AD046', name: 'Harish R', section: 'A', company: 'Akaike Technologies', ctc: 4.2, role: 'Associate Analyst' },
  { regNo: '722823243027', rollNo: '23AD027', name: 'CHANDRAMUHILAN M', section: 'A', company: 'Mr Cooper', ctc: 8.0, role: 'Fullstack Developer' },
  { regNo: '722823243116', rollNo: '23AD116', name: 'SAKTHIVEL M', section: 'B', company: 'Amazon', ctc: 45.0, role: 'SDE-1' },
  { regNo: '722823243085', rollNo: '23AD085', name: 'NIDHISH M', section: 'B', company: 'Integra Connect', ctc: 3.0, role: 'Junior Web Developer' },
  { regNo: '722823243009', rollNo: '23AD009', name: 'AKASH G', section: 'A', company: 'BIG VISION', ctc: 15.0, role: 'Computer Vision Engineer' },
  { regNo: '722823243012', rollNo: '23AD012', name: 'ANANDHI G', section: 'A', company: 'Hyland', ctc: 10.0, role: 'Cloud Engineer' },
  { regNo: '722823243079', rollNo: '23AD079', name: 'MUTHU VISALAKSHI M', section: 'B', company: 'Cloud Destinations', ctc: 8.0, role: 'DevOps Engineer' },
  { regNo: '722823243083', rollNo: '23AD083', name: 'NAVIYA DHARSHINI A S', section: 'B', company: 'Cloud Destinations', ctc: 8.0, role: 'DevOps Engineer' },
  { regNo: '722823243053', rollNo: '23AD053', name: 'JAGATH VISHNU', section: 'A', company: 'Schneider Electric', ctc: 5.5, role: 'Graduate Engineer Trainee' },
  { regNo: '722823243101', rollNo: '23AD101', name: 'PRAJESH U R', section: 'B', company: 'Schneider Electric', ctc: 5.5, role: 'Graduate Engineer Trainee' },
  { regNo: '722823243115', rollNo: '23AD115', name: 'SAKTHEESWAR KUMARAN', section: 'B', company: 'Schneider Electric', ctc: 5.5, role: 'Graduate Engineer Trainee' },
  { regNo: '722823243135', rollNo: '23AD135', name: 'SNEYA B R', section: 'C', company: 'Schneider Electric', ctc: 5.5, role: 'Graduate Engineer Trainee' },
  { regNo: '722823243086', rollNo: '23AD086', name: 'NISHAD N', section: 'B', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243091', rollNo: '23AD091', name: 'NITHYA SREE G', section: 'B', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243097', rollNo: '23AD097', name: 'PAVITHRA A', section: 'B', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243126', rollNo: '23AD126', name: 'SARA DAWOOD S', section: 'B', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243056', rollNo: '23AD056', name: 'KAMALESH G J', section: 'A', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243080', rollNo: '23AD080', name: 'NANDHINI K P', section: 'B', company: 'Infinite Solutions', ctc: 4.5, role: 'Software Engineer' },
  { regNo: '722823243144', rollNo: '23AD144', name: 'SURIYA A', section: 'C', company: 'Caresoft', ctc: 4.5, role: 'Junior Developer' },
  { regNo: '722823243024', rollNo: '23AD024', name: 'ATHITHYAN M', section: 'A', company: 'Caresoft', ctc: 4.5, role: 'Junior Developer' },
  { regNo: '722823243023', rollNo: '23AD023', name: 'ATHIKESAVAN M', section: 'A', company: 'Caresoft', ctc: 4.5, role: 'Junior Developer' },
  { regNo: '722823243048', rollNo: '23AD048', name: 'HARISMITA B', section: 'A', company: 'Jocata', ctc: 8.0, role: 'Fintech Software Developer' },
  { regNo: '722823243005', rollNo: '23AD005', name: 'ADHITHIYA G', section: 'A', company: 'Jocata', ctc: 8.0, role: 'Fintech Software Developer' },
  { regNo: '722823243153', rollNo: '23AD153', name: 'VASANTH R', section: 'C', company: 'Jocata', ctc: 8.0, role: 'Fintech Software Developer' },
  { regNo: '722823243038', rollNo: '23AD038', name: 'DIVYASREERITHA R', section: 'A', company: 'Hudsmer Business Solutions', ctc: 4.0, role: 'Business Analyst Trainee' },
  { regNo: '722823243158', rollNo: '23AD158', name: 'VISHNU YOGESH V K', section: 'C', company: 'Dassault Systems', ctc: 12.0, role: '3D Experience Engineer' },
  { regNo: '722823243002', rollNo: '23AD002', name: 'ABHIRAMI T', section: 'A', company: 'PSIOG', ctc: 4.5, role: 'Cloud Developer' },
  { regNo: '722823243130', rollNo: '23AD130', name: 'SHASTY VENKATESH G', section: 'B', company: 'PSIOG', ctc: 4.5, role: 'Cloud Developer' },
  { regNo: '722823243121', rollNo: '23AD121', name: 'SANJAY P C', section: 'B', company: 'PSIOG', ctc: 4.5, role: 'Cloud Developer' },
  { regNo: '722823243146', rollNo: '23AD146', name: 'SUSITHA C', section: 'C', company: 'cloudvice', ctc: 4.0, role: 'Support Engineer' },
  { regNo: '722823243047', rollNo: '23AD047', name: 'HARISH S', section: 'A', company: 'cloudvice', ctc: 4.0, role: 'Support Engineer' },
  { regNo: '722823243013', rollNo: '23AD013', name: 'ANBUCHEZHIYAN A M', section: 'A', company: 'Zoho', ctc: 5.0, role: 'Member Technical Staff' },
  { regNo: '722823243011', rollNo: '23AD011', name: 'AKSHAYA N', section: 'A', company: 'Digifortex', ctc: 5.0, role: 'Cybersecurity Associate' },
  { regNo: '722823243118', rollNo: '23AD118', name: 'SANDHYA A', section: 'B', company: 'Danfoss', ctc: 5.5, role: 'Embedded Systems Engineer' },
  { regNo: '722823243104', rollNo: '23AD104', name: 'PRIYADHARSHINI M', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243123', rollNo: '23AD123', name: 'SANJEEVITHA C S', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243088', rollNo: '23AD088', name: 'NITHIN PRANAV R', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243032', rollNo: '23AD032', name: 'DEVDARSHAN A', section: 'A', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243022', rollNo: '23AD022', name: 'ATHARSHA P', section: 'A', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243125', rollNo: '23AD125', name: 'SANTHOSH S', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243050', rollNo: '23AD050', name: 'HARSHAVARSHINI P S', section: 'A', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243099', rollNo: '23AD099', name: 'POOJA M', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243143', rollNo: '23AD143', name: 'SURENDAR P S', section: 'C', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
  { regNo: '722823243129', rollNo: '23AD129', name: 'SHAAM S R', section: 'B', company: 'Hexaware', ctc: 4.0, role: 'Software Engineer Trainee' },
];

async function seedAll() {
  console.log('🚀 Starting comprehensive database seeding for Placely...');

  // 1. Placement Policies
  await prisma.placementPolicy.create({
    data: {
      name: 'Default AI&DS Policy 2027',
      description: 'Standard placement policy for Batch 2027 AI&DS students.',
      minCgpa: 6.00,
      maxActiveArrears: 2,
      allowHistoryOfBacklogs: true,
      maxOffersAllowed: 2,
      upgradePolicyCtcMultiplier: 1.50,
      isActive: true,
      isDefault: true,
    },
  });
  console.log('✅ Placement Policy created');

  // 2. Admin Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aids.com' },
    update: {},
    create: {
      email: 'admin@aids.com',
      name: 'Head TPO Admin',
      role: 'admin',
      status: 'active',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@aids.com' },
    update: {},
    create: {
      email: 'staff@aids.com',
      name: 'Department Placement Officer',
      role: 'staff',
      status: 'active',
    },
  });
  console.log('✅ System Admin & Staff Users ready');

  // 3. Companies & Job Drives
  const companyMap = new Map<string, any>();
  const driveMap = new Map<string, any>();

  const companyList = Array.from(new Set(rawPlacements.map(p => p.company)));

  for (const compName of companyList) {
    const comp = await prisma.company.create({
      data: {
        name: compName,
        website: `https://${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: compName === 'Amazon' || compName === 'ServiceNow' ? 'Product Tech' : 'IT Consulting & Services',
        hrName: `${compName} Campus Recruiter`,
        hrEmail: `campus@${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        hrPhone: '+91 98765 43210',
        status: 'active',
        themeColor: compName === 'Amazon' ? '#FF9900' : (compName === 'ServiceNow' ? '#81B441' : '#3B82F6'),
      },
    });
    companyMap.set(compName, comp);

    const placementSample = rawPlacements.find(p => p.company === compName);
    const ctcVal = placementSample ? placementSample.ctc : 6.5;
    const roleVal = placementSample ? placementSample.role : 'Software Engineer';

    const drive = await prisma.jobDrive.create({
      data: {
        companyId: comp.id,
        title: `${compName} On-Campus Recruitment Drive 2027`,
        roleTitle: roleVal,
        driveType: ctcVal >= 10.0 ? 'Dream' : 'Regular',
        packageCtc: ctcVal,
        location: 'Bangalore / Chennai / Hybrid',
        jobDescription: `Join ${compName} as a ${roleVal}. High growth opportunities, competitive compensation, and world-class tech stack.`,
        eligibilityRules: {
          minCgpa: 6.5,
          maxArrears: 1,
          stages: [
            { id: 'applied', name: 'Registration' },
            { id: 'oa', name: 'Online Assessment' },
            { id: 'tech_round_1', name: 'Technical Round 1' },
            { id: 'tech_round_2', name: 'Technical Round 2' },
            { id: 'hr', name: 'HR Interview' },
            { id: 'offered', name: 'Offered' },
          ],
        },
        applicationStart: new Date(Date.now() - 30 * 86400000),
        applicationEnd: new Date(Date.now() + 10 * 86400000),
        driveStart: new Date(Date.now() - 15 * 86400000),
        status: 'published',
        batch: '2027',
        createdBy: adminUser.id,
      },
    });
    driveMap.set(compName, drive);

    // Create Drive Rounds
    const roundsData = [
      { roundName: 'Online Coding Assessment', roundOrder: 1, roundType: 'Assessment' },
      { roundName: 'Technical Interview 1', roundOrder: 2, roundType: 'Interview' },
      { roundName: 'Technical Interview 2', roundOrder: 3, roundType: 'Interview' },
      { roundName: 'HR & Cultural Fit', roundOrder: 4, roundType: 'Interview' },
    ];
    for (const r of roundsData) {
      await prisma.driveRound.create({
        data: {
          driveId: drive.id,
          roundName: r.roundName,
          roundOrder: r.roundOrder,
          roundType: r.roundType,
          instructions: `Complete round ${r.roundOrder} within scheduled time window.`,
        },
      });
    }
  }
  console.log(`✅ ${companyMap.size} Companies & Job Drives created with Rounds`);

  // Track created regNumbers & emails to prevent duplicates
  const seededRegNumbers = new Set<string>();

  // 4. A. Placed Students (50)
  for (const p of rawPlacements) {
    seededRegNumbers.add(p.regNo);
    const email = `${p.rollNo.toLowerCase()}@sece.ac.in`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: p.name,
        role: 'student',
        status: 'active',
      },
    });

    const student = await prisma.student.upsert({
      where: { registerNumber: p.regNo },
      update: {},
      create: {
        userId: user.id,
        registerNumber: p.regNo,
        rollNumber: p.rollNo,
        name: p.name,
        department: 'AI&DS',
        year: 2027,
        section: p.section,
        gender: p.name.includes('A') || p.name.includes('I') ? 'Female' : 'Male',
        placementStatus: 'placed',
        collegeEmail: email,
        personalEmail: `${p.name.toLowerCase().replace(/[^a-z]/g, '')}@gmail.com`,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        cgpa: (7.5 + Math.random() * 2.2).toFixed(2) as any,
        tenthScore: 88.5,
        twelfthScore: 91.2,
        activeArrears: 0,
        historyOfBacklogs: false,
      },
    });

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        resumeUrl: 'https://raw.githubusercontent.com/aids-portal/resumes/main/sample_resume.pdf',
        linkedinUrl: `https://linkedin.com/in/${p.name.toLowerCase().replace(/[^a-z]/g, '')}`,
        githubUrl: `https://github.com/${p.name.toLowerCase().replace(/[^a-z]/g, '')}`,
        profileCompletion: 95,
        verificationStatus: 'verified',
        leetcodeCount: 120 + Math.floor(Math.random() * 200),
        preferredRoles: ['Software Engineer', 'AI Engineer', 'Backend Developer'],
        preferredLocations: ['Bangalore', 'Chennai', 'Hyderabad'],
        workModePreference: 'Hybrid',
      },
    });

    await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        documentType: 'Resume',
        title: `${p.name} - Master Resume.pdf`,
        url: 'https://raw.githubusercontent.com/aids-portal/resumes/main/sample_resume.pdf',
        isRequired: true,
        verificationStatus: 'verified',
      },
    });

    const comp = companyMap.get(p.company);
    const drive = driveMap.get(p.company);

    if (comp && drive) {
      await prisma.application.create({
        data: {
          studentId: student.id,
          driveId: drive.id,
          status: 'Offered',
          currentStage: 'offered',
          packageCtc: p.ctc,
          outcome: 'Selected',
        },
      });

      await prisma.offer.create({
        data: {
          studentId: student.id,
          driveId: drive.id,
          companyId: comp.id,
          roleTitle: p.role,
          packageCtc: p.ctc,
          offerStatus: 'issued',
          acceptanceStatus: 'accepted',
          joiningStatus: 'pending',
          joinedAt: new Date('2026-07-01'),
          remarks: 'Accepted offer with full joining confirmation.',
        },
      });
    }
  }

  // 4. B. Unplaced Students (To total 163 students)
  let unplacedIdx = 1;
  while (seededRegNumbers.size < 163) {
    const regNo = `722823243${String(unplacedIdx).padStart(3, '0')}`;
    const rollNo = `23AD${String(unplacedIdx).padStart(3, '0')}`;
    unplacedIdx++;

    if (seededRegNumbers.has(regNo)) continue;
    seededRegNumbers.add(regNo);

    const email = `${rollNo.toLowerCase()}@sece.ac.in`;
    const sec = unplacedIdx % 3 === 0 ? 'C' : (unplacedIdx % 2 === 0 ? 'B' : 'A');
    const name = `Student ${unplacedIdx} (AI&DS)`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        role: 'student',
        status: 'active',
      },
    });

    const student = await prisma.student.upsert({
      where: { registerNumber: regNo },
      update: {},
      create: {
        userId: user.id,
        registerNumber: regNo,
        rollNumber: rollNo,
        name,
        department: 'AI&DS',
        year: 2027,
        section: sec,
        gender: unplacedIdx % 2 === 0 ? 'Female' : 'Male',
        placementStatus: 'unplaced',
        collegeEmail: email,
        personalEmail: `student${unplacedIdx}@gmail.com`,
        phone: `+91 97${Math.floor(10000000 + Math.random() * 90000000)}`,
        cgpa: (6.5 + Math.random() * 2.5).toFixed(2) as any,
        tenthScore: 82.0,
        twelfthScore: 85.0,
        activeArrears: unplacedIdx % 5 === 0 ? 1 : 0,
        historyOfBacklogs: unplacedIdx % 7 === 0,
      },
    });

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        resumeUrl: 'https://raw.githubusercontent.com/aids-portal/resumes/main/sample_resume.pdf',
        profileCompletion: 80,
        verificationStatus: 'verified',
        leetcodeCount: 45 + Math.floor(Math.random() * 100),
        preferredRoles: ['Software Engineer', 'Data Analyst'],
        preferredLocations: ['Chennai', 'Bangalore'],
        workModePreference: 'In-office',
      },
    });
  }
  console.log(`✅ Total ${seededRegNumbers.size} Students, Profiles & Applications created`);

  // 5. Notices & Announcements
  await prisma.notice.createMany({
    data: [
      {
        title: '📢 Amazon SDE-1 On-Campus Placement Drive Announced',
        body: 'Amazon campus drive for Batch 2027 AI&DS students is scheduled for June 2026. Package: 45.0 LPA. Register before deadline.',
        audience: 'Batch 2027',
        priority: 'high',
        status: 'published',
        pinned: true,
        createdBy: adminUser.id,
      },
      {
        title: '⚡ Mandatory Resume & LeetCode Profile Verification',
        body: 'All students must ensure their LeetCode problem count and GitHub profile links are updated before upcoming dream drives.',
        audience: 'All Students',
        priority: 'urgent',
        status: 'published',
        pinned: true,
        createdBy: adminUser.id,
      },
      {
        title: '🎉 ServiceNow Placement Results Out (44 LPA)',
        body: 'Hearty congratulations to Ramya T and Tarun J from AI&DS for securing SDE offers at ServiceNow with 44.0 LPA package!',
        audience: 'All Department',
        priority: 'normal',
        status: 'published',
        pinned: false,
        createdBy: staffUser.id,
      },
    ],
  });
  console.log('✅ Notices created');

  // 6. Events & Calendar
  await prisma.event.createMany({
    data: [
      {
        title: 'ServiceNow Coding & Technical Assessment',
        description: 'Online coding round on HackerRank for registered candidates.',
        eventDate: new Date('2026-05-10'),
        startTime: '10:00 AM',
        endTime: '12:30 PM',
        audience: 'Registered Students',
        status: 'completed',
        createdBy: adminUser.id,
      },
      {
        title: 'Amazon Tech Interview Round 1 & 2',
        description: 'Data Structures, Algorithms & System Design interviews.',
        eventDate: new Date('2026-07-06'),
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        audience: 'Shortlisted Candidates',
        status: 'scheduled',
        createdBy: adminUser.id,
      },
      {
        title: 'Mock Technical Interview Workshop by Alumni',
        description: 'Interactive 1-on-1 interview practice session for unplaced students.',
        eventDate: new Date('2026-08-15'),
        startTime: '02:00 PM',
        endTime: '06:00 PM',
        audience: 'Unplaced Students',
        status: 'scheduled',
        createdBy: staffUser.id,
      },
    ],
  });
  console.log('✅ Events created');

  // 7. System Settings & Drive Templates
  await prisma.setting.createMany({
    data: [
      { settingKey: 'portal_name', settingValueJson: 'Placely AI&DS Career Platform' },
      { settingKey: 'active_batch_year', settingValueJson: 2027 },
      { settingKey: 'student_portal_disabled', settingValueJson: false },
    ],
  });

  await prisma.driveTemplate.create({
    data: {
      name: 'Standard Dream Drive Template',
      roleTitle: 'Software Engineer',
      driveType: 'Dream',
      packageCtc: '12.0 LPA',
      location: 'Bangalore',
      jobDescription: 'Standard template for high-package dream campus drives.',
    },
  });
  console.log('✅ Settings & Drive Templates created');

  console.log('🎉 Full local database seeding complete! 163 Students, 12 Companies, 50 Offers, Notices, Events & Settings ready!');
}

seedAll()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
