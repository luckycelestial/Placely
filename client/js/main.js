// Placely Toy Data
const students = [
  { id: 1, name: "Aarav Kumar", email: "aarav@college.edu", codingProblems: 120, internships: 2, certifications: 3, gradePoints: 8.7, year: 3, interest: "Placed", dept: "CSE" },
  { id: 2, name: "Sneha Reddy", email: "sneha@college.edu", codingProblems: 80, internships: 1, certifications: 2, gradePoints: 9.1, year: 2, interest: "Higher Studies", dept: "IT" },
  { id: 3, name: "Rahul Singh", email: "rahul@college.edu", codingProblems: 200, internships: 0, certifications: 1, gradePoints: 7.9, year: 4, interest: "Placed", dept: "ECE" },
  { id: 4, name: "Priya Sharma", email: "priya@college.edu", codingProblems: 150, internships: 1, certifications: 4, gradePoints: 8.3, year: 3, interest: "Uninterested", dept: "CSE" },
  { id: 5, name: "Vikram Patel", email: "vikram@college.edu", codingProblems: 60, internships: 2, certifications: 2, gradePoints: 8.9, year: 2, interest: "Interested", dept: "ME" }
];

const recentlyPlaced = [
  { name: "Priya Sharma", package: 18.5, company: "Google", position: "Software Engineer", graduationYear: 2024, date: "2026-01-25" },
  { name: "Aarav Kumar", package: 16.8, company: "Microsoft", position: "SDE-2", graduationYear: 2024, date: "2026-01-20" },
  { name: "Sneha Reddy", package: 15.2, company: "Amazon", position: "Associate Engineer", graduationYear: 2025, date: "2026-01-18" }
];

const upcomingCompanies = [
  { name: "Microsoft", visitDate: "Feb 5, 2026", position: "Software Engineer", salary: "20-24 LPA", ctc: "22 LPA" },
  { name: "ServiceNow", visitDate: "Feb 7, 2026", position: "Developer", salary: "18-22 LPA", ctc: "20 LPA" },
  { name: "Autodesk", visitDate: "Feb 9, 2026", position: "Software Developer", salary: "19-23 LPA", ctc: "21 LPA" },
  { name: "Amazon", visitDate: "Feb 11, 2026", position: "SDE I", salary: "17-21 LPA", ctc: "19 LPA" },
  { name: "Commvault Cloud", visitDate: "Feb 13, 2026", position: "Engineer", salary: "16-20 LPA", ctc: "18 LPA" },
  { name: "JustPay", visitDate: "Feb 15, 2026", position: "Backend Engineer", salary: "12-16 LPA", ctc: "14 LPA" },
  { name: "Wells Fargo", visitDate: "Feb 17, 2026", position: "Technology Analyst", salary: "15-18 LPA", ctc: "16.5 LPA" },
  { name: "Global Knowledge", visitDate: "Feb 19, 2026", position: "Associate", salary: "8-10 LPA", ctc: "9 LPA" },
  { name: "ThoughtWorks", visitDate: "Feb 21, 2026", position: "Developer", salary: "14-18 LPA", ctc: "16 LPA" },
  { name: "Akaike", visitDate: "Feb 23, 2026", position: "Software Engineer", salary: "12-15 LPA", ctc: "13.5 LPA" },
  { name: "Informatica", visitDate: "Feb 25, 2026", position: "Data Engineer", salary: "16-20 LPA", ctc: "18 LPA" },
  { name: "ShopUp", visitDate: "Feb 27, 2026", position: "Full Stack Developer", salary: "10-13 LPA", ctc: "11.5 LPA" },
  { name: "Cyware", visitDate: "Mar 1, 2026", position: "Security Engineer", salary: "15-19 LPA", ctc: "17 LPA" },
  { name: "Dell Technologies", visitDate: "Mar 3, 2026", position: "Senior Engineer", salary: "18-22 LPA", ctc: "20 LPA" },
  { name: "Quinbay", visitDate: "Mar 5, 2026", position: "Backend Developer", salary: "11-14 LPA", ctc: "12.5 LPA" },
  { name: "Sahaj", visitDate: "Mar 7, 2026", position: "Engineer", salary: "9-11 LPA", ctc: "10 LPA" },
  { name: "Casa Retail AI", visitDate: "Mar 9, 2026", position: "ML Engineer", salary: "13-16 LPA", ctc: "14.5 LPA" },
  { name: "Cooper", visitDate: "Mar 11, 2026", position: "Developer", salary: "10-12 LPA", ctc: "11 LPA" },
  { name: "nference", visitDate: "Mar 13, 2026", position: "AI Engineer", salary: "14-18 LPA", ctc: "16 LPA" },
  { name: "GUVI", visitDate: "Mar 15, 2026", position: "Content Engineer", salary: "7-9 LPA", ctc: "8 LPA" },
  { name: "Digital Back Office", visitDate: "Mar 17, 2026", position: "Process Associate", salary: "4-5 LPA", ctc: "4.5 LPA" },
  { name: "Light & Wonder", visitDate: "Mar 19, 2026", position: "Software Engineer", salary: "15-19 LPA", ctc: "17 LPA" },
  { name: "Presidio", visitDate: "Mar 21, 2026", position: "Systems Engineer", salary: "11-14 LPA", ctc: "12.5 LPA" },
  { name: "1CloudHub", visitDate: "Mar 23, 2026", position: "Cloud Engineer", salary: "13-17 LPA", ctc: "15 LPA" },
  { name: "FundsIndia", visitDate: "Mar 25, 2026", position: "Full Stack Developer", salary: "11-15 LPA", ctc: "13 LPA" },
  { name: "Persistent", visitDate: "Mar 27, 2026", position: "Software Developer", salary: "12-16 LPA", ctc: "14 LPA" },
  { name: "Mahindra Rise", visitDate: "Mar 29, 2026", position: "Engineer", salary: "10-13 LPA", ctc: "11.5 LPA" },
  { name: "Eunimart", visitDate: "Mar 31, 2026", position: "Backend Developer", salary: "10-12 LPA", ctc: "11 LPA" },
  { name: "TeleSoft", visitDate: "Apr 2, 2026", position: "Software Engineer", salary: "9-11 LPA", ctc: "10 LPA" },
  { name: "LINARC", visitDate: "Apr 4, 2026", position: "Developer", salary: "12-15 LPA", ctc: "13.5 LPA" }
];

