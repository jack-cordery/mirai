import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { getNearest30MinuteBlock, toLocalISOString } from "@/lib/utils";
import { useModal } from "@/providers/modal-context";
import SelectDate from "@/components/schedule/_components/add-event-components/select-date";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type EventFormData, eventSchema, type Event } from "@/types/index";
import { useScheduler } from "@/providers/schedular-provider";
import { v4 as uuidv4 } from 'uuid';
import { postAvailabilitySlot, putAvailabilitySlot } from "@/api/availability";
import { toast } from "sonner";
import type { PostAvailabilitySlotResponse, PutAvailabilitySlotResponse } from "@/types/booking";
import BookingCalendar from "@/components/booking-calendar";
import { useBookingCalendarContext } from "@/contexts/booking-calendar-context";
import { format } from "date-fns";


export default function AddBookingModal({
        CustomAddEventModal,
        selectedDate,
}: {
        CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
        selectedDate?: Date;
}) {
        const { setClose, data } = useModal();
        const { handlers, typeOptions, employeeOptions, currentDate, selectedEmployeeAvailability } = useScheduler();

        const {
                register,
                handleSubmit,
                formState: { errors },
                setValue,
                watch,
        } = useForm<EventFormData>({
                resolver: zodResolver(eventSchema),
                defaultValues: {
                        startDate: getNearest30MinuteBlock(selectedDate) ?? getNearest30MinuteBlock(currentDate),
                        endDate: getNearest30MinuteBlock(selectedDate) ?? getNearest30MinuteBlock(currentDate),
                        type: typeOptions[0],
                        employee: selectedEmployeeAvailability || employeeOptions[0],
                },
        });
        const typedData = data as { default: Event };
        const selectedType = watch("type");
        const selectedEmployee = watch("employee");

        // Reset the form on initialization

        const onSubmit: SubmitHandler<EventFormData> = async (formData) => {
                try {
                        const res: PostAvailabilitySlotResponse = await postAvailabilitySlot({
                                employee_id: formData.employee.id,
                                start_time: toLocalISOString(formData.startDate),
                                end_time: toLocalISOString(formData.endDate),
                                type_id: formData.type.id,
                        })

                        const newEvent: Event = {
                                id: uuidv4().toString(),
                                startDate: formData.startDate,
                                endDate: formData.endDate,
                                employeeId: formData.employee.id,
                                typeId: formData.type.id,
                                isBooking: false,
                                bookingId: null,
                                bookingEmail: null,
                                availability_slot_ids: res.availability_slot_ids,
                        }
                        handlers.handleAddEvent(newEvent);
                        setClose(); // Close the modal after submission
                } catch (error) {
                        toast(`creation failed: ${error}`)

                }
        };

        return (
                <form className="flex flex-col gap-4 p-4" onSubmit={handleSubmit(onSubmit)}>
                        {CustomAddEventModal ? (
                                <CustomAddEventModal register={register} errors={errors} />
                        ) : (
                                <>
                                        <SelectDate
                                                data={{
                                                        startDate: (typedData.default?.startDate ?? getNearest30MinuteBlock(new Date())),
                                                        endDate: (typedData.default?.endDate ?? getNearest30MinuteBlock(new Date())),
                                                }}
                                                setValue={setValue}
                                        />

                                        <div className="grid gap-2">
                                                <Label>Booking Type</Label>
                                                <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                                <Button
                                                                        className="w-fit my-2"
                                                                >
                                                                        {
                                                                                typeOptions.find((type) => type.id === (selectedType?.id ?? 0))
                                                                                        ?.label
                                                                        }
                                                                </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                                {typeOptions.map((type) => (
                                                                        <DropdownMenuItem
                                                                                key={type.id}
                                                                                onClick={() => {
                                                                                        setValue("type", type)
                                                                                }}
                                                                        >
                                                                                <div className="flex items-center">
                                                                                        <div
                                                                                                className={`w-4 h-4 rounded-full mr-2`}
                                                                                        />
                                                                                        {type.label}
                                                                                </div>
                                                                        </DropdownMenuItem>
                                                                ))}
                                                        </DropdownMenuContent>
                                                </DropdownMenu>
                                        </div>
                                        <div className="grid gap-2">
                                                <Label>Employee</Label>
                                                <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                                <Button
                                                                        className="w-fit my-2"
                                                                >
                                                                        {
                                                                                employeeOptions.find((type) => type.id === (selectedEmployee?.id ?? 0))
                                                                                        ?.label
                                                                        }
                                                                </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                                {employeeOptions.map((employee) => (
                                                                        <DropdownMenuItem
                                                                                key={employee.id}
                                                                                onClick={() => {
                                                                                        setValue("employee", employee)
                                                                                }}
                                                                        >
                                                                                <div className="flex items-center">
                                                                                        <div
                                                                                                className={`w-4 h-4 rounded-full mr-2`}
                                                                                        />
                                                                                        {employee.label}
                                                                                </div>
                                                                        </DropdownMenuItem>
                                                                ))}
                                                        </DropdownMenuContent>
                                                </DropdownMenu>
                                        </div>


                                        <div className="flex justify-end space-x-2 mt-4 pt-2 border-t">
                                                <Button variant="outline" type="button" onClick={() => setClose()}>
                                                        Cancel
                                                </Button>
                                                <Button type="submit">Save Event</Button>
                                        </div>
                                </>
                        )}
                </form>
        );
}

