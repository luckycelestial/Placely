import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePlacementFormResponses,
  evaluateStudentEligibility,
  type FormQuestion,
  type DriveEligibilityRules,
} from '../src/server/services/workflows';

test('Workflows: Form Question Validation', () => {
  const questions: FormQuestion[] = [
    { id: 'portfolioUrl', label: 'Portfolio URL', type: 'url', required: true },
    { id: 'yoe', label: 'Years of Experience', type: 'number', required: false },
    { id: 'preferredRole', label: 'Preferred Role', type: 'select', options: ['Frontend', 'Backend', 'Fullstack'], required: true },
  ];

  // 1. Missing required fields
  const missingRes = validatePlacementFormResponses(questions, {
    portfolioUrl: '',
    yoe: 1,
  });
  assert.equal(missingRes.valid, false);
  assert.ok(missingRes.errors.portfolioUrl);
  assert.ok(missingRes.errors.preferredRole);

  // 2. Invalid URL and invalid number
  const invalidRes = validatePlacementFormResponses(questions, {
    portfolioUrl: 'not-a-valid-url',
    yoe: 'not-a-number',
    preferredRole: 'Frontend',
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.portfolioUrl);
  assert.ok(invalidRes.errors.yoe);

  // 3. Valid response
  const validRes = validatePlacementFormResponses(questions, {
    portfolioUrl: 'https://github.com/luckycelestial',
    yoe: 2,
    preferredRole: 'Fullstack',
  });
  assert.equal(validRes.valid, true);
  assert.equal(Object.keys(validRes.errors).length, 0);
});

test('Workflows: Eligibility Shortlist Evaluation Engine', () => {
  const criteria: DriveEligibilityRules = {
    minCgpa: 7.5,
    allowedDepartments: ['CSE', 'IT', 'AI&DS'],
    maxActiveArrears: 0,
    allowHistoryOfBacklogs: false,
    targetGraduationYear: 2027,
  };

  // 1. Eligible student
  const eligibleStudent = {
    cgpa: 8.4,
    department: 'CSE',
    active_arrears: 0,
    history_of_backlogs: false,
    year: 2027,
  };
  const eval1 = evaluateStudentEligibility(eligibleStudent, criteria);
  assert.equal(eval1.isEligible, true);
  assert.equal(eval1.reasons.length, 0);

  // 2. Ineligible student (low CGPA, active arrears, history of backlogs)
  const ineligibleStudent = {
    cgpa: 6.8,
    department: 'MECH',
    active_arrears: 2,
    history_of_backlogs: true,
    year: 2026,
  };
  const eval2 = evaluateStudentEligibility(ineligibleStudent, criteria);
  assert.equal(eval2.isEligible, false);
  assert.equal(eval2.reasons.length, 5); // cgpa, dept, arrears, backlogs, year all fail
});
