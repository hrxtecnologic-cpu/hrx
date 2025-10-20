// Helper functions for conflict detection

// Helper function to parse time string (HH:MM) to minutes
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Helper function to check if two date ranges overlap
export function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 <= e2 && s2 <= e1;
}

// Helper function to check if two time ranges overlap
export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

// Check if two events have conflicting schedules
export function eventsConflict(
  event1: { start_date: string; end_date: string; start_time?: string; end_time?: string },
  event2: { start_date: string; end_date: string; start_time?: string; end_time?: string }
): boolean {
  // First check if dates overlap
  const dateOverlap = datesOverlap(
    event1.start_date,
    event1.end_date,
    event2.start_date,
    event2.end_date
  );

  if (!dateOverlap) {
    return false;
  }

  // If dates overlap, check if times overlap
  const timeOverlap = timesOverlap(
    event1.start_time || '00:00',
    event1.end_time || '23:59',
    event2.start_time || '00:00',
    event2.end_time || '23:59'
  );

  return timeOverlap;
}
