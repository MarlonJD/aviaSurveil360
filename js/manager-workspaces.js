/* ==========================================================================
   AviaSurveil360 — Department Manager workspace state helpers (DEMO ONLY)
   ========================================================================== */

function ensureManagerWorkspaceState(target) {
  var s = target || state;
  if (!Array.isArray(s.users)) s.users = deepClone(SEED_USERS);
  if (!Array.isArray(s.inspectionTeams)) s.inspectionTeams = deepClone(SEED_INSPECTION_TEAMS);
  if (!Array.isArray(s.managerReports)) s.managerReports = deepClone(SEED_MANAGER_REPORTS);
  s.inspectionTeams.forEach(function (team) {
    if (!Array.isArray(team.memberIds)) team.memberIds = [];
    if (!Array.isArray(team.attachments)) team.attachments = [];
    if (!Array.isArray(team.messages)) team.messages = [];
    if (!Array.isArray(team.history)) team.history = [];
    if (typeof team.notes !== 'string') team.notes = '';
  });
  return s;
}

function managerFindingsForAudit(target, auditId) {
  var s = ensureManagerWorkspaceState(target);
  return s.findings.filter(function (finding) { return finding.auditId === auditId; });
}

function managerFindingCounts(findings) {
  return (findings || []).reduce(function (counts, finding) {
    counts.total += 1;
    if (finding.severity === 1) counts.critical += 1;
    else if (finding.severity === 2) counts.major += 1;
    else if (finding.severity === 3) counts.minor += 1;
    else counts.observations += 1;
    if (finding.status === 'CLOSED') counts.closed += 1;
    else if (finding.status === 'CAP_SUBMITTED' || finding.status === 'EVIDENCE_SUBMITTED') counts.inReview += 1;
    else counts.open += 1;
    return counts;
  }, { total: 0, critical: 0, major: 0, minor: 0, observations: 0, open: 0, inReview: 0, closed: 0 });
}

function managerAuditPhase(status) {
  if (status === 'Closed') return 'Closed';
  if (status === 'Report Issued') return 'Reporting';
  if (status === 'In Progress') return 'Inspection';
  return 'Planning';
}

function managerInspectionRows(target, filters) {
  var s = target || state;
  var audits = Array.isArray(s.audits) ? s.audits : [];
  var findings = Array.isArray(s.findings) ? s.findings : [];
  var orgs = Array.isArray(s.orgs) ? s.orgs : [];
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var status = opts.status || 'all';
  var dateRange = opts.dateRange || 'all';

  function organizationName(orgId) {
    var organization = orgs.filter(function (org) { return org.id === orgId; })[0];
    return organization ? organization.name : '—';
  }

  function matchesStatus(audit) {
    if (status === 'all') return true;
    if (status === 'active') return audit.status === 'Scheduled' || audit.status === 'In Progress';
    if (status === 'complete') return audit.status === 'Closed' || audit.status === 'Report Issued';
    if (status === 'planned') return audit.status === 'Planned';
    return String(audit.status || '').toLowerCase().replace(/\s+/g, '-') === status;
  }

  function matchesDate(audit) {
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return audit.date === DEMO_TODAY;
    if (dateRange === 'upcoming') return !!audit.date && audit.date >= DEMO_TODAY;
    if (dateRange === 'past-30') return !!audit.date && audit.date <= DEMO_TODAY && daysBetween(audit.date, DEMO_TODAY) <= 30;
    if (dateRange === 'past-90') return !!audit.date && audit.date <= DEMO_TODAY && daysBetween(audit.date, DEMO_TODAY) <= 90;
    return true;
  }

  return audits.map(function (audit) {
    var auditFindings = findings.filter(function (finding) { return finding.auditId === audit.id; });
    var organization = organizationName(audit.orgId);
    return {
      auditId: audit.id,
      organizationId: audit.orgId,
      organization: organization,
      auditDate: audit.date,
      teamLeader: audit.lead || '—',
      team: Array.isArray(audit.team) ? audit.team.slice() : [],
      department: audit.domain || '—',
      type: audit.type || audit.ref || 'Audit / Inspection',
      reference: audit.ref || audit.id,
      phase: managerAuditPhase(audit.status),
      status: audit.status || '—',
      findings: auditFindings.slice(),
      counts: managerFindingCounts(auditFindings)
    };
  }).filter(function (row) {
    if (!row.counts.total) return false;
    var haystack = [
      row.auditId, row.organization, row.reference, row.type, row.department,
      row.teamLeader, row.status, row.phase
    ].join(' ').toLowerCase();
    return (!query || haystack.indexOf(query) !== -1) && matchesStatus({ status: row.status }) && matchesDate({ date: row.auditDate });
  }).sort(function (left, right) {
    return (right.auditDate || '').localeCompare(left.auditDate || '') || left.auditId.localeCompare(right.auditId);
  });
}

