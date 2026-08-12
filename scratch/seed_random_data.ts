import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Helper random functions
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoices<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random data pools
const firstNames = [
  'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavya', 'Chetan', 'Devi', 'Divya', 'Eshwar', 'Gautam',
  'Gowri', 'Harini', 'Ishaan', 'Janani', 'Kavya', 'Karthik', 'Lakshmi', 'Manoj', 'Meera', 'Nikhil',
  'Nisha', 'Pranav', 'Priya', 'Rahul', 'Rhea', 'Rohan', 'Sai', 'Siddharth', 'Sneha', 'Surya',
  'Tanvi', 'Tarun', 'Utkarsh', 'Varun', 'Vidya', 'Vikram', 'Yash', 'Zoya', 'Abhinav', 'Archana',
  'Bharath', 'Deepak', 'Gayathri', 'Hemant', 'Indira', 'Jaya', 'Kiran', 'Madhav', 'Nayana', 'Pradeep',
  'Rajesh', 'Sangeetha', 'Swati', 'Tejas', 'Uma', 'Venkatesh', 'Yogesh', 'Aswin', 'Bala', 'Dinesh'
];

const lastNames = [
  'Sharma', 'Verma', 'Nair', 'Iyer', 'Patel', 'Reddy', 'Rao', 'Subramanian', 'Kumar', 'Singh',
  'Gupta', 'Joshi', 'Kulkarni', 'Deshmukh', 'Pillai', 'Menon', 'Chaudhary', 'Banerjee', 'Chatterjee', 'Das',
  'Mukherjee', 'Roy', 'Sengupta', 'Bhat', 'Hegde', 'Shetty', 'Rajan', 'Ganesan', 'Sundaram', 'Krishnan',
  'Murthy', 'Naidu', 'Chowdary', 'Shekhar', 'Mishra', 'Pandey', 'Tripathi', 'Thakur', 'Kapoor', 'Malhotra'
];