const staffCredentials = { email: "staff@college.edu", password: "staff123" };
const notifications = [ { msg: 'Welcome to Placely!', date: '2026-01-27' } ];

let currentUser = null;
let isStaff = false;
let currentLoginTab = 'student';

const sectionIds = ['login-section', 'home-section', 'dashboard-section', 'reports-section', 'profile-section', 'notifications-section', 'leaderboard-section'];

function showSection(sectionId) {
  sectionIds.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
  const el = document.getElementById(sectionId);
  if (el) el.classList.add('active');
  if (sectionId === 'home-section') renderHome();
  if (sectionId === 'dashboard-section') renderDashboard();
  if (sectionId === 'reports-section') renderReports();
  if (sectionId === 'profile-section') renderProfile();
  if (sectionId === 'notifications-section') renderNotifications();
  if (sectionId === 'leaderboard-section') renderLeaderboard();
}

function switchLoginTab(tab) {
  currentLoginTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tab + '-login').classList.add('active');
}

function loginUser(e) {
  e.preventDefault();
  if (currentLoginTab === 'student') {
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value.trim();
    if (!email || !password) { alert('Please enter email and password.'); return; }
    const found = students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (found) {
      currentUser = found;
      isStaff = false;
      initializeApp();
      showSection('dashboard-section');
      renderDashboard();
    } else {
      alert('Student email not found. Use one of the demo emails:\n' + students.map(s => s.email).join('\n'));
    }
  } else {
    const email = document.getElementById('staff-email').value.trim();
    const password = document.getElementById('staff-password').value.trim();
    if (!email || !password) { alert('Please enter email and password.'); return; }
    if (email === staffCredentials.email && password === staffCredentials.password) {
      isStaff = true;
      currentUser = null;
      initializeApp();
      showSection('dashboard-section');
      renderDashboard();
    } else {
      alert('Invalid staff credentials.\nDemo: ' + staffCredentials.email + ' / ' + staffCredentials.password);
    }
  }
}

