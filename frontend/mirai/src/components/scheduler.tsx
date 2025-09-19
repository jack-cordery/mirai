import { getAllAvailability } from "@/api/availability";
import SchedulerWrapper from "@/components/schedule/_components/view/schedular-view-filteration";
import { useScheduler } from "@/providers/schedular-provider";
import type { AvailabilitySlot, BookingType, Employee } from "@/types/booking";
import { useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { type Event, type Option } from "@/types/index"
import { getAllBookingTypes } from "@/api/booking-type";
import { getAllEmployees } from "@/api/employee";

const UNIT = 30;
const FETCH_DURATION = 60; // seconds

function bookingTypesToOptions(bookingTypes: BookingType[]): Option[] {
        return bookingTypes.map((bookingType) => {
                return {
                        id: bookingType.type_id,
                        label: bookingType.title,
                }
        })

}
function employeesToOptions(employees: Employee[]): Option[] {
        return employees.map((employee) => {
                return {
                        id: employee.employee_id,
                        label: `${employee.name} ${employee.surname}`,
                }
        })

}

function availabilitySlotsToEvents(slots: AvailabilitySlot[]): Event[] {
        return slots.map((slot) => {
                const startDate = new Date(slot.datetime);
                const endDate = new Date(startDate.getTime() + UNIT * 60 * 1000);

                return {
                        id: uuidv4().toString(),
                        startDate: startDate,
                        endDate: endDate,
                        employeeId: slot.employee_id,
                        typeId: slot.type_id,
                };
        });
}

// function eventToPostAvailabilitySlot(event: Event): PostAvailabilitySlotRequest {
//
// }
//

export default function Scheduler() {
        const { dispatch, setEmployeeOptions, setTypeOptions } = useScheduler()
        useEffect(() => {
                async function fetchEvents() {
                        try {
                                const [availabilityData, bookingTypeData, employeeData] = await Promise.all([getAllAvailability(), getAllBookingTypes(), getAllEmployees()])
                                const events = availabilitySlotsToEvents(availabilityData)
                                const typeOptions = bookingTypesToOptions(bookingTypeData)
                                const employeeOptions = employeesToOptions(employeeData)
                                console.log(events)
                                dispatch({ type: "SET_EVENTS", payload: events })
                                setTypeOptions(typeOptions)
                                setEmployeeOptions(employeeOptions)
                        } catch (error) {
                                toast("failed to fetch availability")
                        }
                }

                fetchEvents();
                const interval = setInterval(fetchEvents, 1_000 * FETCH_DURATION)
                return () => clearInterval(interval)
        }, [])
        return (
                <SchedulerWrapper
                        stopDayEventSummary={true}
                        classNames={{
                                tabs: {
                                        panel: "p-0",
                                },
                        }}
                />
        )
}
