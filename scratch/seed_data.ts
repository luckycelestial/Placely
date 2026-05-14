import { supabase } from '../src/lib/supabase';

const companies = [
  {
    name: "Google",
    website: "https://google.com",
    industry: "Tech",
    logo_url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png",
    theme_color: "#4285F4"
  },
  {
    name: "Microsoft",
    website: "https://microsoft.com",
    industry: "Tech",
    logo_url: "https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31",
    theme_color: "#00A4EF"
  },
  {
    name: "Amazon",
    website: "https://amazon.jobs",
    industry: "E-commerce",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    theme_color: "#FF9900"
  },
  {
    name: "Meta",
    website: "https://meta.com",
    industry: "Social Media",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
    theme_color: "#0668E1"
  },
  {
    name: "Apple",
    website: "https://apple.com",
    industry: "Consumer Electronics",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    theme_color: "#000000"
  },
  {
    name: "Netflix",
    website: "https://netflix.com",
    industry: "Entertainment",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    theme_color: "#E50914"
  },
  {
    name: "Nvidia",
    website: "https://nvidia.com",
    industry: "Hardware",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg",
    theme_color: "#76B900"
  },
  {
    name: "Tesla",
    website: "https://tesla.com",
    industry: "Automotive",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png",
    theme_color: "#E31937"
  }
];

async function seed() {
  console.log("Seeding companies...");
  for (const company of companies) {
    const { data, error } = await supabase
      .from('companies')
      .upsert([company], { onConflict: 'name' })
      .select()
      .single();
    
    if (error) {
      console.error(`Error seeding ${company.name}:`, error.message);
      continue;
    }

    console.log(`Seeded ${company.name}`);

    // Seed a drive for each company
    const drive = {
      company_id: data.id,
      title: `${company.name} Recruitment 2026`,
      role_title: "Software Development Engineer",
      drive_type: "Full-time",
      package_ctc: `${Math.floor(Math.random() * 20 + 15)} - ${Math.floor(Math.random() * 20 + 35)} LPA`,
      location: ["Bangalore", "Hyderabad", "Remote"][Math.floor(Math.random() * 3)],
      application_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
      eligibility_rules: {
        branches: ["CSE", "IT", "ECE"],
        min_cgpa: 7.5,
        backlogs_allowed: 0,
        history_of_arrears: false
      },
      status: "published"
    };

    const { error: driveError } = await supabase
      .from('job_drives')
      .insert([drive]);

    if (driveError) {
      console.error(`Error seeding drive for ${company.name}:`, driveError.message);
    } else {
      console.log(`Seeded drive for ${company.name}`);
    }
  }
}

seed();