function initializeApp() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('navbar').style.display = 'flex';
  renderSortButtons();
}

function logout() {
  currentUser = null;
  isStaff = false;
  document.getElementById('navbar').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('student-email').value = '';
  document.getElementById('student-password').value = '';
  document.getElementById('staff-email').value = '';
  document.getElementById('staff-password').value = '';
  sectionIds.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('active'); });
  document.getElementById('login-section').classList.add('active');
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('login-form').addEventListener('submit', loginUser);
  document.getElementById('logout-btn').addEventListener('click', function(e) { e.preventDefault(); logout(); });
  document.getElementById('darkmode-toggle').addEventListener('click', function(e) { e.preventDefault(); toggleDarkMode(); });
  if (localStorage.getItem('theme') === 'light') { document.body.classList.add('light-mode'); document.getElementById('darkmode-toggle').textContent = '☀️'; }
  
  // TEMP: Skip login and go directly to home
  isStaff = true; // Set as staff to see all analytics
  currentUser = null;
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('navbar').style.display = 'flex';
  renderSortButtons();
  showSection('home-section');
  renderHome();
});

// Dark/Light Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  document.getElementById('darkmode-toggle').textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
}

function renderBanner(container) {
  const topPlaced = recentlyPlaced[0]; // Highest package
  const bannerHtml = `
    <div class="banner-card">
      <div class="banner-content">
        <div class="banner-icon">🎉</div>
        <div class="banner-info">
          <h2 style="margin: 0 0 0.5rem 0;">Recently Placed - Highest Package!</h2>
          <div class="banner-student">
            <h3 style="margin: 0.5rem 0;">${topPlaced.name}</h3>
            <p style="margin: 0.3rem 0; font-size: 1.1rem;"><strong>Package: ₹${topPlaced.package} LPA</strong></p>
            <p style="margin: 0.3rem 0;"><strong>Company:</strong> ${topPlaced.company}</p>
            <p style="margin: 0.3rem 0;"><strong>Position:</strong> ${topPlaced.position}</p>
            <p style="margin: 0.3rem 0; font-size: 0.9rem; color: #999;">Placed on ${topPlaced.date}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = bannerHtml;
}

function renderCompaniesList(container) {
  const companiesHtml = `
    <div class="companies-section">
      <h3 style="margin-top: 0;">Companies Coming Soon 📅</h3>
      <div class="companies-scroll">
        ${upcomingCompanies.map(company => `
          <div class="company-card">
            <div class="company-header">
              <h4 style="margin: 0 0 0.5rem 0;">${company.name}</h4>
              <span class="company-date">📍 ${company.visitDate}</span>
            </div>
            <p style="margin: 0.3rem 0;"><strong>Position:</strong> ${company.position}</p>
            <p style="margin: 0.3rem 0;"><strong>Salary Range:</strong> ${company.salary}</p>
            <p style="margin: 0.3rem 0;"><strong>CTC:</strong> ${company.ctc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.innerHTML = companiesHtml;
}

function renderHome() {
  const title = document.getElementById('home-title');
  const bannerContainer = document.getElementById('home-banner-container');
  const homeContent = document.getElementById('home-content');
  
  title.textContent = 'Home';
  renderBanner(bannerContainer);
  
  homeContent.innerHTML = `
    <h3 style="margin-top: 2rem; margin-bottom: 1.5rem;">Our Recruiting Partners</h3>
    <div id="companies-grid-container"></div>
  `;
  
  renderCompaniesGrid(document.getElementById('companies-grid-container'));
}

function renderCompaniesGrid(container) {
  const companiesGridHtml = `
    <div class="companies-grid-section">
      <h4 style="text-align: center; margin-bottom: 1.5rem; color: #FEC524;">IT Product Companies (AI, DS, ML, Cloud, Gaming, Cyber-security, Fintech)</h4>
      <div class="companies-grid">
        ${upcomingCompanies.map(company => `
          <div class="company-grid-card">
            <div class="company-logo-placeholder">${company.name.charAt(0)}</div>
            <p style="margin: 0.5rem 0 0.3rem 0; font-weight: bold; text-align: center;">${company.name}</p>
            <p style="margin: 0; font-size: 0.85rem; text-align: center; color: #999;">${company.position}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.innerHTML = companiesGridHtml;
}

function renderDashboard() {
  const dash = document.getElementById('dashboard-content');
  const title = document.getElementById('dashboard-title');
  const chartsContainer = document.getElementById('charts-container');
  
  if (isStaff) {
    title.textContent = 'Analytics - Staff Dashboard';
    renderStaffAnalytics(chartsContainer);
    dash.innerHTML = `<h3>Student Directory</h3><div id="staff-table"></div>`;
    renderTable(students, true);
  } else {
    title.textContent = `Welcome, ${currentUser.name}`;
    renderStudentAnalytics(chartsContainer);
    dash.innerHTML = `<h3>Your Ranking</h3><div id="student-table"></div>`;
  }
}

function renderStudentAnalytics(container) {
  container.innerHTML = `
    <div class="chart-card">
      <h3 style="text-align: center; margin-top: 0;">Placement Interest Distribution</h3>
      <canvas id="chart-interest" class="chart-canvas"></canvas>
    </div>
    <div class="chart-card">
      <h3 style="text-align: center; margin-top: 0;">Year-wise Student Distribution</h3>
      <canvas id="chart-year" class="chart-canvas"></canvas>
    </div>
  `;
  
  setTimeout(() => {
    const interestCounts = {};
    students.forEach(s => {
      interestCounts[s.interest] = (interestCounts[s.interest] || 0) + 1;
    });
    
    new Chart(document.getElementById('chart-interest'), {
      type: 'pie',
      data: {
        labels: Object.keys(interestCounts),
        datasets: [{
          data: Object.values(interestCounts),
          backgroundColor: ['#4F7FFF', '#21C1B6', '#9B6DFF', '#FF6B6B'],
          borderColor: '#000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f5f5f5', font: { size: 12 } },
            position: 'bottom'
          }
        }
      }
    });
    
    const yearCounts = {};
    students.forEach(s => {
      const yr = 'Year ' + s.year;
      yearCounts[yr] = (yearCounts[yr] || 0) + 1;
    });
    
    new Chart(document.getElementById('chart-year'), {
      type: 'pie',
      data: {
        labels: Object.keys(yearCounts),
        datasets: [{
          data: Object.values(yearCounts),
          backgroundColor: ['#4F7FFF', '#21C1B6', '#9B6DFF', '#FF6B6B'],
          borderColor: '#000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f5f5f5', font: { size: 12 } },
            position: 'bottom'
          }
        }
      }
    });
  }, 0);
}

function renderStaffAnalytics(container) {
  container.innerHTML = `
    <div class="chart-card">
      <h3 style="text-align: center; margin-top: 0;">Year 3 - Placement Status</h3>
      <canvas id="chart-year3" class="chart-canvas"></canvas>
    </div>
    <div class="chart-card">
      <h3 style="text-align: center; margin-top: 0;">Year 4 - Placement Status</h3>
      <canvas id="chart-year4" class="chart-canvas"></canvas>
    </div>
  `;
  
  setTimeout(() => {
    const year3Students = students.filter(s => s.year === 3);
    const year4Students = students.filter(s => s.year === 4);
    
    const criteria = ['Placed', 'Interested', 'Uninterested', 'Higher Studies'];
    
    const countStudentsByCriteria = (data) => {
      const counts = {};
      criteria.forEach(c => counts[c] = 0);
      data.forEach(s => {
        const interest = s.interest;
        if (criteria.includes(interest)) {
          counts[interest]++;
        }
      });
      return counts;
    };
    
    const year3Counts = countStudentsByCriteria(year3Students);
    const year4Counts = countStudentsByCriteria(year4Students);
    
    new Chart(document.getElementById('chart-year3'), {
      type: 'pie',
      data: {
        labels: criteria,
        datasets: [{
          data: criteria.map(c => year3Counts[c]),
          backgroundColor: ['#4F7FFF', '#21C1B6', '#FF6B6B', '#9B6DFF'],
          borderColor: '#000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f5f5f5', font: { size: 12 } },
            position: 'bottom'
          }
        }
      }
    });
    
    new Chart(document.getElementById('chart-year4'), {
      type: 'pie',
      data: {
        labels: criteria,
        datasets: [{
          data: criteria.map(c => year4Counts[c]),
          backgroundColor: ['#4F7FFF', '#21C1B6', '#FF6B6B', '#9B6DFF'],
          borderColor: '#000',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#f5f5f5', font: { size: 12 } },
            position: 'bottom'
          }
        }
      }
    });
  }, 0);
}

function renderSortButtons() {
  const sortDiv = document.getElementById('sort-buttons');
  const sorts = [
    { key: 'codingProblems', label: 'Coding Problems' },
    { key: 'internships', label: 'Internships' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'gradePoints', label: 'Grade Points' },
    { key: 'year', label: 'Year of Study' },
    { key: 'interest', label: 'Placement Interest' }
  ];
  
  sortDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.8rem;">
      <label for="sort-dropdown" style="margin: 0; font-weight: bold; color: #FEC524;">Sort by:</label>
      <select id="sort-dropdown" onchange="sortBy(this.value)" style="width: 200px; padding: 0.6rem; background: #0a0a0a; color: #f5f5f5; border: 1px solid #FEC524; border-radius: 6px; cursor: pointer;">
        <option value="">-- Select --</option>
        ${sorts.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
      </select>
    </div>
  `;
}

function sortBy(key) {
  let sorted;
  if (key === 'interest') {
    sorted = [...students].sort((a, b) => a.interest.localeCompare(b.interest));
  } else {
    sorted = [...students].sort((a, b) => b[key] - a[key]);
  }
  renderTable(sorted, isStaff, currentUser && currentUser.id);
}

function renderTable(data, staffView, highlightId) {
  const tableHtml = `<table><thead><tr>
    <th>Name</th>
    <th>Dept</th>
    <th>Coding Problems</th>
    <th>Internships</th>
    <th>Certifications</th>
    <th>Grade Points</th>
    <th>Year</th>
    <th>Interest</th>
    ${staffView ? '<th>Action</th>' : ''}
  </tr></thead><tbody>
    ${data.map(s => `<tr${highlightId === s.id ? ' style="background:rgba(254, 197, 36, 0.15);border-left:3px solid #FEC524;"' : ''}>
      <td>${s.name}</td>
      <td>${s.dept}</td>
      <td><span id="val-problems-${s.id}">${s.codingProblems}</span>${staffView ? `<input type="number" id="input-problems-${s.id}" value="${s.codingProblems}" style="display:none;">` : ''}</td>
      <td><span id="val-internships-${s.id}">${s.internships}</span>${staffView ? `<input type="number" id="input-internships-${s.id}" value="${s.internships}" style="display:none;">` : ''}</td>
      <td><span id="val-certs-${s.id}">${s.certifications}</span>${staffView ? `<input type="number" id="input-certs-${s.id}" value="${s.certifications}" style="display:none;">` : ''}</td>
      <td><span id="val-grade-${s.id}">${s.gradePoints}</span>${staffView ? `<input type="number" step="0.1" id="input-grade-${s.id}" value="${s.gradePoints}" style="display:none;">` : ''}</td>
      <td><span id="val-year-${s.id}">${s.year}</span>${staffView ? `<input type="number" id="input-year-${s.id}" value="${s.year}" style="display:none;">` : ''}</td>
      <td><span id="val-interest-${s.id}">${s.interest}</span>${staffView ? `<input type="text" id="input-interest-${s.id}" value="${s.interest}" style="display:none;">` : ''}</td>
      ${staffView ? `<td><button class="btn" style="width: 80px; padding: 0.4rem 0.8rem; font-size: 0.85rem;" id="btn-${s.id}" onclick="toggleEdit(${s.id})">Edit</button><button class="btn" style="width: 80px; padding: 0.4rem 0.8rem; font-size: 0.85rem; display: none; background: #E6A800;" id="save-${s.id}" onclick="saveEdit(${s.id})">Save</button></td>` : ''}
    </tr>`).join('')}
  </tbody></table>`;
  if (staffView) {
    document.getElementById('staff-table').innerHTML = tableHtml;
  } else {
    document.getElementById('student-table').innerHTML = tableHtml;
  }
}

function toggleEdit(studentId) {
  const student = students.find(s => s.id === studentId);
  const editBtn = document.getElementById(`btn-${studentId}`);
  const saveBtn = document.getElementById(`save-${studentId}`);
  
  const fields = ['problems', 'internships', 'certs', 'grade', 'year', 'interest'];
  const isEditing = editBtn.style.display === 'none';
  
  fields.forEach(field => {
    const span = document.getElementById(`val-${field}-${studentId}`);
    const input = document.getElementById(`input-${field}-${studentId}`);
    if (!isEditing) {
      // Enter edit mode
      input.value = span.textContent;
      span.style.display = 'none';
      input.style.display = 'inline-block';
      input.style.background = '#0a0a0a';
      input.style.color = '#f5f5f5';
      input.style.border = '1px solid #FEC524';
      input.style.padding = '0.3rem 0.5rem';
      input.style.borderRadius = '4px';
      input.style.width = '70px';
      input.style.marginRight = '0.5rem';

      if (field === 'interest') {
        input.style.display = 'none';
        let select = document.getElementById(`select-interest-${studentId}`);
        if (!select) {
          select = document.createElement('select');
          select.id = `select-interest-${studentId}`;
          select.style.background = '#0a0a0a';
          select.style.color = '#f5f5f5';
          select.style.border = '1px solid #FEC524';
          select.style.padding = '0.3rem';
          select.style.borderRadius = '4px';
          ['Interested', 'Not interested', 'Going for Higher studies', 'Interested in becoming an entrepreneur'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            select.appendChild(option);
          });
          span.parentNode.appendChild(select);
        }
        select.value = span.textContent;
        select.style.display = 'inline-block';
      }
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
    }
  });
}

function saveEdit(studentId) {
  const student = students.find(s => s.id === studentId);
  const editBtn = document.getElementById(`btn-${studentId}`);
  const saveBtn = document.getElementById(`save-${studentId}`);
  
  const problems = +document.getElementById(`input-problems-${studentId}`).value;
  const internships = +document.getElementById(`input-internships-${studentId}`).value;
  const certs = +document.getElementById(`input-certs-${studentId}`).value;
  const grade = +document.getElementById(`input-grade-${studentId}`).value;
  const year = +document.getElementById(`input-year-${studentId}`).value;
  const interest = document.getElementById(`select-interest-${studentId}`)?.value || document.getElementById(`input-interest-${studentId}`).value;
  
  if (grade < 0 || grade > 10 || year < 1 || year > 4) {
    alert('Invalid values. Grade: 0-10, Year: 1-4');
    return;
  }
  
  student.codingProblems = problems;
  student.internships = internships;
  student.certifications = certs;
  student.gradePoints = grade;
  student.year = year;
  student.interest = interest;
  
  const fields = ['problems', 'internships', 'certs', 'grade', 'year', 'interest'];
  fields.forEach(field => {
    const span = document.getElementById(`val-${field}-${studentId}`);
    const input = document.getElementById(`input-${field}-${studentId}`);
    const select = document.getElementById(`select-interest-${studentId}`);
    
    if (field === 'interest') {
      span.textContent = interest;
      if (select) select.style.display = 'none';
    } else {
      span.textContent = field === 'problems' ? problems : field === 'internships' ? internships : field === 'certs' ? certs : field === 'grade' ? grade : year;
    }
    span.style.display = 'inline';
    if (input) input.style.display = 'none';
  });
  
  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  alert('Student info updated successfully!');
}

function renderNotifications() {
  const notificationsContent = document.getElementById('notifications-content');
  const companiesContainer = document.getElementById('companies-container');
  
  renderCompaniesList(companiesContainer);
  
  notificationsContent.innerHTML = `
    <div style="margin-top: 2rem;">
      <h3>Recent Announcements</h3>
      <div class="notification-item">
        <p><strong>Placement Season 2026:</strong> Welcome to Placely! Track your placement journey with us.</p>
        <p style="color: #999; font-size: 0.9rem;">Jan 27, 2026</p>
      </div>
    </div>
  `;
}

function renderReports() {
  const reportsContent = document.getElementById('reports-chart');
  reportsContent.style.display = 'none';
  
  const reportsSection = document.getElementById('reports-section');
  let reportsDiv = document.getElementById('reports-content');
  if (!reportsDiv) {
    reportsDiv = document.createElement('div');
    reportsDiv.id = 'reports-content';
    reportsSection.appendChild(reportsDiv);
  }
  
  const placedStudents = [
    { name: "Priya Sharma", dept: "CSE", package: 18.5, company: "Google", position: "Software Engineer", graduationYear: 2024, date: "2026-01-25", codingProblems: 150, internships: 1, certifications: 4, gradePoints: 8.3 },
    { name: "Aarav Kumar", dept: "CSE", package: 16.8, company: "Microsoft", position: "SDE-2", graduationYear: 2024, date: "2026-01-20", codingProblems: 120, internships: 2, certifications: 3, gradePoints: 8.7 },
    { name: "Sneha Reddy", dept: "IT", package: 15.2, company: "Amazon", position: "Associate Engineer", graduationYear: 2025, date: "2026-01-18", codingProblems: 80, internships: 1, certifications: 2, gradePoints: 9.1 },
    { name: "Rahul Singh", dept: "ECE", package: 14.5, company: "Infosys", position: "Systems Engineer", graduationYear: 2024, date: "2026-01-15", codingProblems: 200, internships: 0, certifications: 1, gradePoints: 7.9 },
    { name: "Vikram Patel", dept: "ME", package: 12.0, company: "TCS", position: "Digital Engineer", graduationYear: 2025, date: "2026-01-10", codingProblems: 60, internships: 2, certifications: 2, gradePoints: 8.9 }
  ];
  
  reportsDiv.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <h3>Placement Statistics 2026</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
        <div class="stat-card">
          <h4 style="margin: 0; color: #4F7FFF; font-size: 2rem;">${placedStudents.length}</h4>
          <p style="margin: 0.5rem 0 0 0; color: #999;">Students Placed</p>
        </div>
        <div class="stat-card">
          <h4 style="margin: 0; color: #21C1B6; font-size: 2rem;">₹${Math.max(...placedStudents.map(s => s.package))} LPA</h4>
          <p style="margin: 0.5rem 0 0 0; color: #999;">Highest Package</p>
        </div>
        <div class="stat-card">
          <h4 style="margin: 0; color: #9B6DFF; font-size: 2rem;">₹${(placedStudents.reduce((sum, s) => sum + s.package, 0) / placedStudents.length).toFixed(1)} LPA</h4>
          <p style="margin: 0.5rem 0 0 0; color: #999;">Average Package</p>
        </div>
      </div>
    </div>
    
    <h3>Placed Students Details</h3>
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Dept</th>
            <th>Company</th>
            <th>Position</th>
            <th>Package (LPA)</th>
            <th>Placement Date</th>
            <th>Coding Problems</th>
            <th>Internships</th>
            <th>Certifications</th>
            <th>CGPA</th>
          </tr>
        </thead>
        <tbody>
          ${placedStudents.map(student => `
            <tr>
              <td><strong>${student.name}</strong></td>
              <td>${student.dept}</td>
              <td>${student.company}</td>
              <td>${student.position}</td>
              <td style="color: #21C1B6; font-weight: bold;">₹${student.package}</td>
              <td>${student.date}</td>
              <td>${student.codingProblems}</td>
              <td>${student.internships}</td>
              <td>${student.certifications}</td>
              <td>${student.gradePoints}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderProfile() {
  // Placeholder for profile rendering
}

function renderLeaderboard() {
  // Placeholder for leaderboard rendering
}