export function EditBookingModal({
        bookingID,
}: {
        bookingID: number;
}) {

        // TODO: so here we need to replace the fact that it isnt from selection but an event 
        // so i want to reschedule a booking - so take the booking values from the event (type=booking) and populate the form
        // and then send a putBooking request
        // lets do something like the foloowing 
        // take in eventID as input 
        // get the event from useScheduler which is a booking 
        // use the booking details to fill form and then 
        // send putBooking dont need useModal??

        const { setDate, employees, bookingTypes, setSelectedEmployee, setSelectedBookingType } = useBookingCalendarContext();
        const { events } = useScheduler();

        const typedData = events.events.find((e) => e.bookingId == bookingID)
        const e = employees.find((e) => e.employee_id == (typedData?.employeeId ?? -1)) ?? null;
        const bt = (bookingTypes.find((e) => e.type_id == (typedData?.typeId ?? -1)) ?? null);
        const sd = new Date(typedData?.startDate ?? 0)
        sd?.setHours(0, 0, 0, 0)
        useEffect(() => {
                setSelectedEmployee(e);
                setSelectedBookingType(bt);
                setDate(sd)
        }, [])


        return (
                <>
                        <div className="grid gap-6 py-2">

                                {/* 📋 CURRENT BOOKING SUMMARY CARD */}
                                <div className="bg-muted/50 rounded-xl p-6 border border-muted-foreground/10 flex flex-col gap-0">
                                        <h3 className="text-base font-semibold text-foreground mb-4 border-b pb-2 border-muted-foreground/20">
                                                Current Booking Details
                                        </h3>

                                        {/* Booking Type Row */}
                                        <div className="flex justify-between items-center text-sm py-2 border-b border-muted-foreground/10">
                                                <span className="text-muted-foreground">Booking Type</span>
                                                <span className="font-medium text-foreground">{bt?.title ?? ""}</span>
                                        </div>

                                        {/* Employee Row */}
                                        <div className="flex justify-between items-center text-sm py-2 border-b border-muted-foreground/10">
                                                <span className="text-muted-foreground">Employee</span>
                                                <span className="font-medium text-foreground">
                                                        {e?.name ?? ""} {e?.surname ?? ""}
                                                </span>
                                        </div>

                                        {/* Date & Time Row (Highlighted) */}
                                        <div className="flex justify-between items-center text-sm pt-2">
                                                <span className="text-muted-foreground">Date & Time</span>
                                                <span className="font-medium text-primary">
                                                        {format(new Date(typedData?.startDate ?? 0), "dd MMM yyyy HH:mm")}
                                                </span>
                                        </div>
                                </div>
                                {/* END CARD */}
                                <BookingCalendar reschedule={true} />
                        </div>

                </>
        );
}
