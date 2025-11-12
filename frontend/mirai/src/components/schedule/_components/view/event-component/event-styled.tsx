import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-context";
import AddEventModal, { EditEventModal } from "@/components/schedule/_modals/add-event-modal";
import type { Event, CustomEventModal } from "@/types";
import { TrashIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { useScheduler } from "@/providers/schedular-provider";
import { motion } from "framer-motion";
import { capatalise, cn } from "@/lib/utils";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { deleteAvailabilitySlot } from "@/api/availability";

// Function to format date
const formatDate = (date: Date) => {
        return date.toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
        });
};

// Function to format time only
const formatTime = (date: Date) => {
        return date.toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
        });
};

// Color variants based on event type
const variantColors = {
        availability: {
                bg: "bg-blue-100",
                border: "border-blue-200",
                text: "text-blue-800",
        },
        booking: {
                bg: "bg-green-100",
                border: "border-green-200",
                text: "text-green-800",
        },
};

interface EventStyledProps extends Event {
        minmized?: boolean;
        CustomEventComponent?: React.FC<Event>;
}

export default function EventStyled({
        event,
        onDelete,
        CustomEventModal,
}: {
        event: EventStyledProps;
        CustomEventModal?: CustomEventModal;
        onDelete?: (id: string) => void;
}) {
        const { setOpen } = useModal();
        const { handlers, employeeOptions, typeOptions } = useScheduler();
        const typeLabel = typeOptions.find(t => t.id === event?.typeId)?.label;
        const employeeLabel = employeeOptions.find(e => e.id === event?.employeeId)?.label;

        // Determine if delete button should be shown
        // Hide it for minimized events to save space, show on hover instead
        const shouldShowDeleteButton = !event?.minmized;

        // Handler function
        function handleEditEvent(event: Event) {
                // Open the modal with the content
                setOpen(
                        <CustomModal title="Edit Event">
                                <EditEventModal
                                        CustomAddEventModal={
                                                CustomEventModal?.CustomAddEventModal?.CustomForm
                                        }
                                />
                        </CustomModal>,
                        async () => {
                                return {
                                        ...event,
                                };
                        }
                );
        }

        // Get background color class based on variant
        const getBackgroundColor = (variant: string) => {
                const variantKey = variant as keyof typeof variantColors;
                const colors = variantColors[variantKey];
                return `${colors.bg} ${colors.text} ${colors.border}`;
        };
        const variant = getBackgroundColor(event.isBooking ? "booking" : "availability");

        return (
                <div
                        key={event?.id}
                        className={cn(
                                "w-full z-50 relative cursor-pointer border group rounded-lg flex flex-col flex-grow shadow-sm hover:shadow-md transition-shadow duration-200",
                                event?.minmized ? "border-transparent" : "border-default-400/60"
                        )}
                >
                        {/* Delete button - shown by default for non-minimized, or on hover for minimized */}
                        <Button
                                onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                                        e.stopPropagation();
                                        try {
                                                await deleteAvailabilitySlot({ availability_slot_ids: event.availability_slot_ids })
                                                handlers.handleDeleteEvent(event?.id);
                                                onDelete?.(event?.id);
                                        } catch (err) {
                                                toast('delete failed')
                                        }
                                }}
                                variant="destructive"
                                size="icon"
                                className={cn(
                                        "absolute z-[100] right-1 top-[-8px] h-6 w-6 p-0 shadow-md hover:bg-destructive/90 transition-all duration-200",
                                        event?.minmized ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                                )}
                        >
                                <TrashIcon size={14} className="text-destructive-foreground" />
                        </Button>

                        {event.CustomEventComponent ? (
                                <div
                                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                                e.stopPropagation();
                                                handleEditEvent({
                                                        id: event?.id,
                                                        startDate: event?.startDate,
                                                        endDate: event?.endDate,
                                                        employeeId: event?.employeeId,
                                                        isBooking: event?.isBooking,
                                                        typeId: event?.typeId,
                                                        availability_slot_ids: event?.availability_slot_ids,
                                                });
                                        }}
                                >
                                        <event.CustomEventComponent {...event} />
                                </div>
                        ) : (
                                <div
                                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                                e.stopPropagation();
                                                handleEditEvent({
                                                        id: event?.id,
                                                        startDate: event?.startDate,
                                                        endDate: event?.endDate,
                                                        employeeId: event?.employeeId,
                                                        isBooking: event?.isBooking,
                                                        typeId: event?.typeId,
                                                        availability_slot_ids: event?.availability_slot_ids,
                                                });
                                        }}
                                        className={cn(
                                                "flex flex-col h-full w-full p-2 rounded",
                                                event?.minmized ? "flex-grow overflow-hidden" : "min-h-fit"
                                        )}
                                >
                                        <div
                                                className={cn(
                                                        "flex flex-col flex-grow outline-2 rounded-2xl p-2 my-2 hover:bg-primary hover:text-black",
                                                        variant
                                                )}
                                        >
                                                <div className="font-semibold text-xs truncate mb-1">
                                                        {event.isBooking
                                                                ? event.bookingEmail && employeeLabel && typeLabel
                                                                        ? `${capatalise(typeLabel)} booking by ${event.bookingEmail} with ${employeeLabel}`
                                                                        : "Unnamed Booking"
                                                                : typeLabel && employeeLabel
                                                                        ? `${capatalise(typeLabel)} with ${employeeLabel}`
                                                                        : "Unnamed Availability"}
                                                </div>

                                                {/* Show time in minimized mode */}
                                                {event?.minmized && (
                                                        <div className="text-[10px] opacity-80">
                                                                {`${formatTime(event?.startDate)} - ${formatTime(event?.endDate)}`}
                                                        </div>
                                                )}

                                                {!event?.minmized && event?.typeId && (
                                                        <div className="my-2 text-sm">{event?.typeId}</div>
                                                )}

                                                {!event?.minmized && (
                                                        <div className="text-xs space-y-1 mt-2">
                                                                <div className="flex items-center">
                                                                        <CalendarIcon className="mr-1 h-3 w-3" />
                                                                        {formatDate(event?.startDate)}
                                                                </div>
                                                                <div className="flex items-center">
                                                                        <ClockIcon className="mr-1 h-3 w-3" />
                                                                        {formatDate(event?.endDate)}
                                                                </div>
                                                        </div>
                                                )}
                                        </div>
                                </div>
                        )}
                </div>
        );
}