function managerReportById(target, reportId) {
  var s = ensureManagerWorkspaceState(target);
  return s.managerReports.filter(function (report) { return report.id === reportId; })[0] || null;
}

function managerTeamByAuditId(target, auditId) {
  var s = ensureManagerWorkspaceState(target);
  return s.inspectionTeams.filter(function (team) { return team.auditId === auditId; })[0] || null;
}

function managerScopedTeamUsers(target) {
  var s = ensureManagerWorkspaceState(target);
  return s.users.filter(function (user) { return user.reportsToRole === 'manager'; });
}

function managerTeamRows(target, filters) {
  var s = ensureManagerWorkspaceState(target);
  var opts = filters || {};
  var query = String(opts.query || '').trim().toLowerCase();
  var department = opts.department || 'all';
  var status = opts.status || 'all';
  var dateRange = opts.dateRange || 'all';
  var scopedUsers = managerScopedTeamUsers(s);
  var scopedById = {};
  scopedUsers.forEach(function (user) { scopedById[user.id] = user; });

  function findAudit(auditId) {
    return (s.audits || []).filter(function (audit) { return audit.id === auditId; })[0] || null;
  }

  function findOrganization(orgId) {
    return (s.orgs || []).filter(function (organization) { return organization.id === orgId; })[0] || null;
  }

  function normalized(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '-');
  }

  function matchesStatus(row) {
    if (status === 'all') return true;
    if (status === 'active') return row.status === 'In Progress';
    if (status === 'upcoming') return row.status === 'Scheduled' || row.status === 'Planned';
    if (status === 'completed') return row.status === 'Completed' || row.status === 'Closed' || row.status === 'Report Issued';
    return normalized(row.status) === normalized(status);
  }

  function matchesDate(row) {
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return row.startDate <= DEMO_TODAY && row.endDate >= DEMO_TODAY;
    if (dateRange === 'upcoming') return row.startDate > DEMO_TODAY;
    if (dateRange === 'past') return row.endDate < DEMO_TODAY;
    return true;
  }

  return s.inspectionTeams.map(function (team) {
    var audit = findAudit(team.auditId);
    var organization = audit ? findOrganization(audit.orgId) : null;
    var members = (team.memberIds || []).map(function (userId) { return scopedById[userId] || null; }).filter(Boolean);
    var lead = scopedById[team.leadUserId] || null;
    return {
      id: team.id,
      auditId: team.auditId,
      audit: audit,
      team: team,
      organizationId: audit ? audit.orgId : '',
      organization: organization ? organization.name : '—',
      reference: audit ? (audit.ref || audit.type || audit.id) : team.auditId,
      auditType: audit ? (audit.type || audit.ref || 'Audit / Inspection') : 'Audit / Inspection',
      department: team.department || (audit && audit.domain) || '—',
      status: team.status || (audit && audit.status) || '—',
      startDate: team.startDate || (audit && audit.date) || '',
      endDate: team.endDate || team.startDate || (audit && audit.date) || '',
      lead: lead,
      members: members,
      memberCount: members.length,
      notes: team.notes || '',
      attachments: Array.isArray(team.attachments) ? team.attachments.slice() : [],
      messages: Array.isArray(team.messages) ? team.messages.slice() : [],
      history: Array.isArray(team.history) ? team.history.slice() : []
    };
  }).filter(function (row) {
    if (!row.members.length || !row.lead) return false;
    if (department !== 'all' && row.department !== department) return false;
    if (!matchesStatus(row) || !matchesDate(row)) return false;
    var haystack = [
      row.auditId, row.organization, row.reference, row.auditType, row.department,
      row.status, row.lead.name, row.startDate, row.endDate
    ].concat(row.members.map(function (member) { return member.name; })).join(' ').toLowerCase();
    return !query || haystack.indexOf(query) !== -1;
  }).sort(function (left, right) {
    return (left.startDate || '').localeCompare(right.startDate || '') || left.auditId.localeCompare(right.auditId);
  });
}

