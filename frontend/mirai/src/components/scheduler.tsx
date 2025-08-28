import SchedulerWrapper from "@/components/schedule/_components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/providers/schedular-provider";
import type { Event } from "@/types/index";

interface SchedulerProps {
        initialEvents?: Event[];
        onAddEvent?: (event: Event) => void | Promise<void>;
        onUpdateEvent?: (event: Event) => void | Promise<void>;
        onDeleteEvent?: (id: string) => void | Promise<void>;
}

export default function ScheduLer({
        initialEvents,
        onAddEvent,
        onUpdateEvent,
        onDeleteEvent
}: SchedulerProps) {
        return (
                <SchedulerProvider
                        weekStartsOn="monday"
                        initialState={initialEvents}
                        onAddEvent={onAddEvent}
                        onUpdateEvent={onUpdateEvent}
                        onDeleteEvent={onDeleteEvent}
                >
                        <SchedulerWrapper
                                stopDayEventSummary={true}
                                classNames={{
                                        tabs: {
                                                panel: "p-0",
                                        },
                                }}
                        />
                </SchedulerProvider>
        )
}
