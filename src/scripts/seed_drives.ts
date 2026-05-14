
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const companies = [
  { name: "Google", logo_url: "https://logo.clearbit.com/google.com", theme_color: "#4285F4", industry: "Technology", website: "https://google.com" },
  { name: "Microsoft", logo_url: "https://logo.clearbit.com/microsoft.com", theme_color: "#00A4EF", industry: "Technology", website: "https://microsoft.com" },
  { name: "Amazon", logo_url: "https://logo.clearbit.com/amazon.com", theme_color: "#FF9900", industry: "E-commerce", website: "https://amazon.com" },
  { name: "Atlassian", logo_url: "https://logo.clearbit.com/atlassian.com", theme_color: "#0052CC", industry: "Software", website: "https://atlassian.com" },
  { name: "Uber", logo_url: "https://logo.clearbit.com/uber.com", theme_color: "#000000", industry: "Transportation", website: "https://uber.com" },
  { name: "Airbnb", logo_url: "https://logo.clearbit.com/airbnb.com", theme_color: "#FF5A5F", industry: "Hospitality", website: "https://airbnb.com" },
  { name: "Spotify", logo_url: "https://logo.clearbit.com/spotify.com", theme_color: "#1DB954", industry: "Entertainment", website: "https://spotify.com" },
  { name: "Apple", logo_url: "https://logo.clearbit.com/apple.com", theme_color: "#000000", industry: "Technology", website: "https://apple.com" },
  { name: "Netflix", logo_url: "https://logo.clearbit.com/netflix.com", theme_color: "#E50914", industry: "Entertainment", website: "https://netflix.com" },
  { name: "Meta", logo_url: "https://logo.clearbit.com/meta.com", theme_color: "#0668E1", industry: "Social Media", website: "https://meta.com" },
  { name: "NVIDIA", logo_url: "https://logo.clearbit.com/nvidia.com", theme_color: "#76B900", industry: "Hardware", website: "https://nvidia.com" },
  { name: "Adobe", logo_url: "https://logo.clearbit.com/adobe.com", theme_color: "#FF0000", industry: "Software", website: "https://adobe.com" },
  { name: "Tesla", logo_url: "https://logo.clearbit.com/tesla.com", theme_color: "#E81919", industry: "Automotive", website: "https://tesla.com" },
  { name: "OpenAI", logo_url: "https://logo.clearbit.com/openai.com", theme_color: "#00A67E", industry: "Artificial Intelligence", website: "https://openai.com" },
  { name: "Stripe", logo_url: "https://logo.clearbit.com/stripe.com", theme_color: "#635BFF", industry: "Fintech", website: "https://stripe.com" },
  { name: "Goldman Sachs", logo_url: "https://logo.clearbit.com/goldmansachs.com", theme_color: "#7399C6", industry: "Finance", website: "https://goldmansachs.com" }
];

async function seed() {
  console.log("Seeding companies...");
  
  // Clear existing companies to avoid duplicates or just insert new ones
  for (const company of companies) {
    const { data: existing } = await supabase.from('companies').select('id').eq('name', company.name).single();
    if (!existing) {
      await supabase.from('companies').insert([company]);
      console.log(`Inserted ${company.name}`);
    } else {
      await supabase.from('companies').update(company).eq('id', existing.id);
      console.log(`Updated ${company.name}`);
    }
  }

  // Get some company IDs for drives
  const { data: allCompanies } = await supabase.from('companies').select('id, name');
  if (!allCompanies) return;

  const getCompanyId = (name: string) => allCompanies.find(c => c.name === name)?.id;

  const drives = [
    {
      company_id: getCompanyId("Google"),
      role_title: "Software Engineer",
      drive_type: "Full-time",
      package_ctc: "24-30 LPA",
      location: "Bangalore",
      application_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "ECE", "AI&DS", "AI&ML"], min_cgpa: 8.0, backlogs_allowed: 0 },
      status: "published",
      title: "Google Recruitment 2026"
    },
    {
      company_id: getCompanyId("Microsoft"),
      role_title: "Cloud Associate",
      drive_type: "Full-time",
      package_ctc: "18-22 LPA",
      location: "Hyderabad",
      application_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "ECE", "EEE", "AI&DS"], min_cgpa: 7.5, backlogs_allowed: 0 },
      status: "published",
      title: "Microsoft Recruitment 2026"
    },
    {
      company_id: getCompanyId("Atlassian"),
      role_title: "Product Intern",
      drive_type: "Internship",
      package_ctc: "80k / month",
      location: "Remote",
      application_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "AI&DS", "CSBS"], min_cgpa: 8.5, backlogs_allowed: 0 },
      status: "published",
      title: "Atlassian Internship 2026"
    },
    {
      company_id: getCompanyId("Uber"),
      role_title: "Backend Engineer",
      drive_type: "Full-time",
      package_ctc: "22-26 LPA",
      location: "Gurgaon",
      application_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "AI&DS"], min_cgpa: 7.0, backlogs_allowed: 1 },
      status: "published",
      title: "Uber Mobility Drive"
    },
    {
      company_id: getCompanyId("Tesla"),
      role_title: "Embedded Systems Engineer",
      drive_type: "Full-time",
      package_ctc: "20-25 LPA",
      location: "Bangalore",
      application_end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["ECE", "EEE", "CSE"], min_cgpa: 7.5, backlogs_allowed: 0 },
      status: "published",
      title: "Tesla Autopilot Drive"
    },
    {
      company_id: getCompanyId("OpenAI"),
      role_title: "ML Researcher",
      drive_type: "Internship",
      package_ctc: "150k / month",
      location: "Remote",
      application_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "AI&ML", "AI&DS"], min_cgpa: 9.0, backlogs_allowed: 0 },
      status: "published",
      title: "OpenAI Fellows 2026"
    },
    {
      company_id: getCompanyId("Stripe"),
      role_title: "Full Stack Developer",
      drive_type: "Full-time",
      package_ctc: "25-32 LPA",
      location: "Pune",
      application_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "CYS", "CCE"], min_cgpa: 8.0, backlogs_allowed: 0 },
      status: "published",
      title: "Stripe India Launch Drive"
    },
    {
      company_id: getCompanyId("Goldman Sachs"),
      role_title: "Analyst",
      drive_type: "Full-time",
      package_ctc: "16-20 LPA",
      location: "Bangalore",
      application_end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      eligibility_rules: { branches: ["CSE", "ECE", "EEE", "CSBS", "AI&DS"], min_cgpa: 7.0, backlogs_allowed: 0 },
      status: "published",
      title: "GS Engineering Campus Hiring"
    }
  ];

  console.log("Seeding drives...");
  for (const drive of drives) {
    if (!drive.company_id) continue;
    await supabase.from('job_drives').insert([drive]);
    console.log(`Inserted drive for ${drive.title}`);
  }

  console.log("Seed completed!");
}

seed();
