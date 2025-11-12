import type { Dispatch, SVGProps } from "react";
import { z } from "zod";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// SchedulerTypes.ts

// Define event type
export interface Event {
  id: string;
  employeeId: number;
  startDate: Date;
  endDate: Date;
  typeId: number;
  availability_slot_ids: number[];
  isBooking: boolean;
}

// Define the state interface for the scheduler
export interface SchedulerState {
  events: Event[];
}

// Define actions for reducer
export type Action =
  | { type: "ADD_EVENT"; payload: Event }
  | { type: "REMOVE_EVENT"; payload: { id: string } }
  | { type: "UPDATE_EVENT"; payload: Event }
  | { type: "SET_EVENTS"; payload: Event[] };

// Define handlers interface
export interface Handlers {
  handleEventStyling: (
    event: Event,
    dayEvents: Event[],
    workStartHour: number,
    workEndHour: number,
    hourHeight: number,
    periodOptions?: {
      eventsInSamePeriod?: number;
      periodIndex?: number;
      adjustForPeriod?: boolean;
    },
  ) => {
    height: string;
    left: string;
    maxWidth: string;
    minWidth: string;
    top: string;
    zIndex: number;
  };
  handleAddEvent: (event: Event) => void;
  handleUpdateEvent: (event: Event, id: string) => void;
  handleDeleteEvent: (id: string) => void;
}

// Define getters interface
export interface Getters {
  getDaysInMonth: (
    month: number,
    year: number,
  ) => { day: number; events: Event[] }[];
  getEventsForDay: (day: number, currentDate: Date) => Event[];
  getDaysInWeek: (week: number, year: number) => Date[];
  getWeekNumber: (date: Date) => number;
  getDayName: (day: number) => string;
}

// Define the context value interface
export interface SchedulerContextType {
  events: SchedulerState;
  dispatch: Dispatch<Action>;
  getters: Getters;
  handlers: Handlers;
  weekStartsOn: startOfWeek;
  selectedType: Option | null;
  setSelectedType: React.Dispatch<React.SetStateAction<Option | null>>;
  selectedEmployee: Option | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<Option | null>>;
  typeOptions: Option[];
  setTypeOptions: React.Dispatch<React.SetStateAction<Option[]>>;
  employeeOptions: Option[];
  setEmployeeOptions: React.Dispatch<React.SetStateAction<Option[]>>;
}

export type Option = {
  id: number;
  label: string;
};

// Define the variant options
export const variants = [
  "success",
  "primary",
  "default",
  "warning",
  "danger",
] as const;

export type Variant = (typeof variants)[number];

const OptionSchema = z.object({
  label: z.string().nonoptional(),
  id: z.number().nonoptional(),
});

// Define Zod schema for form validation
export const eventSchema = z.object({
  startDate: z.date().nonoptional(),
  endDate: z.date().nonoptional(),
  employee: OptionSchema.nonoptional(),
  type: OptionSchema.nonoptional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

export type Views = {
  mobileViews?: string[];
  views?: string[];
};

export type startOfWeek = "sunday" | "monday";

export interface CustomEventModal {
  CustomAddEventModal?: {
    title?: string;
    CustomForm?: React.FC<{ register: any; errors: any }>;
  };
}

export interface CustomComponents {
  customButtons?: {
    CustomAddEventButton?: React.ReactNode;
    CustomPrevButton?: React.ReactNode;
    CustomNextButton?: React.ReactNode;
  };

  customTabs?: {
    CustomDayTab?: React.ReactNode;
    CustomWeekTab?: React.ReactNode;
    CustomMonthTab?: React.ReactNode;
  };
  CustomEventComponent?: React.FC<Event>; // Using custom event type
  CustomEventModal?: CustomEventModal;
}

export interface ButtonClassNames {
  prev?: string;
  next?: string;
  addEvent?: string;
}

export interface TabClassNames {
  view?: string;
}

export interface TabsClassNames {
  cursor?: string;
  panel?: string;
  tab?: string;
  tabContent?: string;
  tabList?: string;
  wrapper?: string;
}

export interface ViewClassNames {
  dayView?: string;
  weekView?: string;
  monthView?: string;
}

export interface ClassNames {
  event?: string;
  buttons?: ButtonClassNames;
  tabs?: TabsClassNames;
  views?: ViewClassNames;
}
