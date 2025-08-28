import { getAllAvailability } from "@/api/availability";
import Scheduler from "@/components/scheduler";
import { SparklesCore } from "@/components/ui/sparkles";
import type { Event } from "@/types/index"
import type { AvailabilitySlot } from "@/types/booking";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const BackgroundAnimation = React.memo(() => {
        return (
                <div className="w-full absolute inset-0 h-screen">
                        <SparklesCore
                                id="tsparticles-calendar"
                                background="transparent"
                                minSize={0.6}
                                maxSize={1.4}
                                particleDensity={100}
                                className="w-full h-full"
                                particleColor="#FFFFFF"
                        />
                </div>
        );
});

const UNIT = 30;
const FETCH_DURATION = 60; // seconds

function availabilitySlotsToEvents(slots: AvailabilitySlot[]): Event[] {
        return slots.map((slot) => {
                const startDate = new Date(slot.datetime);
                const endDate = new Date(startDate.getTime() + UNIT * 60 * 1000);

                return {
                        id: slot.availability_slot_id.toString(),
                        startDate,
                        endDate,
                        title: `Employee ${slot.employee_id} availability with type ${slot.type_id}`,
                };
        });
}

export default function Schedule() {
        const [events, setEvents] = useState<Event[]>()
        useEffect(() => {
                async function fetchEvents() {
                        try {
                                const data: AvailabilitySlot[] = await getAllAvailability()
                                const events = availabilitySlotsToEvents(data)
                                setEvents(events)
                        } catch (error) {
                                toast("failed to fetch availability")
                        }
                }

                fetchEvents();
                const interval = setInterval(fetchEvents, 1_000 * FETCH_DURATION)
                return () => clearInterval(interval)
        }, [])
        return (
                <div className="h-screen w-full relative bg-black flex items-center justify-center overflow-hidden">
                        <BackgroundAnimation />

                        <div className="relative z-20 w-full max-w-5xl max-h-[90vh] px-4">
                                {/* This container scrolls if Scheduler is too tall */}
                                <div className="bg-opacity-10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 h-[90vh] overflow-y-auto">
                                        <Scheduler initialEvents={events} />
                                </div>
                        </div>
                </div>
        );
}