const departments = ['AI&DS', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CSBS'];
const sections = ['A', 'B', 'C', 'D'];
const years = [2024, 2025, 2026, 2027];

const companyPrefixes = ['Apex', 'Nexus', 'Quantum', 'Cyber', 'Starlight', 'Hyperion', 'Vortex', 'Omni', 'Nova', 'Pulse', 'Aether', 'Titan', 'Zenith', 'Velocity', 'Infini', 'Solstice', 'Echo', 'Orbit', 'Strata', 'Krypton'];
const companySuffixes = ['Tech', 'Systems', 'Networks', 'Labs', 'Solutions', 'AI', 'Cloud', 'Analytics', 'Software', 'Digital', 'Robotics', 'Dynamics', 'Logic'];

const techRoles = [
  'Software Development Engineer', 'AI/ML Engineer', 'Full Stack Developer',
  'Backend Engineer', 'Frontend Engineer', 'Data Scientist', 'Cloud DevOps Engineer',
  'Cybersecurity Analyst', 'Product Engineer', 'Embedded Systems Developer', 'Data Engineer'
];

const locations = ['Bangalore, KA', 'Chennai, TN', 'Hyderabad, TS', 'Pune, MH', 'Gurgaon, HR', 'Noida, UP', 'Remote, India'];
const specializationsPool = ['Machine Learning', 'Fullstack Web Dev', 'Cloud Computing', 'Cybersecurity', 'Data Analytics', 'DevOps & CI/CD', 'Mobile App Dev', 'Blockchain', 'UI/UX Design', 'Embedded Systems'];
const workModes = ['In-office', 'Hybrid', 'Remote'];

async function generateRandomData() {
  console.log('⚡ Generating completely fresh, random data for both Local Postgres & Supabase...');

  // 1. Reset database tables in Local Postgres via Prisma
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      offers, application_timeline, drive_round_results, applications, 
      drive_rounds, job_drives, companies, student_documents, student_profiles, 
      students, notifications, audit_logs, users, notices, events, placement_policies, 
      analytics_snapshots, settings, drive_templates CASCADE;
  `);

  // 2. Reset database tables in Remote Supabase
  await supabase.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('job_drives').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('🧹 Local Postgres & Supabase tables truncated');

  // 3. Create System Admin & Staff
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@placement.edu',
      name: 'Dr. R. Ramanathan (Chief TPO)',
      role: 'admin',
      status: 'active',
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'officer@placement.edu',
      name: 'Prof. S. Meenakshi (Placement Coordinator)',
      role: 'staff',
      status: 'active',
    },
  });

  // 4. Create Placement Policy
  await prisma.placementPolicy.create({
    data: {
      name: 'University Placement Policy 2026-27',
      description: 'Standard eligibility and dream-job upgrade policies across all departments.',
      minCgpa: 6.00,
      maxActiveArrears: 2,
      allowHistoryOfBacklogs: true,
      maxOffersAllowed: 2,
      upgradePolicyCtcMultiplier: 1.50,
      isActive: true,
      isDefault: true,
    },
  });

  // 5. Create 25 Random Companies & Job Drives
  const companies: any[] = [];
  const jobDrives: any[] = [];

  for (let i = 1; i <= 25; i++) {
    const compName = `${randomChoice(companyPrefixes)} ${randomChoice(companySuffixes)}`;
    const comp = await prisma.company.create({
      data: {
        name: compName,
        website: `https://www.${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
        industry: randomChoice(['SaaS', 'FinTech', 'AI & DeepTech', 'Enterprise Tech', 'E-Commerce', 'Cloud Infrastructure']),
        hrName: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
        hrEmail: `recruitment@${compName.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
        hrPhone: `+91 ${randomInt(9000000000, 9999999999)}`,
        status: 'active',
        themeColor: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      },
    });
    companies.push(comp);

    // Sync to Supabase
    await supabase.from('companies').insert([{
      id: comp.id,
      name: comp.name,
      website: comp.website,
      industry: comp.industry,
      hr_name: comp.hrName,
      hr_email: comp.hrEmail,
      hr_phone: comp.hrPhone,
      status: comp.status,
      theme_color: comp.themeColor
    }]);

    const ctc = randomFloat(4.0, 48.0, 1);
    const driveType = ctc >= 14.0 ? 'Super Dream' : (ctc >= 8.0 ? 'Dream' : 'Regular');
    const role = randomChoice(techRoles);

    const drive = await prisma.jobDrive.create({
      data: {
        companyId: comp.id,
        title: `${compName} ${driveType} Placement Drive`,
        roleTitle: role,
        driveType: driveType,
        packageCtc: ctc,
        location: randomChoice(locations),
        jobDescription: `High impact role for ${role} at ${compName}. Excellent learning curve, competitive package of ${ctc} LPA, and flexible work environment.`,
        eligibilityRules: {
          minCgpa: randomFloat(6.0, 7.5, 1),
          maxArrears: randomInt(0, 2),
          stages: [
            { id: 'applied', name: 'Application Submitted' },
            { id: 'oa', name: 'Online Coding Test' },
            { id: 'tech_1', name: 'Technical Round 1' },
            { id: 'tech_2', name: 'System Design / Tech 2' },
            { id: 'hr', name: 'HR & Cultural Fit' },
            { id: 'offered', name: 'Offered' }
          ]
        },
        applicationStart: new Date(Date.now() - randomInt(10, 40) * 86400000),
        applicationEnd: new Date(Date.now() + randomInt(5, 20) * 86400000),
        driveStart: new Date(Date.now() + randomInt(2, 10) * 86400000),
        status: randomChoice(['published', 'active', 'completed']),
        batch: String(randomChoice(years)),
        createdBy: adminUser.id,
      },
    });
    jobDrives.push(drive);

    // Sync Drive to Supabase
    await supabase.from('job_drives').insert([{
      id: drive.id,
      company_id: drive.companyId,
      title: drive.title,
      role_title: drive.roleTitle,
      drive_type: drive.driveType,
      package_ctc: ctc,
      location: drive.location,
      job_description: drive.jobDescription,
      eligibility_rules: drive.eligibilityRules,
      status: drive.status,
      batch: drive.batch
    }]);

    // Drive Rounds
    const rounds = [
      { name: 'Online Coding Round', order: 1, type: 'Assessment' },
      { name: 'Technical Interview 1', order: 2, type: 'Interview' },
      { name: 'Technical Interview 2', order: 3, type: 'Interview' },
      { name: 'HR Round', order: 4, type: 'Interview' }
    ];
    for (const r of rounds) {
      await prisma.driveRound.create({
        data: {
          driveId: drive.id,
          roundName: r.name,
          roundOrder: r.order,
          roundType: r.type,
          instructions: `Conduct ${r.name} for drive candidates.`
        }
      });
    }
  }
  console.log(`🏢 Created 25 Companies & Job Drives in Local Postgres & Supabase`);

  // 6. Create 120 Random Students, Profiles & Documents
  const students: any[] = [];

  for (let i = 1; i <= 120; i++) {
    const fn = randomChoice(firstNames);
    const ln = randomChoice(lastNames);
    const fullName = `${fn} ${ln}`;
    const regNo = `722823${randomInt(100000, 999999)}`;
    const rollNo = `23AD${String(i).padStart(3, '0')}`;
    const dept = randomChoice(departments);
    const year = randomChoice(years);
    const sec = randomChoice(sections);
    const email = `${rollNo.toLowerCase()}@institution.edu`;

    const user = await prisma.user.create({
      data: {
        email: email,
        name: fullName,
        role: 'student',
        status: 'active',
      },
    });

    const isPlaced = Math.random() > 0.55;
    const cgpa = randomFloat(6.2, 9.8, 2);

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        registerNumber: regNo,
        rollNumber: rollNo,
        name: fullName,
        department: dept,
        year: year,
        section: sec,
        gender: randomChoice(['Male', 'Female']),
        dateOfBirth: new Date(`${randomInt(2002, 2005)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`),
        placementStatus: isPlaced ? 'placed' : 'unplaced',
        collegeEmail: email,
        personalEmail: `${fn.toLowerCase()}.${ln.toLowerCase()}${randomInt(10, 99)}@gmail.com`,
        phone: `+91 ${randomInt(9000000000, 9999999999)}`,
        address: `${randomInt(1, 150)}, High Street, Tech Corridor`,
        city: randomChoice(['Coimbatore', 'Chennai', 'Bangalore', 'Madurai', 'Trichy']),
        state: 'Tamil Nadu',
        pincode: `6410${randomInt(10, 99)}`,
        cgpa: cgpa as any,
        tenthScore: randomFloat(75.0, 98.5, 2),
        twelfthScore: randomFloat(78.0, 97.5, 2),
        activeArrears: Math.random() > 0.85 ? randomInt(1, 3) : 0,
        historyOfBacklogs: Math.random() > 0.9,
      },
    });

    const profileCompletion = randomInt(70, 100);
    const leetcodeCount = randomInt(25, 650);
    const specs = randomChoices(specializationsPool, randomInt(2, 4));
    const prefRoles = randomChoices(techRoles, randomInt(1, 3));
    const prefLocs = randomChoices(locations, randomInt(1, 3));

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        resumeUrl: `https://storage.institution.edu/resumes/${regNo}_resume.pdf`,
        linkedinUrl: `https://linkedin.com/in/${fn.toLowerCase()}-${ln.toLowerCase()}`,
        githubUrl: `https://github.com/${fn.toLowerCase()}${ln.toLowerCase()}`,
        portfolioUrl: `https://${fn.toLowerCase()}${ln.toLowerCase()}.dev`,
        profileCompletion: profileCompletion,
        verificationStatus: 'verified',
        leetcodeCount: leetcodeCount,
        specializations: specs,
        preferredRoles: prefRoles,
        preferredLocations: prefLocs,
        workModePreference: randomChoice(workModes),
        travelPreference: randomChoice(['Yes', 'No', 'Flexible']),
        shiftPreference: 'Day Shift',
        placementInterest: 'Campus Placements',
      },
    });

    await prisma.studentDocument.create({
      data: {
        studentId: student.id,
        documentType: 'Resume',
        title: `${fullName} - Master Resume 2026.pdf`,
        url: `https://storage.institution.edu/resumes/${regNo}_resume.pdf`,
        isRequired: true,
        verificationStatus: 'verified',
      },
    });

    // Sync to Supabase
    await supabase.from('students').insert([{
      id: student.id,
      user_id: user.id,
      register_number: student.registerNumber,
      roll_number: student.rollNumber,
      name: student.name,
      department: student.department,
      year: student.year,
      section: student.section,
      gender: student.gender,
      placement_status: student.placementStatus,
      college_email: student.collegeEmail,
      personal_email: student.personalEmail,
      phone: student.phone,
      cgpa: student.cgpa,
      tenth_score: student.tenthScore,
      twelfth_score: student.twelfthScore,
      active_arrears: student.activeArrears,
      history_of_backlogs: student.historyOfBacklogs,
      profile_completion: profileCompletion,
      verification_status: 'verified'
    }]);

    await supabase.from('student_profiles').insert([{
      student_id: student.id,
      resume_url: `https://storage.institution.edu/resumes/${regNo}_resume.pdf`,
      profile_completion: profileCompletion,
      verification_status: 'verified',
      leetcode_count: leetcodeCount,
      specializations: specs,
      preferred_roles: prefRoles,
      preferred_locations: prefLocs
    }]);

    students.push(student);
  }
  console.log(`🎓 Created 120 Students in Local Postgres & Supabase`);

  // 7. Generate Applications & Offers
  let totalApplications = 0;
  let totalOffers = 0;

  for (const student of students) {
    const numDrives = randomInt(2, 6);
    const selectedDrives = randomChoices(jobDrives, numDrives);

    for (const drive of selectedDrives) {
      const isOfferGiven = student.placementStatus === 'placed' && Math.random() > 0.5;
      const status = isOfferGiven ? 'Offered' : randomChoice(['Applied', 'In Review', 'Shortlisted', 'Rejected']);
      const stage = isOfferGiven ? 'offered' : (status === 'Applied' ? 'applied' : 'oa');

      const app = await prisma.application.create({
        data: {
          studentId: student.id,
          driveId: drive.id,
          status: status,
          currentStage: stage,
          packageCtc: drive.packageCtc,
          outcome: isOfferGiven ? 'Selected' : (status === 'Rejected' ? 'Not Selected' : 'Pending'),
          appliedAt: new Date(Date.now() - randomInt(5, 30) * 86400000),
        },
      });
      totalApplications++;

      // Sync Application to Supabase
      await supabase.from('applications').insert([{
        id: app.id,
        student_id: student.id,
        drive_id: drive.id,
        status: app.status,
        current_stage: app.currentStage,
        package_ctc: drive.packageCtc,
        applied_at: app.appliedAt.toISOString()
      }]);

      if (isOfferGiven) {
        const comp = companies.find(c => c.id === drive.companyId);
        const offer = await prisma.offer.create({
          data: {
            studentId: student.id,
            driveId: drive.id,
            companyId: drive.companyId,
            roleTitle: drive.roleTitle,
            packageCtc: drive.packageCtc,
            offerStatus: 'issued',
            acceptanceStatus: 'accepted',
            joiningStatus: 'pending',
            joinedAt: new Date('2026-07-01'),
            remarks: `Official offer issued by ${comp?.name} for ${drive.roleTitle}.`,
          },
        });
        totalOffers++;

        // Sync Offer to Supabase
        await supabase.from('offers').insert([{
          id: offer.id,
          student_id: student.id,
          drive_id: drive.id,
          company_id: drive.companyId,
          role_title: offer.roleTitle,
          package_ctc: drive.packageCtc,
          offer_status: offer.offerStatus,
          acceptance_status: offer.acceptanceStatus,
          joining_status: offer.joiningStatus,
          joining_date: '2026-07-01'
        }]);
      }
    }
  }
  console.log(`📝 Generated ${totalApplications} Applications and ${totalOffers} Offers across Local Postgres & Supabase`);

  console.log('🎉 Completely random database seed executed for BOTH Local Postgres AND Supabase!');
}

generateRandomData()
  .catch(e => {
    console.error('Random Seed Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
