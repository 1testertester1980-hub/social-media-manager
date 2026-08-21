import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameMonth,
  isToday as isTodayFns,
} from "date-fns";
import { sk } from "date-fns/locale";

export function getMonthGrid(anchor: Date) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function getWeekDays(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export { addMonths, addWeeks, addDays, isSameMonth, format };
export const isToday = isTodayFns;
export const skLocale = sk;