function teamMutationResult(ok, message, team) {
  return { ok: ok, message: message, team: team || null };
}

function managerTeamMutationTimestamp() {
  if (typeof logTimestamp === 'function') return logTimestamp();
  return (typeof DEMO_TODAY === 'string' ? DEMO_TODAY : '2026-06-15') + ' 00:00';
}

function managerTeamActor() {
  return typeof ROLES !== 'undefined' && ROLES.manager ? ROLES.manager.user : 'Department Manager';
}

function managerTeamAppendHistory(team, action) {
  if (!Array.isArray(team.history)) team.history = [];
  team.history.push({ at: managerTeamMutationTimestamp(), actor: managerTeamActor(), action: action });
}

function syncManagerTeamAudit(target, team) {
  var audit = (target.audits || []).filter(function (candidate) { return candidate.id === team.auditId; })[0] || null;
  if (!audit) return;
  var users = target.users || [];
  var members = team.memberIds.map(function (userId) {
    return users.filter(function (user) { return user.id === userId; })[0] || null;
  }).filter(Boolean);
  var lead = users.filter(function (user) { return user.id === team.leadUserId; })[0] || null;
  audit.team = members.map(function (member) { return member.name; });
  if (lead) audit.lead = lead.name;
}

function addManagerTeamMember(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  if (!user || user.reportsToRole !== 'manager') {
    return teamMutationResult(false, 'Only inspectors in this Department Manager reporting line can be added.', team);
  }
  if (!Array.isArray(team.memberIds)) team.memberIds = [];
  if (team.memberIds.indexOf(userId) !== -1) {
    return teamMutationResult(false, user.name + ' is already a member of this inspection team.', team);
  }
  team.memberIds.push(userId);
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Inspector added: ' + user.name);
  return teamMutationResult(true, user.name + ' was added to the inspection team.', team);
}

function removeManagerTeamMember(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  if (team.leadUserId === userId) {
    return teamMutationResult(false, 'Choose another Lead Inspector before removing the current lead.', team);
  }
  if (!Array.isArray(team.memberIds) || team.memberIds.indexOf(userId) === -1) {
    return teamMutationResult(false, 'That inspector is not a member of this inspection team.', team);
  }
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  team.memberIds = team.memberIds.filter(function (memberId) { return memberId !== userId; });
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Inspector removed: ' + (user ? user.name : userId));
  return teamMutationResult(true, (user ? user.name : 'Inspector') + ' was removed from the inspection team.', team);
}

function changeManagerTeamLead(target, auditId, userId) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var user = s.users.filter(function (candidate) { return candidate.id === userId; })[0] || null;
  if (!user || user.reportsToRole !== 'manager' || !Array.isArray(team.memberIds) || team.memberIds.indexOf(userId) === -1) {
    return teamMutationResult(false, 'The new Lead Inspector must already be a member of this inspection team.', team);
  }
  if (team.leadUserId === userId) {
    return teamMutationResult(false, user.name + ' is already the Lead Inspector.', team);
  }
  team.leadUserId = userId;
  syncManagerTeamAudit(s, team);
  managerTeamAppendHistory(team, 'Lead Inspector changed to ' + user.name);
  return teamMutationResult(true, user.name + ' is now the Lead Inspector.', team);
}

