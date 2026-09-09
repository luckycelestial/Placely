const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

export let DEV_STUDENT_ID = "";

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('active_student_id');
  if (saved && isValidUuid(saved)) {
    DEV_STUDENT_ID = saved.trim();
  } else if (saved) {
    localStorage.removeItem('active_student_id');
  }
}

export function setLoggedStudentId(id: string) {
  if (isValidUuid(id)) {
    DEV_STUDENT_ID = id.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_student_id', id.trim());
    }
  } else {
    console.warn('[dev-config] Rejected invalid UUID for student ID:', id);
  }
}
