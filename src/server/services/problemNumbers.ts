import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';

export interface ProblemInfo {
  number: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  url: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  registerNumber: string;
  department: string;
  avatarUrl?: string;
}

export interface ProblemCompletionRecord {
  problemNumber: number;
  completedAt: string;
  students: StudentInfo[];
}

export const FAMOUS_PROBLEMS: ProblemInfo[] = [
  { number: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Hashing', url: 'https://leetcode.com/problems/two-sum/' },
  { number: 2, title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List', url: 'https://leetcode.com/problems/add-two-numbers/' },
  { number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', category: 'Sliding Window', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/' },
  { number: 5, title: 'Longest Palindromic Substring', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
  { number: 10, title: 'Regular Expression Matching', difficulty: 'Hard', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/regular-expression-matching/' },
  { number: 15, title: '3Sum', difficulty: 'Medium', category: 'Two Pointers', url: 'https://leetcode.com/problems/3sum/' },
  { number: 20, title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack', url: 'https://leetcode.com/problems/valid-parentheses/' },
  { number: 21, title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { number: 23, title: 'Merge k Sorted Lists', difficulty: 'Hard', category: 'Heap / Priority Queue', url: 'https://leetcode.com/problems/merge-k-sorted-lists/' },
  { number: 33, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', category: 'Binary Search', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' },
  { number: 42, title: 'Trapping Rain Water', difficulty: 'Hard', category: 'Two Pointers', url: 'https://leetcode.com/problems/trapping-rain-water/' },
  { number: 48, title: 'Rotate Image', difficulty: 'Medium', category: 'Matrix', url: 'https://leetcode.com/problems/rotate-image/' },
  { number: 53, title: 'Maximum Subarray', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/maximum-subarray/' },
  { number: 56, title: 'Merge Intervals', difficulty: 'Medium', category: 'Intervals', url: 'https://leetcode.com/problems/merge-intervals/' },
  { number: 70, title: 'Climbing Stairs', difficulty: 'Easy', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/climbing-stairs/' },
  { number: 75, title: 'Sort Colors', difficulty: 'Medium', category: 'Arrays', url: 'https://leetcode.com/problems/sort-colors/' },
  { number: 76, title: 'Minimum Window Substring', difficulty: 'Hard', category: 'Sliding Window', url: 'https://leetcode.com/problems/minimum-window-substring/' },
  { number: 79, title: 'Word Search', difficulty: 'Medium', category: 'Backtracking', url: 'https://leetcode.com/problems/word-search/' },
  { number: 98, title: 'Validate Binary Search Tree', difficulty: 'Medium', category: 'Trees', url: 'https://leetcode.com/problems/validate-binary-search-tree/' },
  { number: 102, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', category: 'Trees', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/' },
  { number: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', category: 'Arrays', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' },
  { number: 125, title: 'Valid Palindrome', difficulty: 'Easy', category: 'Two Pointers', url: 'https://leetcode.com/problems/valid-palindrome/' },
  { number: 139, title: 'Word Break', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/word-break/' },
  { number: 141, title: 'Linked List Cycle', difficulty: 'Easy', category: 'Linked List', url: 'https://leetcode.com/problems/linked-list-cycle/' },
  { number: 152, title: 'Maximum Product Subarray', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/maximum-product-subarray/' },
  { number: 198, title: 'House Robber', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/house-robber/' },
  { number: 200, title: 'Number of Islands', difficulty: 'Medium', category: 'Graphs', url: 'https://leetcode.com/problems/number-of-islands/' },
  { number: 206, title: 'Reverse Linked List', difficulty: 'Easy', category: 'Linked List', url: 'https://leetcode.com/problems/reverse-linked-list/' },
  { number: 217, title: 'Contains Duplicate', difficulty: 'Easy', category: 'Arrays & Hashing', url: 'https://leetcode.com/problems/contains-duplicate/' },
  { number: 226, title: 'Invert Binary Tree', difficulty: 'Easy', category: 'Trees', url: 'https://leetcode.com/problems/invert-binary-tree/' },
  { number: 238, title: 'Product of Array Except Self', difficulty: 'Medium', category: 'Arrays', url: 'https://leetcode.com/problems/product-of-array-except-self/' },
  { number: 242, title: 'Valid Anagram', difficulty: 'Easy', category: 'Arrays & Hashing', url: 'https://leetcode.com/problems/valid-anagram/' },
  { number: 295, title: 'Find Median from Data Stream', difficulty: 'Hard', category: 'Heap', url: 'https://leetcode.com/problems/find-median-from-data-stream/' },
  { number: 300, title: 'Longest Increasing Subsequence', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/longest-increasing-subsequence/' },
  { number: 322, title: 'Coin Change', difficulty: 'Medium', category: 'Dynamic Programming', url: 'https://leetcode.com/problems/coin-change/' },
  { number: 338, title: 'Counting Bits', difficulty: 'Easy', category: 'Bit Manipulation', url: 'https://leetcode.com/problems/counting-bits/' },
  { number: 347, title: 'Top K Frequent Elements', difficulty: 'Medium', category: 'Heap / Hashing', url: 'https://leetcode.com/problems/top-k-frequent-elements/' },
  { number: 417, title: 'Pacific Atlantic Water Flow', difficulty: 'Medium', category: 'Graphs', url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/' },
  { number: 435, title: 'Non-overlapping Intervals', difficulty: 'Medium', category: 'Intervals', url: 'https://leetcode.com/problems/non-overlapping-intervals/' },
  { number: 704, title: 'Binary Search', difficulty: 'Easy', category: 'Binary Search', url: 'https://leetcode.com/problems/binary-search/' }
];

export const SEEDED_STUDENTS: StudentInfo[] = [
  { id: '4eda62a2-6a49-4e28-a293-50a46cb6ee1b', name: 'PAVITHRA R', registerNumber: '722825243140', department: 'AI&DS' },
  { id: '020d149d-2fff-4d48-9e1f-e9722c8457a6', name: 'NIKITHA V', registerNumber: '722825243132', department: 'AI&DS' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Priya Sharma', registerNumber: 'REG2026CSE002', department: 'CSE' },
  { id: 'b0000000-0000-0000-0000-000000000003', name: 'Rahul Verma', registerNumber: 'REG2026ECE001', department: 'ECE' },
  { id: 'b0000000-0000-0000-0000-000000000004', name: 'Sneha Reddy', registerNumber: 'REG2026AIDS001', department: 'AI&DS' },
  { id: 'b0000000-0000-0000-0000-000000000005', name: 'Amit Kumar', registerNumber: 'REG2026MECH001', department: 'MECH' },
  { id: 'b0000000-0000-0000-0000-000000000006', name: 'Ananya Iyer', registerNumber: 'REG2026CSE003', department: 'CSE' },
  { id: 'b0000000-0000-0000-0000-000000000007', name: 'Vikram Singh', registerNumber: 'REG2026EEE001', department: 'EEE' }
];

const DEFAULT_STUDENT_SOLVED_MAP: Record<string, number[]> = {
  '4eda62a2-6a49-4e28-a293-50a46cb6ee1b': [1, 10, 20, 42, 121, 206, 338, 704],
  '020d149d-2fff-4d48-9e1f-e9722c8457a6': [1, 3, 10, 20, 53, 70, 141, 217],
  'b0000000-0000-0000-0000-000000000002': [1, 2, 5, 10, 15, 20, 21, 42, 53, 56, 70, 121, 200, 206, 300, 322, 704],
  'b0000000-0000-0000-0000-000000000003': [1, 10, 20, 33, 48, 70, 125, 206, 226, 242],
  'b0000000-0000-0000-0000-000000000004': [1, 3, 10, 15, 20, 21, 42, 76, 121, 139, 200, 206, 338],
  'b0000000-0000-0000-0000-000000000005': [1, 20, 70, 121, 206, 217, 704],
  'b0000000-0000-0000-0000-000000000006': [1, 2, 10, 15, 20, 23, 42, 53, 98, 102, 121, 200, 206, 295, 347],
  'b0000000-0000-0000-0000-000000000007': [1, 10, 20, 53, 70, 121, 152, 198, 206, 238]
};

const STORAGE_KEY = 'placely_student_solved_problems_v2';

export function getStoredSolvedMap(): Record<string, number[]> {
  if (typeof window === 'undefined') return DEFAULT_STUDENT_SOLVED_MAP;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STUDENT_SOLVED_MAP));
      return DEFAULT_STUDENT_SOLVED_MAP;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_STUDENT_SOLVED_MAP;
  }
}

export function saveStoredSolvedMap(map: Record<string, number[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to save solved problems map to localStorage', e);
  }
}

export function getProblemDetails(num: number): ProblemInfo {
  const found = FAMOUS_PROBLEMS.find((p) => p.number === num);
  if (found) return found;
  return {
    number: num,
    title: `Problem #${num}`,
    difficulty: num % 3 === 0 ? 'Hard' : num % 2 === 0 ? 'Medium' : 'Easy',
    category: 'General Practice',
    url: `https://leetcode.com/problemset/all/?search=${num}`
  };
}

export function getStudentSolvedProblemNumbers(studentId: string): number[] {
  const map = getStoredSolvedMap();
  return map[studentId] || DEFAULT_STUDENT_SOLVED_MAP[studentId] || [1, 10, 20, 121, 206];
}

export function addStudentSolvedProblemNumbers(studentId: string, newNumbers: number[]): number[] {
  const map = getStoredSolvedMap();
  const existing = map[studentId] || DEFAULT_STUDENT_SOLVED_MAP[studentId] || [];
  const combined = Array.from(new Set([...existing, ...newNumbers])).sort((a, b) => a - b);
  map[studentId] = combined;
  saveStoredSolvedMap(map);
  return combined;
}

export function removeStudentSolvedProblemNumber(studentId: string, targetNumber: number): number[] {
  const map = getStoredSolvedMap();
  const existing = map[studentId] || DEFAULT_STUDENT_SOLVED_MAP[studentId] || [];
  const updated = existing.filter((num) => num !== targetNumber);
  map[studentId] = updated;
  saveStoredSolvedMap(map);
  return updated;
}

export async function fetchStudentsFromDB(): Promise<StudentInfo[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, register_number, department');

    if (error || !data || data.length === 0) {
      return SEEDED_STUDENTS;
    }

    return data.map((s) => ({
      id: s.id,
      name: s.name || 'Student',
      registerNumber: s.register_number || 'REG100',
      department: s.department || 'CSE'
    }));
  } catch (e) {
    return SEEDED_STUDENTS;
  }
}

export interface AggregatedProblemData {
  problemNumber: number;
  info: ProblemInfo;
  studentsCount: number;
  students: StudentInfo[];
}

export function getAllStudentsCompletedProblems(studentsList: StudentInfo[]): AggregatedProblemData[] {
  const solvedMap = getStoredSolvedMap();
  const problemToStudentsMap: Record<number, StudentInfo[]> = {};

  const allStudents = studentsList.length > 0 ? studentsList : SEEDED_STUDENTS;

  allStudents.forEach((student) => {
    const solved = solvedMap[student.id] || DEFAULT_STUDENT_SOLVED_MAP[student.id] || [];
    solved.forEach((probNum) => {
      if (!problemToStudentsMap[probNum]) {
        problemToStudentsMap[probNum] = [];
      }
      if (!problemToStudentsMap[probNum].some((s) => s.id === student.id)) {
        problemToStudentsMap[probNum].push(student);
      }
    });
  });

  const problemNumbers = Object.keys(problemToStudentsMap)
    .map(Number)
    .sort((a, b) => a - b);

  return problemNumbers.map((num) => ({
    problemNumber: num,
    info: getProblemDetails(num),
    studentsCount: problemToStudentsMap[num].length,
    students: problemToStudentsMap[num]
  }));
}