function updateManagerTeamSchedule(target, auditId, startDate, endDate) {
  var s = ensureManagerWorkspaceState(target);
  var team = managerTeamByAuditId(s, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  if (!startDate || !endDate) return teamMutationResult(false, 'Start date and end date are required.', team);
  if (endDate < startDate) return teamMutationResult(false, 'End date cannot be before the start date.', team);
  if (team.startDate === startDate && team.endDate === endDate) {
    return teamMutationResult(false, 'The inspection team already uses this schedule.', team);
  }
  team.startDate = startDate;
  team.endDate = endDate;
  var audit = (s.audits || []).filter(function (candidate) { return candidate.id === auditId; })[0] || null;
  if (audit) audit.date = startDate;
  managerTeamAppendHistory(team, 'Schedule updated: ' + startDate + ' to ' + endDate);
  return teamMutationResult(true, 'Inspection team schedule updated.', team);
}

function recordManagerTeamMessage(target, auditId, body) {
  var team = managerTeamByAuditId(target, auditId);
  if (!team) return teamMutationResult(false, 'Inspection team not found.', null);
  var clean = String(body || '').trim();
  if (!clean) return teamMutationResult(false, 'Message body is required.', team);
  if (!Array.isArray(team.messages)) team.messages = [];
  var at = managerTeamMutationTimestamp();
  team.messages.push({
    id: 'TEAM-MSG-' + (team.messages.length + 1),
    at: at,
    author: managerTeamActor(),
    body: clean
  });
  managerTeamAppendHistory(team, 'Message sent to inspection team: ' + clean);
  return teamMutationResult(true, 'Message recorded in the inspection team workspace.', team);
}

function pdfSafeText(text) {
  return String(text || '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pdfEscape(text) {
  return pdfSafeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function pdfWrap(text, maxChars) {
  var clean = pdfSafeText(text);
  if (!clean) return [''];
  return clean.split(' ').reduce(function (lines, word) {
    var current = lines[lines.length - 1] || '';
    var candidate = current ? current + ' ' + word : word;
    if (candidate.length > maxChars && current) lines.push(word);
    else lines[lines.length - 1] = candidate;
    return lines;
  }, ['']);
}

function buildAviaPdfDocument(lines) {
  var printable = [];
  (lines && lines.length ? lines : ['AviaSurveil360 Demo Report']).forEach(function (line) {
    pdfWrap(line, 96).forEach(function (wrapped) { printable.push(wrapped); });
  });
  var pages = [];
  while (printable.length) pages.push(printable.splice(0, 43));
  var objects = ['<< /Type /Catalog /Pages 2 0 R >>', ''];
  var fontObject = objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  var pageReferences = [];
  pages.forEach(function (pageLines, pageIndex) {
    var y = 792;
    var content = pageLines.map(function (line, lineIndex) {
      if (!line) { y -= 8; return ''; }
      var size = pageIndex === 0 && lineIndex === 0 ? 18 : 10;
      var command = 'BT /F1 ' + size + ' Tf 54 ' + y + ' Td (' + pdfEscape(line) + ') Tj ET\n';
      y -= pageIndex === 0 && lineIndex === 0 ? 24 : 14;
      return command;
    }).join('');
    var contentObject = objects.push('<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream');
    var pageObject = objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ' + fontObject + ' 0 R >> >> /Contents ' + contentObject + ' 0 R >>');
    pageReferences.push(pageObject + ' 0 R');
  });
  objects[1] = '<< /Type /Pages /Kids [' + pageReferences.join(' ') + '] /Count ' + pageReferences.length + ' >>';
  var pdf = '%PDF-1.4\n';
  var offsets = [0];
  objects.forEach(function (body, index) {
    offsets[index + 1] = pdf.length;
    pdf += (index + 1) + ' 0 obj\n' + body + '\nendobj\n';
  });
  var xref = pdf.length;
  pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
  for (var i = 1; i <= objects.length; i += 1) pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  return pdf + 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
}

function downloadAviaPdf(filename, lines, env) {
  var runtime = env || { Blob: Blob, URL: URL, document: document };
  var pdf = buildAviaPdfDocument(lines);
  var blob = new runtime.Blob([pdf], { type: 'application/pdf' });
  var url = runtime.URL.createObjectURL(blob);
  var link = runtime.document.createElement('a');
  link.href = url;
  link.download = filename;
  runtime.document.body.appendChild(link);
  link.click();
  runtime.document.body.removeChild(link);
  runtime.URL.revokeObjectURL(url);
  return { ok: true, filename: filename, mime: 'application/pdf' };
}
