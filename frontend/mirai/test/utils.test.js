import { expect, test } from "vitest";
import {
  availabilitySlotsToEvents,
  getCost,
  maximiseTimes,
  minimiseTimes,
} from "../src/lib/utils";

test("availabilitySlotsToEvents creates the right object with dates, and merging", () => {
  const rfcDate1 = "2025-10-20T12:00:00Z";
  const rfcDate2 = "2025-10-20T12:30:00Z";
  const rfcDate3 = "2025-10-20T13:00:00Z";
  const input = [
    {
      availability_slot_id: 0,
      datetime: rfcDate1,
      employee_id: 0,
      type_id: 0,
      created_at: "",
      last_edited: "",
    },
    {
      availability_slot_id: 1,
      datetime: rfcDate2,
      employee_id: 0,
      type_id: 0,
      created_at: "",
      last_edited: "",
    },
    {
      availability_slot_id: 2,
      datetime: rfcDate3,
      employee_id: 0,
      type_id: 0,
      created_at: "",
      last_edited: "",
    },
  ];
  const actual = availabilitySlotsToEvents(input, 30);
  actual.forEach((obj) => {
    delete obj.id;
  });
  const expected = [
    {
      employeeId: 0,
      startDate: new Date(rfcDate1),
      endDate: new Date(new Date(rfcDate1).getTime() + 90 * 60 * 1000), // +30 mins
      isBooking: false,
      typeId: 0,
      availability_slot_ids: [0, 1, 2],
      bookingId: null,
      bookingEmail: null,
    },
  ];
  expect(actual).toEqual(expected);
});

test("getCost calculates the correct cost given a fixed cost", () => {
  const bt = { cost: 100, fixed: true };
  const cost = getCost(bt, 10);
  const expected = 100;
  expect(cost).toEqual(expected);
});

test("minimiseTimes works ", () => {
  const f = { hour: 1, minute: 30 };
  const s = { hour: 2, minute: 0 };
  const expected = { hour: 1, minute: 30 };
  const acutal = minimiseTimes(f, s);
  expect(acutal).toEqual(expected);
});
test("minimiseTimes works with equals ", () => {
  const f = { hour: 2, minute: 0 };
  const s = { hour: 2, minute: 0 };
  const expected = { hour: 2, minute: 0 };
  const acutal = minimiseTimes(f, s);
  expect(acutal).toEqual(expected);
});

test("maximiseTimes works", () => {
  const f = { hour: 1, minute: 30 };
  const s = { hour: 2, minute: 0 };
  const expected = { hour: 2, minute: 0 };
  const acutal = maximiseTimes(f, s);
  expect(acutal).toEqual(expected);
});

test("maximiseTimes works with equals", () => {
  const f = { hour: 2, minute: 0 };
  const s = { hour: 2, minute: 0 };
  const expected = { hour: 2, minute: 0 };
  const acutal = maximiseTimes(f, s);
  expect(acutal).toEqual(expected);
});
