import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rawPlacements = [
  { regNo: '722823243055', rollNo: '23AD055', name: 'JEEVANANTHAM S', section: 'A', company: 'Anthill Networks', ctc: 8.0 },
  { regNo: '722823243098', rollNo: '23AD098', name: 'Peer Mohideen Hameed A', section: 'A', company: 'Anthill Networks', ctc: 8.0 },
  { regNo: '722823243111', rollNo: '23AD111', name: 'Ramya T', section: 'B', company: 'ServiceNow', ctc: 44.0 },
  { regNo: '722823243120', rollNo: '23AD120', name: 'SANJANA S PILLAI', section: 'B', company: 'Metropolis Technologies', ctc: 14.0 },
  { regNo: '722823243140', rollNo: '23AD140', name: 'Sruthy Suji', section: 'C', company: 'Caterpillar', ctc: 10.0 },
  { regNo: '722823243149', rollNo: '23AD149', name: 'Tarun J', section: 'C', company: 'ServiceNow', ctc: 44.0 },
  { regNo: '722823243046', rollNo: '23AD046', name: 'Harish R', section: 'A', company: 'Akaike Technologies', ctc: 4.2 },
  { regNo: '722823243027', rollNo: '23AD027', name: 'CHANDRAMUHILAN M', section: 'A', company: 'Mr Cooper', ctc: 8.0 },
  { regNo: '722823243116', rollNo: '23AD116', name: 'SAKTHIVEL M', section: 'B', company: 'Amazon', ctc: 45.0 },
  { regNo: '722823243085', rollNo: '23AD085', name: 'NIDHISH M', section: 'B', company: 'Integra Connect', ctc: 3.0 },
  { regNo: '722823243009', rollNo: '23AD009', name: 'AKASH G', section: 'A', company: 'BIG VISION', ctc: 15.0 },
  { regNo: '722823243012', rollNo: '23AD012', name: 'ANANDHI G', section: 'A', company: 'Hyland', ctc: 10.0 },
  { regNo: '722823243079', rollNo: '23AD079', name: 'MUTHU VISALAKSHI M', section: 'B', company: 'Cloud Destinations', ctc: 8.0 },
  { regNo: '722823243083', rollNo: '23AD083', name: 'NAVIYA DHARSHINI A S', section: 'B', company: 'Cloud Destinations', ctc: 8.0 },
  { regNo: '722823243053', rollNo: '23AD053', name: 'JAGATH VISHNU', section: 'A', company: 'Schneider Electric', ctc: 5.5 },
  { regNo: '722823243101', rollNo: '23AD101', name: 'PRAJESH U R', section: 'B', company: 'Schneider Electric', ctc: 5.5 },
  { regNo: '722823243115', rollNo: '23AD115', name: 'SAKTHEESWAR KUMARAN', section: 'B', company: 'Schneider Electric', ctc: 5.5 },
  { regNo: '722823243135', rollNo: '23AD135', name: 'SNEYA B R', section: 'C', company: 'Schneider Electric', ctc: 5.5 },
  { regNo: '722823243086', rollNo: '23AD086', name: 'NISHAD N', section: 'B', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243091', rollNo: '23AD091', name: 'NITHYA SREE G', section: 'B', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243097', rollNo: '23AD097', name: 'PAVITHRA A', section: 'B', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243126', rollNo: '23AD126', name: 'SARA DAWOOD S', section: 'B', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243056', rollNo: '23AD056', name: 'KAMALESH G J', section: 'A', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243080', rollNo: '23AD080', name: 'NANDHINI K P', section: 'B', company: 'Infinite Solutions', ctc: 4.5 },
  { regNo: '722823243144', rollNo: '23AD144', name: 'SURIYA A', section: 'C', company: 'Caresoft', ctc: 4.5 },
  { regNo: '722823243024', rollNo: '23AD024', name: 'ATHITHYAN M', section: 'A', company: 'Caresoft', ctc: 4.5 },
  { regNo: '722823243023', rollNo: '23AD023', name: 'ATHIKESAVAN M', section: 'A', company: 'Caresoft', ctc: 4.5 },
  { regNo: '722823243048', rollNo: '23AD048', name: 'HARISMITA B', section: 'A', company: 'Jocata', ctc: 8.0 },
  { regNo: '722823243005', rollNo: '23AD005', name: 'ADHITHIYA G', section: 'A', company: 'Jocata', ctc: 8.0 },
  { regNo: '722823243153', rollNo: '23AD153', name: 'VASANTH R', section: 'C', company: 'Jocata', ctc: 8.0 },
  { regNo: '722823243038', rollNo: '23AD038', name: 'DIVYASREERITHA R', section: 'A', company: 'Hudsmer Business Solutions', ctc: 4.0 },
  { regNo: '722823243158', rollNo: '23AD158', name: 'VISHNU YOGESH V K', section: 'C', company: 'Dassault Systems', ctc: 12.0 },
  { regNo: '722823243002', rollNo: '23AD002', name: 'ABHIRAMI T', section: 'A', company: 'PSIOG', ctc: 4.5 },
  { regNo: '722823243130', rollNo: '23AD130', name: 'SHASTY VENKATESH G', section: 'B', company: 'PSIOG', ctc: 4.5 },
  { regNo: '722823243121', rollNo: '23AD121', name: 'SANJAY P C', section: 'B', company: 'PSIOG', ctc: 4.5 },
  { regNo: '722823243146', rollNo: '23AD146', name: 'SUSITHA C', section: 'C', company: 'cloudvice', ctc: 4.0 },
  { regNo: '722823243047', rollNo: '23AD047', name: 'HARISH S', section: 'A', company: 'cloudvice', ctc: 4.0 },
  { regNo: '722823243013', rollNo: '23AD013', name: 'ANBUCHEZHIYAN A M', section: 'A', company: 'Zoho', ctc: 5.0 },
  { regNo: '722823243011', rollNo: '23AD011', name: 'AKSHAYA N', section: 'A', company: 'Digifortex', ctc: 5.0 },
  { regNo: '722823243118', rollNo: '23AD118', name: 'SANDHYA A', section: 'B', company: 'Danfoss', ctc: 5.5 },
  { regNo: '722823243104', rollNo: '23AD104', name: 'PRIYADHARSHINI M', section: 'B', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243123', rollNo: '23AD123', name: 'SANJEEVITHA C S', section: 'B', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243088', rollNo: '23AD088', name: 'NITHIN PRANAV R', section: 'B', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243032', rollNo: '23AD032', name: 'DEVDARSHAN A', section: 'A', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243022', rollNo: '23AD022', name: 'ATHARSHA P', section: 'A', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243125', rollNo: '23AD125', name: 'SANTHOSH S', section: 'B', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243050', rollNo: '23AD050', name: 'HARSHAVARSHINI P S', section: 'A', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243099', rollNo: '23AD099', name: 'POOJA M', section: 'B', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243143', rollNo: '23AD143', name: 'SURENDAR P S', section: 'C', company: 'Hexaware', ctc: 4.0 },
  { regNo: '722823243129', rollNo: '23AD129', name: 'SHAAM S R', section: 'B', company: 'Hexaware', ctc: 4.0 },
];

async function main() {
  console.log('Seeding local PostgreSQL placely database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aids.com' },
    update: {},
    create: {
      email: 'admin@aids.com',
      name: 'Department Admin',
      role: 'admin',
      status: 'active',
    },
  });
  console.log('Admin user ready:', adminUser.email);

  // Seed companies
  const companyMap = new Map<string, string>();
  for (const p of rawPlacements) {
    const key = p.company.trim();
    if (!companyMap.has(key)) {
      const c = await prisma.company.create({
        data: {
          name: key,
          status: 'active',
        },
      });
      companyMap.set(key, c.id);
    }
  }

  // Seed 50 placed students
  let count = 0;
  for (const p of rawPlacements) {
    const student = await prisma.student.upsert({
      where: { registerNumber: p.regNo },
      update: {
        placementStatus: 'placed',
        cgpa: 8.5,
      },
      create: {
        registerNumber: p.regNo,
        rollNumber: p.rollNo,
        name: p.name,
        department: 'AI&DS',
        year: 2027,
        section: p.section,
        placementStatus: 'placed',
        cgpa: 8.5,
        collegeEmail: `${p.rollNo.toLowerCase()}@sece.ac.in`,
      },
    });

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        profileCompletion: 90,
        verificationStatus: 'verified',
        leetcodeCount: 150,
      },
    });

    const companyId = companyMap.get(p.company.trim());
    if (companyId) {
      await prisma.offer.create({
        data: {
          studentId: student.id,
          companyId: companyId,
          roleTitle: 'Software Engineer',
          packageCtc: p.ctc,
          offerStatus: 'issued',
          acceptanceStatus: 'accepted',
          joiningStatus: 'pending',
        },
      });
    }
    count++;
  }

  // Seed 113 unplaced students to reach 163 total
  for (let i = count + 1; i <= 163; i++) {
    const regNo = `722823243${100 + i}`;
    const rollNo = `23AD${100 + i}`;
    const sec = i % 3 === 0 ? 'C' : (i % 2 === 0 ? 'B' : 'A');
    const name = `Student ${i}`;

    const student = await prisma.student.upsert({
      where: { registerNumber: regNo },
      update: {},
      create: {
        registerNumber: regNo,
        rollNumber: rollNo,
        name: name,
        department: 'AI&DS',
        year: 2027,
        section: sec,
        placementStatus: 'unplaced',
        cgpa: 7.8,
        collegeEmail: `${rollNo.toLowerCase()}@sece.ac.in`,
      },
    });

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        profileCompletion: 75,
        verificationStatus: 'verified',
        leetcodeCount: 80,
      },
    });
  }

  console.log('✅ Local PostgreSQL placely database successfully seeded with 163 students and 50 offers!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
