import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useScheduler } from "@/providers/schedular-provider";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion"; // Import Framer Motion
import { useModal } from "@/providers/modal-context";
import AddEventModal from "@/components/schedule/_modals/add-event-modal";
import EventStyled from "../event-component/event-styled";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { Event, CustomEventModal } from "@/types";
import CustomModal from "@/components/ui/custom-modal";
import { getNearest30MinuteBlock, loadWorkingDayTimes, maximiseTimes, minimiseTimes } from "@/lib/utils";
import { uuidv4 } from "zod";

const { startTime, endTime } = loadWorkingDayTimes();

const itemVariants = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.12 } },
};

const pageTransitionVariants = {
        enter: (direction: number): TargetAndTransition => ({
                opacity: 0,
        }),
        center: {
                opacity: 1,
        },
        exit: (direction: number): TargetAndTransition => ({
                opacity: 0,
                transition: {
                        opacity: { duration: 0.2, ease: "easeInOut" },
                },
        }),
};

export default function WeeklyView({
        prevButton,
        nextButton,
        CustomEventComponent,
        CustomEventModal,
        classNames,
}: {
        prevButton?: React.ReactNode;
        nextButton?: React.ReactNode;
        CustomEventComponent?: React.FC<Event>;
        CustomEventModal?: CustomEventModal;
        classNames?: { prev?: string; next?: string; addEvent?: string };
}) {
        const { getters, handlers, selectedEmployee, selectedType, selectedEmployeeAvailability, currentDate, setCurrentDate } = useScheduler();
        const hoursColumnRef = useRef<HTMLDivElement>(null);
        const hourElementRef = useRef<HTMLDivElement>(null);
        const [detailedHour, setDetailedHour] = useState<string | null>(null);
        const [colWidth, setColWidth] = useState<number[]>(Array(7).fill(1)); // Equal width columns by default
        const [direction, setDirection] = useState<number>(0);
        const { isOpen, setOpen } = useModal();

        const daysOfWeek = getters?.getDaysInWeek(
                getters?.getWeekNumber(currentDate),
                currentDate.getFullYear()
        );
        const [hHeight, setHHeight] = useState(0);
        const weekEvents = useMemo(() => {
                const weekEvents = [];
                for (let i = 0; i < 7; i++) {
                        weekEvents.push(...getters.getEventsForDay(
                                daysOfWeek[i].getDate(),
                                currentDate
                        ));
                }
                return weekEvents.filter((e) => e.employeeId === selectedEmployeeAvailability?.id);
        }, [selectedEmployeeAvailability, currentDate, isOpen])


        const startSortedEvents = weekEvents.sort((a, b) => (a.startDate?.getHours() - b.startDate?.getHours()) || (a.startDate?.getMinutes() - b.startDate?.getMinutes()));
        const firstEvent = (weekEvents.length > 0) ? { hour: startSortedEvents[0].startDate?.getHours(), minute: startSortedEvents[0].startDate?.getMinutes() } : { hour: 0, minute: 0 }
        const endSortedEvents = weekEvents.sort((a, b) => (a.endDate?.getHours() - b.endDate?.getHours()) || (a.endDate?.getMinutes() - b.endDate?.getMinutes()));
        const lastEvent = (weekEvents.length > 0) ? { hour: endSortedEvents[endSortedEvents.length - 1].endDate?.getHours(), minute: endSortedEvents[endSortedEvents.length - 1].endDate?.getMinutes() } : { hour: 0, minute: 0 }

        const correctedStartTime = (weekEvents.length > 0) ? minimiseTimes(startTime, firstEvent) : startTime
        const correctedEndTime = (weekEvents.length > 0) ? maximiseTimes(endTime, lastEvent) : endTime

        const hours = Array.from({ length: correctedEndTime.hour - correctedStartTime.hour + 1 }, (_, i) => {
                const hour = (i + correctedStartTime.hour) % 12 || 12;
                const ampm = (i + correctedStartTime.hour) < 12 ? "AM" : "PM";
                return `${hour}:00 ${ampm}`;
        });

        const handleMouseMove = useCallback(
                (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                        if (!hoursColumnRef.current) return;
                        const rect = hoursColumnRef.current.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const hour = Math.max(correctedStartTime.hour, correctedStartTime.hour + Math.min(correctedEndTime.hour, Math.floor(y / hHeight)));

                        // Format in 12-hour format
                        const hour12 = hour % 12 || 12;
                        const ampm = hour < 12 ? "AM" : "PM";
                        setDetailedHour(
                                `${hour12}:00 ${ampm}`
                        );
                },
                [hHeight]
        );

        useEffect(() => {
                const updateHeight = () => {
                        if (hourElementRef.current) {
                                const rect = hourElementRef.current.getBoundingClientRect();
                                setHHeight(rect.height);
                        }
                };
                // Use requestAnimationFrame to ensure DOM is painted
                requestAnimationFrame(updateHeight);

                // Also update on window resize
                window.addEventListener('resize', updateHeight);
                return () => window.removeEventListener('resize', updateHeight);
        }, [startTime.hour, endTime.hour, currentDate, selectedEmployeeAvailability]);

        // Reset column widths when the date changes
        useEffect(() => {
                setColWidth(Array(7).fill(1));
        }, [currentDate]);

        function handleAddEvent(event?: Event) {
                // Create the modal content with the provided event data or defaults
                const startDate = event?.startDate || new Date();
                const endDate = event?.endDate || new Date();

                // Open the modal with the content
                setOpen(
                        <CustomModal title="Add Event">
                                <AddEventModal
                                        CustomAddEventModal={
                                                CustomEventModal?.CustomAddEventModal?.CustomForm
                                        }
                                />
                        </CustomModal>,
                        async () => {
                                return {
                                        ...event,
                                        startDate,
                                        endDate,
                                };
                        }
                );
        }

        const handleNextWeek = useCallback(() => {
                setDirection(1);
                const nextWeek = new Date(currentDate);
                nextWeek.setDate(currentDate.getDate() + 7);
                setCurrentDate(nextWeek);
        }, [currentDate]);

        const handlePrevWeek = useCallback(() => {
                setDirection(-1);
                const prevWeek = new Date(currentDate);
                prevWeek.setDate(currentDate.getDate() - 7);
                setCurrentDate(prevWeek);
        }, [currentDate]);

        function handleAddEventWeek(dayIndex: number, detailedHourS: string) {
                if (!detailedHourS) {
                        console.error("Detailed hour not provided.");
                        console.log(detailedHourS)
                        return;
                }

                // Parse the 12-hour format time
                const [timePart, ampm] = detailedHourS.split(" ");
                const [hourStr, minuteStr] = timePart.split(":");
                let hours = parseInt(hourStr);
                const minutes = parseInt(minuteStr);

                // Convert to 24-hour format for Date object
                if (ampm === "PM" && hours < 12) {
                        hours += 12;
                } else if (ampm === "AM" && hours === 12) {
                        hours = 0;
                }

                const chosenDay = daysOfWeek[dayIndex % 7].getDate();

                // Ensure day is valid
                if (chosenDay < 1 || chosenDay > 31) {
                        console.error("Invalid day selected:", chosenDay);
                        return;
                }

                const date = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        chosenDay,
                        hours,
                        minutes
                );
                handleAddEvent({
                        startDate: getNearest30MinuteBlock(date),
                        endDate: getNearest30MinuteBlock(new Date(date.getTime() + 60 * 60 * 1000)), // 1-hour duration
                        id: uuidv4.toString(),
                        employeeId: selectedEmployee?.id ?? 0,
                        isBooking: false,
                        bookingId: null,
                        bookingEmail: null,
                        typeId: selectedType?.id ?? 0,
                        availability_slot_ids: [],
                });

        }


        // Group events by time period to prevent splitting spaces within same time blocks
        const groupEventsByTimePeriod = (events: Event[] | undefined) => {
                if (!events || events.length === 0) return [];

                // Sort events by start time
                const sortedEvents = [...events].sort((a, b) =>
                        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                );

                // Precise time overlap checking function
                const eventsOverlap = (event1: Event, event2: Event) => {
                        const start1 = new Date(event1.startDate).getTime();
                        const end1 = new Date(event1.endDate).getTime();
                        const start2 = new Date(event2.startDate).getTime();
                        const end2 = new Date(event2.endDate).getTime();

                        // Strict time overlap - one event starts before the other ends
                        return (start1 < end2 && start2 < end1);
                };

                // First, create a graph where events are vertices and edges represent overlaps
                const graph: Record<string, Set<string>> = {};

                // Initialize graph
                for (const event of sortedEvents) {
                        graph[event.id] = new Set<string>();
                }

                // Build connections - only connect events that truly overlap in time
                for (let i = 0; i < sortedEvents.length; i++) {
                        for (let j = i + 1; j < sortedEvents.length; j++) {
                                // Only consider events that actually overlap in time
                                if (eventsOverlap(sortedEvents[i], sortedEvents[j])) {
                                        graph[sortedEvents[i].id].add(sortedEvents[j].id);
                                        graph[sortedEvents[j].id].add(sortedEvents[i].id);
                                }
                        }
                }

                // Use DFS to find connected components (groups of overlapping events)
                const visited = new Set<string>();
                const groups: Event[][] = [];

                for (const event of sortedEvents) {
                        if (!visited.has(event.id)) {
                                // Start a new component/group
                                const group: Event[] = [];
                                const stack: Event[] = [event];
                                visited.add(event.id);

                                // DFS traversal
                                while (stack.length > 0) {
                                        const current = stack.pop()!;
                                        group.push(current);

                                        // Visit neighbors (overlapping events)
                                        for (const neighborId of graph[current.id]) {
                                                if (!visited.has(neighborId)) {
                                                        const neighbor = sortedEvents.find(e => e.id === neighborId);
                                                        if (neighbor) {
                                                                stack.push(neighbor);
                                                                visited.add(neighborId);
                                                        }
                                                }
                                        }
                                }

                                // Sort this group by start time
                                group.sort((a, b) =>
                                        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                                );

                                groups.push(group);
                        }
                }

                return groups;
        };

        return (
                <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">

                                <div className="flex ml-auto gap-3">
                                        {prevButton ? (
                                                <div onClick={handlePrevWeek}>{prevButton}</div>
                                        ) : (
                                                <Button variant="outline" className={classNames?.prev} onClick={handlePrevWeek}>
                                                        <ArrowLeft />
                                                        Prev
                                                </Button>
                                        )}
                                        {nextButton ? (
                                                <div onClick={handleNextWeek}>{nextButton}</div>
                                        ) : (
                                                <Button variant="outline" className={classNames?.next} onClick={handleNextWeek}>
                                                        Next
                                                        <ArrowRight />
                                                </Button>
                                        )}
                                </div>
                        </div>

                        <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.div
                                        key={currentDate.toISOString()}
                                        custom={direction}
                                        variants={pageTransitionVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                                opacity: { duration: 0.2 },
                                        }}
                                        className={`grid use-automation-zoom-in grid-cols-8 gap-0`}
                                >
                                        <div className="sticky top-0 left-0 z-30 bg-default-100 rounded-tl-lg h-full border-0 flex items-center justify-center bg-primary/10">
                                                <span className="text-xl tracking-tight font-semibold ">
                                                        Week {getters.getWeekNumber(currentDate)}
                                                </span>
                                        </div>

                                        <div className="col-span-7 flex flex-col relative">
                                                <div
                                                        className="grid gap-0 flex-grow bg-primary/10 rounded-r-lg"
                                                        style={{
                                                                gridTemplateColumns: colWidth.map(w => `${w}fr`).join(' '),
                                                                transition: 'grid-template-columns 0.3s ease-in-out'
                                                        }}
                                                >
                                                        {daysOfWeek.map((day, idx) => (
                                                                <div key={idx} className="relative group cursor-pointer flex flex-col">
                                                                        <div
                                                                                className="sticky bg-default-100 group-hover:bg-black top-0 z-20 flex-grow flex items-center justify-center"
                                                                        >
                                                                                <div className="text-center p-4">
                                                                                        <div className="text-lg font-semibold">
                                                                                                {getters.getDayName(day.getDay())}
                                                                                        </div>
                                                                                        <div
                                                                                                className={clsx(
                                                                                                        "text-lg font-semibold",
                                                                                                        new Date().getDate() === day.getDate() &&
                                                                                                                new Date().getMonth() === currentDate.getMonth() &&
                                                                                                                new Date().getFullYear() === currentDate.getFullYear()
                                                                                                                ? "text-secondary-500"
                                                                                                                : ""
                                                                                                )}
                                                                                        >
                                                                                                {day.getDate()}
                                                                                        </div>

                                                                                </div>
                                                                        </div>
                                                                        <div className="absolute top-12 right-0 w-px h-[calc(100%-3rem)]"></div>
                                                                </div>
                                                        ))}
                                                </div>

                                        </div>

                                        <div
                                                className="grid grid-cols-8 col-span-8"
                                        >
                                                <div
                                                        className="col-span-1 flex flex-col bg-default-50 hover:bg-default-100 transition duration-400"
                                                        ref={hoursColumnRef}
                                                >
                                                        {hours.map((hour, index) => (
                                                                <motion.div
                                                                        key={`hour-${index}`}
                                                                        ref={(index === 0) ? hourElementRef : null}
                                                                        variants={itemVariants}
                                                                        className="cursor-pointer   transition duration-300  p-1 flex-1 text-left text-sm text-muted-foreground border-default-200 border-t-2"
                                                                >

                                                                        {hour}
                                                                </motion.div>
                                                        ))}
                                                </div>

                                                <div
                                                        className="col-span-7 bg-default-50 grid h-full"
                                                        style={{
                                                                gridTemplateColumns: colWidth.map(w => `${w}fr`).join(' '),
                                                                transition: 'grid-template-columns 0.3s ease-in-out'
                                                        }}
                                                >
                                                        {Array.from({ length: 7 }, (_, dayIndex) => {
                                                                const dayEvents = getters.getEventsForDay(
                                                                        daysOfWeek[dayIndex % 7].getDate(),
                                                                        currentDate
                                                                );

                                                                // Calculate time groups once for this day's events
                                                                const timeGroups = groupEventsByTimePeriod(dayEvents);

                                                                // Get the count of events to determine if we need to show a "more" button
                                                                const eventsCount = dayEvents?.length || 0;
                                                                const maxEventsToShow = 10; // Limit the number of events to display before showing "more"
                                                                const hasMoreEvents = eventsCount > maxEventsToShow;

                                                                // Only show a subset of events if there are too many
                                                                const visibleEvents = hasMoreEvents
                                                                        ? dayEvents?.slice(0, maxEventsToShow - 1)
                                                                        : dayEvents;

                                                                return (
                                                                        <div
                                                                                key={`day-${dayIndex}`}
                                                                                className="col-span-1 border-default-200 z-20 relative transition duration-300 cursor-pointer border-r border-b text-center text-sm text-muted-foreground overflow-hidden"
                                                                                onMouseMove={handleMouseMove}
                                                                                onMouseLeave={() => setDetailedHour(null)}
                                                                                onClick={() => {
                                                                                        handleAddEventWeek(dayIndex, detailedHour as string);
                                                                                }}
                                                                        >
                                                                                <AnimatePresence initial={false}>
                                                                                        {visibleEvents?.map((event, eventIndex) => {
                                                                                                // For better spacing, consider if this event is part of a time group
                                                                                                let eventsInSamePeriod = 1;
                                                                                                let periodIndex = 0;

                                                                                                // Find which time group this event belongs to
                                                                                                for (let i = 0; i < timeGroups.length; i++) {
                                                                                                        const groupIndex = timeGroups[i].findIndex(e => e.id === event.id);
                                                                                                        if (groupIndex !== -1) {
                                                                                                                eventsInSamePeriod = timeGroups[i].length;
                                                                                                                periodIndex = groupIndex;
                                                                                                                break;
                                                                                                        }
                                                                                                }

                                                                                                // Customize styling parameters for events in the same time period
                                                                                                const { height, left, maxWidth, minWidth, top, zIndex } =
                                                                                                        handlers.handleEventStyling(
                                                                                                                event,
                                                                                                                dayEvents,
                                                                                                                correctedStartTime.hour,
                                                                                                                correctedEndTime.hour,
                                                                                                                hHeight,
                                                                                                                {
                                                                                                                        eventsInSamePeriod,
                                                                                                                        periodIndex,
                                                                                                                        adjustForPeriod: true
                                                                                                                }
                                                                                                        );

                                                                                                return (
                                                                                                        <motion.div
                                                                                                                key={event.id}
                                                                                                                style={{
                                                                                                                        height: height,
                                                                                                                        top: top,
                                                                                                                        left: left,
                                                                                                                        maxWidth: maxWidth,
                                                                                                                        minWidth: minWidth,
                                                                                                                        padding: '0 2px',
                                                                                                                        boxSizing: 'border-box',
                                                                                                                }}
                                                                                                                className="transition-all duration-1000 flex z-50 absolute"
                                                                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                                                exit={{ opacity: 0, scale: 0.9 }}
                                                                                                                transition={{ duration: 0.2 }}
                                                                                                        >
                                                                                                                <EventStyled
                                                                                                                        event={{
                                                                                                                                ...event,
                                                                                                                                CustomEventComponent,
                                                                                                                                minmized: true,
                                                                                                                        }}
                                                                                                                        CustomEventModal={CustomEventModal}
                                                                                                                        hover={true}
                                                                                                                />
                                                                                                        </motion.div>
                                                                                                );
                                                                                        })}

                                                                                        {/* Show "more events" button if there are too many */}
                                                                                        {hasMoreEvents && (
                                                                                                <motion.div
                                                                                                        key={`more-events-${dayIndex}`}
                                                                                                        style={{
                                                                                                                bottom: '10px',
                                                                                                                right: '10px',
                                                                                                                position: 'absolute',
                                                                                                        }}
                                                                                                        className="z-50"
                                                                                                        initial={{ opacity: 0 }}
                                                                                                        animate={{ opacity: 1 }}
                                                                                                        exit={{ opacity: 0 }}
                                                                                                >
                                                                                                        <Badge
                                                                                                                variant="secondary"
                                                                                                                className="cursor-pointer hover:bg-accent"
                                                                                                                onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        // Show a modal with all events for this day
                                                                                                                        setOpen(
                                                                                                                                <CustomModal title={`Events for ${daysOfWeek[dayIndex].toDateString()}`}>
                                                                                                                                        <div className="space-y-2 p-2 max-h-[80vh] overflow-y-auto">
                                                                                                                                                {dayEvents?.map((event) => (
                                                                                                                                                        <EventStyled
                                                                                                                                                                key={event.id}
                                                                                                                                                                event={{
                                                                                                                                                                        ...event,
                                                                                                                                                                        CustomEventComponent,
                                                                                                                                                                        minmized: false,
                                                                                                                                                                }}
                                                                                                                                                                CustomEventModal={CustomEventModal}
                                                                                                                                                                hover={true}
                                                                                                                                                        />
                                                                                                                                                ))}
                                                                                                                                                PM           </div>
                                                                                                                                </CustomModal>
                                                                                                                        );
                                                                                                                }}
                                                                                                        >
                                                                                                                +{eventsCount - (maxEventsToShow - 1)} more
                                                                                                        </Badge>
                                                                                                </motion.div>
                                                                                        )}
                                                                                </AnimatePresence>

                                                                                {/* Render hour slots */}
                                                                                {Array.from({ length: correctedEndTime.hour - correctedStartTime.hour + 1 }, (_, hourIndex) => (
                                                                                        <div
                                                                                                key={`day-${dayIndex}-hour-${hourIndex}`}
                                                                                                className="col-span-1 border-default-200 h-[64px] relative transition duration-300 cursor-pointer border-r border-b text-center text-sm text-muted-foreground"
                                                                                        >
                                                                                                <div className="absolute bg-accent z-40 flex items-center justify-center text-xs opacity-0 transition duration-250 hover:opacity-100 w-full h-full">
                                                                                                        Add Event
                                                                                                </div>
                                                                                        </div>
                                                                                ))}
                                                                        </div>
                                                                );
                                                        })}
                                                </div>
                                        </div>
                                </motion.div>
                        </AnimatePresence>


                </div >
        );
}
