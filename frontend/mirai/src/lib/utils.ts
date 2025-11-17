import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  datetimeToTime,
  type AvailabilitySlot,
  type SlotTimeOfDay,
  type TimeOfDay,
} from "@/types/booking";

import { type Event } from "@/types/index";
import type { GetAllBookingsResponse } from "@/api/bookings";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capatalise(s: string): string {
  return s.length === 0 ? "" : s.charAt(0).toUpperCase() + s.slice(1);
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
): SlotTimeOfDay[] {
  const slotsWithConcecutive = slots
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    )
    .map((s) => {
      const sDate = new Date(s.datetime);
      let currDate = new Date(sDate.getTime() + 60000 * 30);
      let duration = 1;

      for (const t of slots.filter(
        (f) => new Date(f.datetime).getTime() >= currDate.getTime(),
      )) {
        const tDate = new Date(t.datetime);
        if (tDate.getTime() === currDate.getTime()) {
          duration++;
          currDate = tDate;
        } else {
          break;
        }
      }
      return { ...s, duration: duration };
    });
  const filteredSlots = date
    ? slotsWithConcecutive.filter((s) => {
        const slotDate = new Date(s.datetime);
        return (
          slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getDate() === date.getDate()
        );
      })
    : slotsWithConcecutive;
  const options = filteredSlots
    .map((s) => {
      const time = datetimeToTime(s.datetime);
      return time
        ? { id: s.availability_slot_id, duration: s.duration, ...time }
        : null;
    })
    .filter((opt): opt is SlotTimeOfDay => !!opt);

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

export function bookingsToEvents(bookings: GetAllBookingsResponse[]): Event[] {
  return bookings.map((b: GetAllBookingsResponse) => {
    return {
      id: uuidv4().toString(),
      bookingId: b.id,
      startDate: new Date(b.start_time),
      endDate: new Date(b.end_time),
      employeeId: b.employee_id,
      typeId: b.type_id,
      isBooking: true,
      availability_slot_ids: null,
      bookingEmail: b.user_email,
    };
  });
}

export function availabilitySlotsToEvents(
  slots: AvailabilitySlot[],
  unit: number,
): Event[] {
  const mappedSlots = slots.map((slot) => {
    const startDate = new Date(slot.datetime);
    const endDate = new Date(startDate.getTime() + unit * 60 * 1000);

    return {
      id: uuidv4().toString(),
      startDate: startDate,
      endDate: endDate,
      employeeId: slot.employee_id,
      typeId: slot.type_id,
      isBooking: false,
      bookingId: null,
      availability_slot_ids: [slot.availability_slot_id],
      bookingEmail: null,
    };
  });
  const sorted = mappedSlots.sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  const merged: Event[] = [];

  for (const curr of sorted) {
    const last = merged[merged.length - 1];

    if (
      last &&
      last.endDate.getTime() === curr.startDate.getTime() &&
      last.employeeId === curr.employeeId &&
      last.typeId === curr.typeId
    ) {
      last.endDate = curr.endDate;
      last.availability_slot_ids?.push(...curr.availability_slot_ids);
    } else {
      merged.push({ ...curr });
    }
  }
  return merged;
}
