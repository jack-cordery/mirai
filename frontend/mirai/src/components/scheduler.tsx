import { getAllAvailability } from "@/api/availability";
import SchedulerWrapper from "@/components/schedule/_components/view/schedular-view-filteration";
import { useScheduler } from "@/providers/schedular-provider";
import type { AvailabilitySlot } from "@/types/booking";
import { useEffect } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { type Event } from "@/types/index"

const UNIT = 30;
const FETCH_DURATION = 60; // seconds

function availabilitySlotsToEvents(slots: AvailabilitySlot[]): Event[] {
        return slots.map((slot) => {
                const startDate = new Date(slot.datetime);
                const endDate = new Date(startDate.getTime() + UNIT * 60 * 1000);

                return {
                        id: uuidv4().toString(),
                        startDate: startDate,
                        endDate: endDate,
                        employeeId: slot.availability_slot_id,
                        typeId: slot.type_id,
                };
        });
}

// function eventToPostAvailabilitySlot(event: Event): PostAvailabilitySlotRequest {
//
// }
//
const typeOptions = [{ "id": 1, "label": "haircut" }, { "id": 2, "label": "not a haircut" }]
const employeeOptions = [{ "id": 1, "label": "a" }, { "id": 2, "label": "b" }]

export default function Scheduler() {
        const { dispatch, setEmployeeOptions, setTypeOptions } = useScheduler()
        useEffect(() => {
                async function fetchEvents() {
                        try {
                                const data: AvailabilitySlot[] = await getAllAvailability()
                                const events = availabilitySlotsToEvents(data)
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
