export type TimeOfDay = {
  hour: number;
  minute: number;
};

export type SelectedTimes = {
  startTime: TimeOfDay | null;
  endTime: TimeOfDay | null;
};

export type BookingType = {
  type_id: number;
  title: string;
  description: string;
  fixed: boolean;
  cost: number;
  created_at: string;
  last_edited: string;
};

export type Employee = {
  employee_id: number;
  name: string;
  surname: string;
  email: string;
  title: string;
  description: string;
  created_at: string;
  last_login: string;
};

export type AvailabilitySlot = {
  availability_slot_id: number;
  employee_id: number;
  datetime: string;
  type_id: number;
  created_at: string;
  last_edited: string;
};

export type PostAvailabilitySlotRequest = {
  employee_id: number;
  start_time: string;
  end_time: string;
  type_id: number;
};

export type PostAvailabilitySlotResponse = {
  availability_slot_ids: number[];
};

export type PutAvailabilitySlotRequest = {
  availability_slot_ids: number[];
  employee_id: number;
  start_time: string;
  end_time: string;
  type_id: number;
};

export type PutAvailabilitySlotResponse = {
  availability_slot_ids: number[];
};

export function displayTime(time: TimeOfDay) {
  return `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;
}

export function timeToValue(t: TimeOfDay) {
  return `${t.hour.toString().padStart(2, "0")}:${t.minute
    .toString()
    .padStart(2, "0")}`;
}

export function valueToTime(val: string): TimeOfDay | null {
  const [hStr, mStr] = val.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);

  if (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour < 24 &&
    minute >= 0 &&
    minute < 60
  ) {
    return { hour, minute };
  } else {
    return null;
  }
}

export function datetimeToTime(val: string): TimeOfDay | null {
  const date = new Date(val);

  if (isNaN(date.getTime())) {
    return null; // invalid date string
  }

  const hour = date.getHours(); // use getUTCHours() if you want UTC
  const minute = date.getMinutes();

  if (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour < 24 &&
    minute >= 0 &&
    minute < 60
  ) {
    return { hour, minute };
  }

  return null;
}
