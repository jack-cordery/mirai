import { getAllAvailability } from "@/api/availability";
import SchedulerWrapper from "@/components/schedule/_components/view/schedular-view-filteration";
import { useScheduler } from "@/providers/schedular-provider";
import type { BookingType, Employee } from "@/types/booking";
import { useEffect } from "react";
import { toast } from "sonner";
import { type Option } from "@/types/index"
import { availabilitySlotsToEvents, bookingsToEvents } from "@/lib/utils";
import { getAllBookingTypes } from "@/api/booking-type";
import { getAllEmployees } from "@/api/employee";
import { getAllBookings, type GetAllBookingsResponse } from "@/api/bookings";

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


export default function Scheduler() {
        const { dispatch, setEmployeeOptions, setTypeOptions, selectedEmployeeAvailability } = useScheduler()
        useEffect(() => {
                async function fetchEvents() {
                        try {
                                const [availabilityData, bookingTypeData, employeeData, bookings] = await Promise.all([getAllAvailability(), getAllBookingTypes(), getAllEmployees(), getAllBookings()])
                                const availabilityEvents = availabilitySlotsToEvents(availabilityData, UNIT);
                                const bookingEvents = bookings ? bookingsToEvents(bookings.filter((b: GetAllBookingsResponse) => b.status != "cancelled")) : [];
                                const typeOptions = bookingTypesToOptions(bookingTypeData);
                                const employeeOptions = employeesToOptions(employeeData);
                                dispatch({ type: "SET_EVENTS", payload: [...availabilityEvents, ...bookingEvents] });
                                setTypeOptions(typeOptions);
                                setEmployeeOptions(employeeOptions);
                        } catch (error) {
                                toast("failed to fetch availability");
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
