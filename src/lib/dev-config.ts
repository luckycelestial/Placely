// This file contains configuration for development/testing purposes.
// Since auth is not yet implemented, we use a dynamic student ID to simulate a logged-in user.

export let DEV_STUDENT_ID = "fd6d99a3-41d9-488d-9e98-b50b649233a8"; // Aarav Sharma (Default)

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('active_student_id');
  if (saved) {
    DEV_STUDENT_ID = saved;
  }
}

export function setLoggedStudentId(id: string) {
  DEV_STUDENT_ID = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem('active_student_id', id);
  }
}
