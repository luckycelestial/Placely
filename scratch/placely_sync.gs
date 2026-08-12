/**
 * ╔══════════════════════════════════════════════════════════════╗
 *    Placely — Google Sheet ↔ Supabase Bidirectional Sync
 *    
 *    SETUP:
 *    1. Go to your Google Sheet
 *    2. Extensions → Apps Script
 *    3. Paste this entire file and save
 *    4. Set SUPABASE_URL and SERVICE_ROLE_KEY below
 *    5. FIRST RUN: Click "Placely Sync → Setup Sheet Tabs"
 *    6. Then: "Placely Sync → Sync from DB → Sheet"
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────
// CONFIG — Fill these in
// ─────────────────────────────────────────────────────────────
var CONFIG = {
  SUPABASE_URL     : 'https://vzwcbddpgjjfcrrelkbq.supabase.co',
  SERVICE_ROLE_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2NiZGRwZ2pqZmNycmVsa2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0MTQ0NCwiZXhwIjoyMTAxMzE3NDQ0fQ.BXQ1rIdKcQs9EI5kZdobHtooJBR6LBPapn6UjVIEvxo',
};

// ─────────────────────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔁 Placely Sync')
    .addItem('📋 Setup Sheet Tabs',         'setupTabs')
    .addSeparator()
    .addItem('⬇️  Sync from DB → Sheet',    'syncFromDB')
    .addItem('⬆️  Push Sheet → DB',         'pushToDB')
    .addToUi();
}

// ─────────────────────────────────────────────────────────────
// HTTP HELPERS
// ─────────────────────────────────────────────────────────────
function sbGet(path) {
  var url = encodeURI(CONFIG.SUPABASE_URL + '/rest/v1/' + path);
  var res = UrlFetchApp.fetch(
    url,
    {
      method : 'get',
      headers: {
        apikey         : CONFIG.SERVICE_ROLE_KEY,
        Authorization  : 'Bearer ' + CONFIG.SERVICE_ROLE_KEY,
        'Content-Type' : 'application/json',
      },
      muteHttpExceptions: true,
    }
  );
  if (res.getResponseCode() !== 200) {
    throw new Error('GET ' + path + ' → ' + res.getResponseCode() + ': ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function sbUpsert(table, rows, onConflict) {
  if (!rows || !rows.length) return 0;
  var url = encodeURI(CONFIG.SUPABASE_URL + '/rest/v1/' + table + '?on_conflict=' + onConflict);
  var res = UrlFetchApp.fetch(
    url,
    {
      method : 'post',
      headers: {
        apikey         : CONFIG.SERVICE_ROLE_KEY,
        Authorization  : 'Bearer ' + CONFIG.SERVICE_ROLE_KEY,
        'Content-Type' : 'application/json',
        Prefer         : 'resolution=merge-duplicates,return=minimal',
      },
      payload            : JSON.stringify(rows),
      muteHttpExceptions : true,
    }
  );
  var code = res.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('Upsert ' + table + ' → ' + code + ': ' + res.getContentText());
  }
  return rows.length;
}

// ─────────────────────────────────────────────────────────────
// SHEET HELPERS
// ─────────────────────────────────────────────────────────────
function val(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return v;
}

function getOrCreateTab(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function writeTab(name, headers, rows) {
  var sheet = getOrCreateTab(name);
  sheet.clearContents();
  sheet.clearFormats();

  // Header row
  var hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setValues([headers]);
  hRange.setBackground('#0f172a');
  hRange.setFontColor('#e2e8f0');
  hRange.setFontWeight('bold');
  hRange.setFontFamily('Arial');
  hRange.setFontSize(10);
  sheet.setFrozenRows(1);

  // Data rows
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.autoResizeColumns(1, headers.length);
}

function readTab(name, colCount) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, colCount).getValues()
    .filter(function(row) { return String(row[0]).trim() !== ''; });
}

// ─────────────────────────────────────────────────────────────
// SETUP TABS
// ─────────────────────────────────────────────────────────────
function setupTabs() {
  var TABS = getTabDefinitions();
  TABS.forEach(function(t) { writeTab(t.name, t.headers, []); });
  SpreadsheetApp.getUi().alert('✅ 7 tabs created!\nNow run "Sync from DB → Sheet" to populate data.');
}

// ─────────────────────────────────────────────────────────────
// TAB DEFINITIONS  (7 Tabs)
// ─────────────────────────────────────────────────────────────
function getTabDefinitions() {
  return [
    {
      name    : 'Students',
      headers : [
        'Register No', 'Roll No', 'Name', 'Gender', 'Department', 'Section',
        '10th Score', '12th Score', 'Diploma Score', 'CGPA',
        'History of Arrears', 'Current Backlogs',
        'College Email', 'Personal Email', 'Phone', 'Resume URL',
        'Placement Status', 'Domain',
      ],
    },
    {
      name    : 'Companies',
      headers : ['ID', 'Name', 'Website', 'Industry', 'HR Name', 'HR Email', 'HR Phone', 'Status'],
    },
    {
      name    : 'Job Drives',
      headers : [
        'ID', 'Company', 'Title', 'Role Title', 'Drive Type', 'Package CTC',
        'Location', 'Status', 'App Start', 'App End', 'Drive Start', 'Drive End',
      ],
    },
    {
      name    : 'Applications',
      headers : [
        'ID', 'Register No', 'Student Name', 'Drive Title', 'Company',
        'Status', 'Current Stage', 'Outcome', 'Package CTC', 'Applied At',
      ],
    },
    {
      name    : 'Offers',
      headers : [
        'ID', 'Register No', 'Student Name', 'Company', 'Role Title',
        'Package CTC', 'Offer Status', 'Acceptance Status', 'Joining Date',
      ],
    },
    {
      name    : 'Notices',
      headers : ['ID', 'Title', 'Body', 'Audience', 'Priority', 'Status', 'Pinned'],
    },
    {
      name    : 'Events',
      headers : ['ID', 'Title', 'Description', 'Event Date', 'Start Time', 'End Time', 'Audience', 'Status'],
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// SYNC FROM DB → SHEET
// ─────────────────────────────────────────────────────────────
function syncFromDB() {
  try {
    Logger.log('[Placely] Syncing DB → Sheet...');
    var counts = [];
    counts.push('Students: '     + _syncStudents());
    counts.push('Companies: '    + _syncCompanies());
    counts.push('Job Drives: '   + _syncDrives());
    counts.push('Applications: ' + _syncApplications());
    counts.push('Offers: '       + _syncOffers());
    counts.push('Notices: '      + _syncNotices());
    counts.push('Events: '       + _syncEvents());
    var msg = '✅ Sync complete!\n\n' + counts.join('\n') + ' rows';
    Logger.log('[Placely] ' + msg);
    SpreadsheetApp.getUi().alert(msg);
  } catch(e) {
    Logger.log('[Placely] ❌ ' + e.message);
    SpreadsheetApp.getUi().alert('❌ Sync failed:\n' + e.message);
  }
}

function _syncStudents() {
  var data = sbGet(
    'students?select=register_number,roll_number,name,gender,department,section,' +
    'tenth_score,twelfth_score,diploma_score,cgpa,history_of_backlogs,active_arrears,' +
    'college_email,personal_email,phone,placement_status,' +
    'student_profiles(resume_url,preferred_roles)' +
    '&order=register_number.asc'
  );
  var headers = getTabDefinitions()[0].headers;
  var rows = data.map(function(s) {
    var pr = (s.student_profiles && s.student_profiles[0]) || {};
    var roles = (pr.preferred_roles && pr.preferred_roles.length) ? pr.preferred_roles.join(', ') : '';
    return [
      val(s.register_number), val(s.roll_number), val(s.name), val(s.gender),
      val(s.department), val(s.section),
      val(s.tenth_score), val(s.twelfth_score), val(s.diploma_score), val(s.cgpa),
      val(s.history_of_backlogs), val(s.active_arrears),
      val(s.college_email), val(s.personal_email), val(s.phone),
      val(pr.resume_url),
      val(s.placement_status),
      val(roles),
    ];
  });
  writeTab('Students', headers, rows);
  return rows.length;
}

function _syncCompanies() {
  var data = sbGet('companies?select=id,name,website,industry,hr_name,hr_email,hr_phone,status&order=name.asc');
  var rows = data.map(function(c) {
    return [val(c.id), val(c.name), val(c.website), val(c.industry),
            val(c.hr_name), val(c.hr_email), val(c.hr_phone), val(c.status)];
  });
  writeTab('Companies', getTabDefinitions()[1].headers, rows);
  return rows.length;
}

function _syncDrives() {
  var data = sbGet(
    'job_drives?select=id,title,role_title,drive_type,package_ctc,location,status,' +
    'application_start,application_end,drive_start,drive_end,companies(name)&order=created_at.desc'
  );
  var rows = data.map(function(d) {
    return [
      val(d.id), val(d.companies && d.companies.name),
      val(d.title), val(d.role_title), val(d.drive_type), val(d.package_ctc),
      val(d.location), val(d.status),
      val(d.application_start), val(d.application_end),
      val(d.drive_start), val(d.drive_end),
    ];
  });
  writeTab('Job Drives', getTabDefinitions()[2].headers, rows);
  return rows.length;
}

function _syncApplications() {
  var data = sbGet(
    'applications?select=id,status,current_stage,outcome,package_ctc,applied_at,' +
    'students(register_number,name),job_drives(title,companies(name))&order=applied_at.desc'
  );
  var rows = data.map(function(a) {
    return [
      val(a.id),
      val(a.students && a.students.register_number),
      val(a.students && a.students.name),
      val(a.job_drives && a.job_drives.title),
      val(a.job_drives && a.job_drives.companies && a.job_drives.companies.name),
      val(a.status), val(a.current_stage), val(a.outcome),
      val(a.package_ctc), val(a.applied_at),
    ];
  });
  writeTab('Applications', getTabDefinitions()[3].headers, rows);
  return rows.length;
}

function _syncOffers() {
  var data = sbGet(
    'offers?select=id,role_title,package_ctc,offer_status,acceptance_status,joining_date,' +
    'students(register_number,name),companies(name)&order=created_at.desc'
  );
  var rows = data.map(function(o) {
    return [
      val(o.id),
      val(o.students && o.students.register_number),
      val(o.students && o.students.name),
      val(o.companies && o.companies.name),
      val(o.role_title), val(o.package_ctc),
      val(o.offer_status), val(o.acceptance_status), val(o.joining_date),
    ];
  });
  writeTab('Offers', getTabDefinitions()[4].headers, rows);
  return rows.length;
}

function _syncNotices() {
  var data = sbGet('notices?select=id,title,body,audience,priority,status,pinned&order=created_at.desc');
  var rows = data.map(function(n) {
    return [val(n.id), val(n.title), val(n.body), val(n.audience),
            val(n.priority), val(n.status), val(n.pinned)];
  });
  writeTab('Notices', getTabDefinitions()[5].headers, rows);
  return rows.length;
}

function _syncEvents() {
  var data = sbGet('events?select=id,title,description,event_date,start_time,end_time,audience,status&order=event_date.desc');
  var rows = data.map(function(e) {
    return [val(e.id), val(e.title), val(e.description), val(e.event_date),
            val(e.start_time), val(e.end_time), val(e.audience), val(e.status)];
  });
  writeTab('Events', getTabDefinitions()[6].headers, rows);
  return rows.length;
}

// ─────────────────────────────────────────────────────────────
// PUSH SHEET → DB
// ─────────────────────────────────────────────────────────────
function pushToDB() {
  try {
    Logger.log('[Placely] Pushing Sheet → DB...');
    var counts = [];
    counts.push('Students: '     + _pushStudents());
    counts.push('Companies: '    + _pushCompanies());
    counts.push('Job Drives: '   + _pushDrives());
    counts.push('Applications: ' + _pushApplications());
    counts.push('Offers: '       + _pushOffers());
    counts.push('Notices: '      + _pushNotices());
    counts.push('Events: '       + _pushEvents());
    var msg = '✅ Push complete!\n\n' + counts.join('\n') + ' rows';
    Logger.log('[Placely] ' + msg);
    SpreadsheetApp.getUi().alert(msg);
  } catch(e) {
    Logger.log('[Placely] ❌ ' + e.message);
    SpreadsheetApp.getUi().alert('❌ Push failed:\n' + e.message);
  }
}

function _pushStudents() {
  // Cols (18): 0=RegNo 1=RollNo 2=Name 3=Gender 4=Dept 5=Section
  //            6=10th 7=12th 8=Diploma 9=CGPA 10=HistoryArrears 11=CurrentBacklogs
  //            12=CollegeEmail 13=PersonalEmail 14=Phone 15=Resume 16=PlacementStatus 17=Domain
  var rows = readTab('Students', 18);
  if (!rows.length) return 0;

  // 1. Push directly to students table
  var studentRows = rows.map(function(r) {
    return {
      register_number:     String(r[0]).trim(),
      roll_number:         String(r[1]).trim() || null,
      name:                String(r[2]).trim() || null,
      gender:              String(r[3]).trim() || null,
      department:          String(r[4]).trim() || 'AI&DS',
      section:             String(r[5]).trim() || null,
      tenth_score:         (r[6] !== '' && !isNaN(r[6]))  ? parseFloat(r[6])  : null,
      twelfth_score:       (r[7] !== '' && !isNaN(r[7]))  ? parseFloat(r[7])  : null,
      diploma_score:       (r[8] !== '' && !isNaN(r[8]))  ? parseFloat(r[8])  : null,
      cgpa:                (r[9] !== '' && !isNaN(r[9]))  ? parseFloat(r[9])  : null,
      history_of_backlogs: (r[10] === 'TRUE' || r[10] === true || String(r[10]).toLowerCase() === 'true'),
      active_arrears:      (r[11] !== '' && !isNaN(r[11])) ? parseInt(r[11])   : 0,
      college_email:       String(r[12]).trim() || null,
      personal_email:      String(r[13]).trim() || null,
      phone:               String(r[14]).trim() || null,
      year:                2027,
      placement_status:    String(r[16]).trim() || 'unplaced',
    };
  });
  sbUpsert('students', studentRows, 'register_number');

  // Fetch student IDs for profile/preference updates
  var students = sbGet('students?select=id,register_number');
  var idMap = {};
  students.forEach(function(s) { idMap[String(s.register_number).toLowerCase().trim()] = s.id; });

  // 2. Push student_profiles
  var profileRows = rows.map(function(r) {
    var sid = idMap[String(r[0]).trim().toLowerCase()];
    var domain = String(r[17]).trim();
    if (!sid) return null;
    return {
      student_id:      sid,
      resume_url:      String(r[15]).trim() || null,
      preferred_roles: domain ? [domain] : null,
    };
  }).filter(Boolean);
  if (profileRows.length) sbUpsert('student_profiles', profileRows, 'student_id');

  return rows.length;
}

function _pushCompanies() {
  // Cols: 0=ID 1=Name 2=Website 3=Industry 4=HRName 5=HREmail 6=HRPhone 7=Status
  var rows = readTab('Companies', 8);
  if (!rows.length) return 0;
  var upsertRows = rows
    .filter(function(r) { return String(r[1]).trim() !== ''; })
    .map(function(r) {
      var idVal = String(r[0]).trim();
      return {
        id:         idVal ? idVal : Utilities.getUuid(),
        name:       String(r[1]).trim(),
        website:    String(r[2]).trim() || null,
        industry:   String(r[3]).trim() || null,
        hr_name:    String(r[4]).trim() || null,
        hr_email:   String(r[5]).trim() || null,
        hr_phone:   String(r[6]).trim() || null,
        status:     String(r[7]).trim() || 'active',
      };
    });
  return sbUpsert('companies', upsertRows, 'id');
}

function _pushDrives() {
  // Cols: 0=ID 1=Company(display) 2=Title 3=RoleTitle 4=DriveType 5=Package 6=Location
  //       7=Status 8=AppStart 9=AppEnd 10=DriveStart 11=DriveEnd
  var rows = readTab('Job Drives', 12);
  if (!rows.length) return 0;

  var comps = sbGet('companies?select=id,name');
  var compIdMap = {};
  comps.forEach(function(c) {
    if (c.name) compIdMap[c.name.toLowerCase().trim()] = c.id;
  });

  var driveIds = rows.map(function(r) { return String(r[0]).trim(); }).filter(Boolean);
  var dbDrivesMap = {};
  if (driveIds.length) {
    var dbDrives = sbGet('job_drives?select=id,company_id');
    dbDrives.forEach(function(d) { dbDrivesMap[d.id] = d; });
  }

  var upsertRows = rows
    .filter(function(r) { return String(r[2]).trim() !== ''; })
    .map(function(r) {
      var idVal = String(r[0]).trim();
      var dbDrive = dbDrivesMap[idVal] || {};
      var cname = String(r[1]).trim().toLowerCase();
      var cid = dbDrive.company_id || compIdMap[cname];

      if (!cid) return null;

      var rawPkg = String(r[5]).replace(/[^0-9.]/g, '');
      return {
        id:                idVal ? idVal : Utilities.getUuid(),
        company_id:        cid,
        title:             String(r[2]).trim(),
        role_title:        String(r[3]).trim() || String(r[2]).trim(),
        drive_type:        String(r[4]).trim() || 'on_campus',
        package_ctc:       rawPkg ? parseFloat(rawPkg) : 0,
        location:          String(r[6]).trim() || null,
        status:            String(r[7]).trim() || 'draft',
        application_start: _formatDate(r[8]),
        application_end:   _formatDate(r[9]),
        drive_start:        _formatDate(r[10]),
        drive_end:          _formatDate(r[11]),
      };
    })
    .filter(Boolean);

  return sbUpsert('job_drives', upsertRows, 'id');
}

function _pushApplications() {
  // Cols: 0=ID 1=RegNo 2=StudentName 3=DriveTitle 4=Company 5=Status 6=CurrentStage 7=Outcome 8=PackageCTC 9=AppliedAt
  var rows = readTab('Applications', 10);
  if (!rows.length) return 0;

  var dbApps = sbGet('applications?select=id,student_id,drive_id');
  var dbAppsMap = {};
  dbApps.forEach(function(a) { dbAppsMap[a.id] = a; });

  var students = sbGet('students?select=id,register_number');
  var studentMap = {};
  students.forEach(function(s) { studentMap[String(s.register_number).toLowerCase().trim()] = s.id; });

  var upsertRows = rows
    .map(function(r) {
      var idVal = String(r[0]).trim();
      var dbApp = dbAppsMap[idVal] || {};
      var regNo = String(r[1]).trim().toLowerCase();
      var sid = dbApp.student_id || studentMap[regNo];
      var did = dbApp.drive_id;

      if (!sid || (!idVal && !did)) return null;

      var rawPkg = String(r[8]).replace(/[^0-9.]/g, '');
      return {
        id:            idVal ? idVal : Utilities.getUuid(),
        student_id:    sid,
        drive_id:      did,
        status:        String(r[5]).trim() || 'applied',
        current_stage: String(r[6]).trim() || null,
        outcome:       String(r[7]).trim() || null,
        package_ctc:   rawPkg ? parseFloat(rawPkg) : null,
      };
    })
    .filter(function(r) { return r && r.student_id && r.drive_id; });

  return sbUpsert('applications', upsertRows, 'id');
}

function _pushOffers() {
  // Cols: 0=ID 1=RegNo 2=Name 3=Company 4=RoleTitle 5=Package 6=OfferStatus 7=AcceptanceStatus 8=JoiningDate
  var rows = readTab('Offers', 9);
  if (!rows.length) return 0;

  var dbOffers = sbGet('offers?select=id,student_id,company_id');
  var dbOffersMap = {};
  dbOffers.forEach(function(o) { dbOffersMap[o.id] = o; });

  var students = sbGet('students?select=id,register_number');
  var studentMap = {};
  students.forEach(function(s) { studentMap[String(s.register_number).toLowerCase().trim()] = s.id; });

  var comps = sbGet('companies?select=id,name');
  var companyMap = {};
  comps.forEach(function(c) {
    if (c.name) companyMap[c.name.toLowerCase().trim()] = c.id;
  });

  var upsertRows = rows
    .map(function(r) {
      var idVal = String(r[0]).trim();
      var dbOffer = dbOffersMap[idVal] || {};
      var regNo = String(r[1]).trim().toLowerCase();
      var compName = String(r[3]).trim().toLowerCase();
      var sid = dbOffer.student_id || studentMap[regNo];
      var cid = dbOffer.company_id || companyMap[compName];

      if (!sid || !cid) return null;

      var rawPkg = String(r[5]).replace(/[^0-9.]/g, '');
      return {
        id:                idVal ? idVal : Utilities.getUuid(),
        student_id:         sid,
        company_id:         cid,
        role_title:         String(r[4]).trim() || 'Software Engineer',
        package_ctc:        rawPkg ? parseFloat(rawPkg) : 0,
        offer_status:       String(r[6]).trim() || 'issued',
        acceptance_status:  String(r[7]).trim() || 'pending',
        joining_date:       _formatDate(r[8]),
      };
    })
    .filter(Boolean);

  return sbUpsert('offers', upsertRows, 'id');
}

function _pushNotices() {
  // Cols: 0=ID 1=Title 2=Body 3=Audience 4=Priority 5=Status 6=Pinned
  var rows = readTab('Notices', 7);
  if (!rows.length) return 0;
  var upsertRows = rows
    .filter(function(r) { return String(r[1]).trim(); })
    .map(function(r) {
      var idVal = String(r[0]).trim();
      return {
        id:       idVal ? idVal : Utilities.getUuid(),
        title:    String(r[1]).trim(),
        body:     String(r[2]).trim() || '',
        audience: String(r[3]).trim() || null,
        priority: String(r[4]).trim() || 'normal',
        status:   String(r[5]).trim() || 'draft',
        pinned:   (r[6] === 'TRUE' || r[6] === true || String(r[6]).toLowerCase() === 'true'),
      };
    });
  return sbUpsert('notices', upsertRows, 'id');
}

function _pushEvents() {
  // Cols: 0=ID 1=Title 2=Description 3=EventDate 4=StartTime 5=EndTime 6=Audience 7=Status
  var rows = readTab('Events', 8);
  if (!rows.length) return 0;
  var upsertRows = rows
    .filter(function(r) { return String(r[1]).trim(); })
    .map(function(r) {
      var idVal = String(r[0]).trim();
      return {
        id:          idVal ? idVal : Utilities.getUuid(),
        title:       String(r[1]).trim(),
        description: String(r[2]).trim() || null,
        event_date:  _formatDate(r[3]) || Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd'),
        start_time:  String(r[4]).trim() || null,
        end_time:    String(r[5]).trim() || null,
        audience:    String(r[6]).trim() || null,
        status:      String(r[7]).trim() || 'scheduled',
      };
    });
  return sbUpsert('events', upsertRows, 'id');
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function _formatDate(v) {
  if (!v || v === '') return null;
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd');
  }
  return String(v).trim() || null;
}
