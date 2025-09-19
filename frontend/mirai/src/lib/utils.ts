import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  datetimeToTime,
  valueToTime,
  type AvailabilitySlot,
  type TimeOfDay,
} from "@/types/booking";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getNearest30MinuteBlock(date = new Date()): Date {
  const result = new Date(date);
  result.setSeconds(0);
  result.setMilliseconds(0);

  const minutes = result.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 60;

  result.setMinutes(roundedMinutes);
  return result;
}

export function toLocalISOString(date: Date) {
  const pad = (num: number) => String(num).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // Months are 0-indexed
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Timezone offset in minutes
  const offset = date.getTimezoneOffset();
  const sign = offset > 0 ? "-" : "+";
  const absOffset = Math.abs(offset);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMinutes = pad(absOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`;
}

export function loadWorkingDayTimes() {
  // read in and checconst rawStartTime = import.meta.env.VITE_START_TIME
  const rawStartTime = import.meta.env.VITE_START_TIME;
  const rawStartMinute = import.meta.env.VITE_START_MINUTE;
  const rawEndTime = import.meta.env.VITE_END_TIME;
  const rawEndMinute = import.meta.env.VITE_END_MINUTE;
  const rawDuration = import.meta.env.VITE_TIME_SLOT_DURATION;

  const startHour = rawStartTime ? Number(rawStartTime) : NaN;
  const endHour = rawEndTime ? Number(rawEndTime) : NaN;
  const startMinute = rawStartMinute ? Number(rawStartMinute) : NaN;
  const endMinute = rawEndMinute ? Number(rawEndMinute) : NaN;
  const slotDuration = rawDuration ? Number(rawDuration) : NaN;

  if (
    !Number.isInteger(startHour) ||
    !Number.isInteger(endHour) ||
    !Number.isInteger(slotDuration) ||
    !Number.isInteger(startMinute) ||
    !Number.isInteger(endMinute)
  ) {
    throw new Error(
      `invalid config vars st ${rawStartTime} et ${rawEndTime} duration ${rawDuration} sm ${startMinute} em ${endMinute}`,
    );
  }

  const startTime = { hour: startHour, minute: startMinute };
  const endTime = { hour: endHour, minute: endMinute };
  return { startTime, endTime, slotDuration };
}

export function generateOptionsFromSlots(
  start: TimeOfDay,
  end: TimeOfDay,
  slots: AvailabilitySlot[],
  date?: Date,
): TimeOfDay[] {
  const filteredSlots = date
    ? slots.filter((s) => {
        const slotDate = new Date(s.datetime);
        return (
          slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getDate() === date.getDate()
        );
      })
    : slots;
  const options = filteredSlots
    .map((s) => datetimeToTime(s.datetime))
    .filter((opt): opt is TimeOfDay => !!opt);

  console.log(options);

  return options.filter((opt) => {
    if (opt.hour < start.hour || opt.hour > end.hour) return false;
    if (opt.hour === start.hour && opt.minute < start.minute) return false;
    if (opt.hour === end.hour && opt.minute > end.minute) return false;
    return true;
  });
}

export function generateOptions(
  start: TimeOfDay,
  end: TimeOfDay,
  slotDuration: number,
) {
  const options: TimeOfDay[] = [];

  for (let h = start.hour; h < end.hour; h++) {
    for (let m = 0; m < 60; m += slotDuration) {
      if (
        (h === start.hour && m < start.minute) ||
        (h === end.hour && m > end.minute)
      ) {
      } else {
        options.push({ hour: h, minute: m });
      }
    }
  }
  return options;
}
