export const statuses = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof statuses)[number];
export class BusinessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const blocksTime = (status: string) =>
  status !== "CANCELLED" && status !== "NO_SHOW";
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}
export function withinSchedule(
  start: Date,
  end: Date,
  schedules: { weekday: number; startMinute: number; endMinute: number }[],
) {
  // Côte d’Ivoire : UTC, pas de changement saisonnier. Les autres fuseaux viendront avec les paramètres pays.
  const midnight = new Date(start);
  midnight.setUTCHours(0, 0, 0, 0);
  const endMinute = (end.getTime() - midnight.getTime()) / 60000;
  if (end <= start || endMinute > 1440) return false;
  const startMinute = start.getUTCHours() * 60 + start.getUTCMinutes();
  return schedules.some(
    (s) =>
      s.weekday === start.getUTCDay() &&
      startMinute >= s.startMinute &&
      endMinute <= s.endMinute,
  );
}
export function canTransition(from: string, to: BookingStatus) {
  if (from === to) return true;
  const transitions: Record<string, readonly string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  };
  return transitions[from]?.includes(to) ?? false;
}
