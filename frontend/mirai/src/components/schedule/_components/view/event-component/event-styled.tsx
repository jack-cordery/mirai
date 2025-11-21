import React from "react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-context";
import { DeleteEventModal, EditEventModal } from "@/components/schedule/_modals/add-event-modal";
import type { Event, CustomEventModal } from "@/types";
import { TrashIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { useScheduler } from "@/providers/schedular-provider";
import { capatalise, cn } from "@/lib/utils";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { deleteAvailabilitySlot } from "@/api/availability";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

// Formatters
const formatDate = (date: Date) =>
        date.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
        });

const formatTime = (date: Date) =>
        date.toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
        });

// Minimalistic color variants adapted for dark theme
const variantColors = {
        availability: {
                bg: "bg-blue-900/20",
                border: "border-blue-500",
                text: "text-blue-200",
        },
        booking: {
                bg: "bg-green-900/20",
                border: "border-green-500",
                text: "text-green-200",
        },
};

interface EventStyledProps extends Event {
        minmized?: boolean;
        CustomEventComponent?: React.FC<Event>;
}

export default function EventStyled({
        event,
        hover,
        CustomEventModal,
}: {
        event: EventStyledProps;
        CustomEventModal?: CustomEventModal;
        onDelete?: (id: string) => void;
        hover: boolean;
}) {
        const { setOpen } = useModal();
        const { employeeOptions, typeOptions } = useScheduler();
        const typeLabel = typeOptions.find((t) => t.id === event?.typeId)?.label;
        const employeeLabel = employeeOptions.find((e) => e.id === event?.employeeId)?.label;

        // Modal handler
        function handleEditEvent(event: Event) {
                setOpen(
                        <CustomModal title="Edit Event">
                                <EditEventModal CustomAddEventModal={CustomEventModal?.CustomAddEventModal?.CustomForm} />
                        </CustomModal>,
                        async () => ({ ...event })
                );
        }

        // Modal handler
        function handleDeleteEvent(event: Event) {
                setOpen(
                        <CustomModal title={event.isBooking ? "Cancel Booking" : "Delete Availability"}>
                                <DeleteEventModal />
                        </CustomModal>,
                        async () => ({ ...event })
                );
        }

        const variant = event.isBooking ? variantColors.booking : variantColors.availability;

        return (
                <HoverCard>
                        <HoverCardTrigger asChild>
                                <div
                                        key={event?.id}
                                        className={cn(
                                                "w-full relative group flex flex-col flex-grow cursor-pointer",
                                                "rounded-md border border-neutral-700 bg-neutral-900",
                                                "shadow-sm hover:shadow-md transition-all duration-150"
                                        )}
                                >
                                        {/* Delete button */}
                                        <Button
                                                onClick={async (e) => {
                                                        e.stopPropagation();
                                                        handleDeleteEvent(event);
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                        "absolute right-1 top-1 h-5 w-5 p-0",
                                                        "text-neutral-400 hover:text-red-400 hover:bg-red-800/20",
                                                        "transition-opacity duration-100",
                                                        event.minmized ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                                                )}
                                        >
                                                <TrashIcon size={12} />
                                        </Button>

                                        {/* Custom UI */}
                                        {event.CustomEventComponent ? (
                                                <div
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditEvent(event);
                                                        }}
                                                >
                                                        <event.CustomEventComponent {...event} />
                                                </div>
                                        ) : (
                                                <div
                                                        onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditEvent(event);
                                                        }}
                                                        className={cn(
                                                                "flex flex-col h-full w-full rounded-md",
                                                                event.minmized ? "flex-grow overflow-hidden" : "min-h-fit"
                                                        )}
                                                >
                                                        <div
                                                                className={cn(
                                                                        "flex flex-col flex-grow rounded-md p-3 space-y-1 border-l-4",
                                                                        variant.bg,
                                                                        variant.text,
                                                                        variant.border
                                                                )}
                                                        >
                                                                {/* Title */}
                                                                <div className="font-medium text-sm truncate">
                                                                        {event.isBooking
                                                                                ? event.bookingEmail && employeeLabel && typeLabel
                                                                                        ? `${capatalise(typeLabel)} — ${event.bookingEmail} with ${employeeLabel}`
                                                                                        : "Booking"
                                                                                : typeLabel && employeeLabel
                                                                                        ? `${capatalise(typeLabel)} — ${employeeLabel}`
                                                                                        : "Availability"}
                                                                </div>

                                                                {/* Minimized time */}
                                                                {event.minmized && (
                                                                        <div className="text-[11px] text-neutral-400">
                                                                                {`${formatTime(event.startDate)} – ${formatTime(event.endDate)}`}
                                                                        </div>
                                                                )}

                                                                {/* Full view type ID */}
                                                                {!event.minmized && event.typeId && (
                                                                        <div className="text-xs text-neutral-400 mt-1">{event.typeId}</div>
                                                                )}

                                                                {/* Full view date/time */}
                                                                {!event.minmized && (
                                                                        <div className="mt-1 space-y-1 text-xs text-neutral-400">
                                                                                <div className="flex items-center gap-1">
                                                                                        <CalendarIcon className="h-3 w-3 text-neutral-500" />
                                                                                        {formatDate(event.startDate)}
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                        <ClockIcon className="h-3 w-3 text-neutral-500" />
                                                                                        {formatDate(event.endDate)}
                                                                                </div>
                                                                        </div>
                                                                )}
                                                        </div>
                                                </div>
                                        )}
                                </div>

                        </HoverCardTrigger>
                        {hover && <HoverCardContent
                                className="w-80 p-0  z-10 border-neutral-800 bg-neutral-950/95 backdrop-blur-sm shadow-2xl text-neutral-200"
                                align="start"
                                sideOffset={8}
                        >
                                <div className={cn("h-1 w-full", event.isBooking ? "bg-green-500" : "bg-blue-500")} />

                                <div className="p-4 space-y-4">
                                        {/* Header Section */}
                                        <div className="space-y-1.5">
                                                <h4 className="text-sm font-semibold text-white leading-tight">
                                                        {event.isBooking ? "Client Booking" : "Availability Slot"}
                                                </h4>
                                                <p className="text-xs text-neutral-400">
                                                        {typeLabel && employeeLabel
                                                                ? `${capatalise(typeLabel)} — ${employeeLabel}`
                                                                : "Unassigned Event"}
                                                </p>
                                        </div>

                                        <div className="border-t border-neutral-800" />

                                        {/* Details Grid */}
                                        <div className="grid gap-3 text-xs">

                                                {/* Date & Time Row */}
                                                <div className="flex items-start gap-3 text-neutral-300">
                                                        <CalendarIcon className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
                                                        <div className="space-y-0.5">
                                                                <p className="font-medium">{formatDate(event.startDate)}</p>
                                                                <p className="text-neutral-500">until {formatDate(event.endDate)}</p>
                                                        </div>
                                                </div>

                                                {/* Email Row (Only if booking) */}
                                                {event.isBooking && event.bookingEmail && (
                                                        <div className="flex items-center gap-3 text-neutral-300">
                                                                <div className="h-4 w-4 flex items-center justify-center text-neutral-500">@</div>
                                                                <span className="truncate">{event.bookingEmail}</span>
                                                        </div>
                                                )}
                                        </div>
                                </div>
                        </HoverCardContent>}
                </HoverCard>
        );
}
