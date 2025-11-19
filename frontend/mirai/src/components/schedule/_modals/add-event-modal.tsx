import React from "react";
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
import { deleteAvailabilitySlot, postAvailabilitySlot, putAvailabilitySlot } from "@/api/availability";
import { toast } from "sonner";
import type { PostAvailabilitySlotResponse, PutAvailabilitySlotResponse } from "@/types/booking";
import { postCancellation } from "@/api/bookings";
import { format } from "date-fns";


export default function AddEventModal({
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
                                                        startDate: typedData.default.startDate,
                                                        endDate: typedData.default.endDate,
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

export function EditEventModal({
        CustomAddEventModal,
}: {
        CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
        const { setClose, data } = useModal();
        const { handlers, typeOptions, employeeOptions } = useScheduler();

        const typedData = data as { default: Event };

        const {
                register,
                handleSubmit,
                formState: { errors },
                setValue,
                watch,
        } = useForm<EventFormData>({
                resolver: zodResolver(eventSchema),
                defaultValues: {
                        startDate: getNearest30MinuteBlock(typedData.default.startDate),
                        endDate: getNearest30MinuteBlock(typedData.default.endDate),
                        type: typeOptions.find((t) => t.id == typedData.default.typeId),
                        employee: employeeOptions.find((e) => e.id == typedData.default.employeeId),
                },
        });
        const selectedType = watch("type");
        const selectedEmployee = watch("employee");

        // Reset the form on initialization

        const onSubmit: SubmitHandler<EventFormData> = async (formData) => {
                try {
                        const res: PutAvailabilitySlotResponse = await putAvailabilitySlot({
                                availability_slot_ids: typedData.default.availability_slot_ids ?? [],
                                employee_id: formData.employee.id,
                                start_time: toLocalISOString(formData.startDate),
                                end_time: toLocalISOString(formData.endDate),
                                type_id: formData.type.id,
                        })

                        const updatedEvent: Event = {
                                id: typedData.default.id,
                                availability_slot_ids: res.availability_slot_ids ?? [],
                                startDate: formData.startDate,
                                endDate: formData.endDate,
                                typeId: formData.type.id,
                                isBooking: false,
                                bookingId: null,
                                bookingEmail: null,
                                employeeId: formData.employee.id,
                        }


                        handlers.handleUpdateEvent(updatedEvent, updatedEvent.id);
                        setClose(); // Close the modal after submission
                } catch (error) {
                        toast(`edit failed: ${error}. Ensure there are no bookings spanning the slot`)

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
                                                        startDate: typedData.default.startDate || getNearest30MinuteBlock(new Date()),
                                                        endDate: typedData.default.endDate || getNearest30MinuteBlock(new Date()),
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
                                                <Button type="submit">Edit Event</Button>
                                        </div>
                                </>
                        )}
                </form>
        );
}

export function DeleteEventModal() {
        const { setClose, data } = useModal();
        const { handlers, typeOptions, employeeOptions } = useScheduler();

        const typedData = data as { default: Event };
        const date = format(typedData.default.startDate ?? 0, "dd MMM yyyy") ?? ""
        const startTime = format(typedData.default.startDate ?? 0, "HH:mm") ?? ""
        const endTime = format(typedData.default.endDate ?? 0, "HH:mm") ?? ""
        const typeOption = typeOptions.find((t) => t.id === typedData.default.typeId)
        const type = typeOption?.label ?? ""
        const employeeOption = employeeOptions.find((e) => e.id === typedData.default.employeeId)
        const employee = employeeOption?.label ?? ""
        const bookingEmail = typedData.default.bookingEmail ?? ""

        const onSubmit = async () => {
                try {
                        if (!typedData.default.isBooking) {
                                await deleteAvailabilitySlot({ availability_slot_ids: typedData.default.availability_slot_ids ?? [] });
                        } else {
                                await postCancellation(typedData.default.bookingId ?? -1);
                        }
                        handlers.handleDeleteEvent(typedData.default.id);
                        setClose(); // Close the modal after submission
                } catch (error) {
                        toast(`delete/cancel failed: ${error}. Ensure there are no bookings spanning the slot`)
                }
        };

        return (
                <div className="flex flex-col gap-4 p-4" >
                        <div className="grid gap-6 py-2">
                                <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Date</span>
                                                <span className="font-medium">{date}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Type</span>
                                                <span className="font-medium">
                                                        {type}
                                                </span >
                                        </div>
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Start Time</span>
                                                <span className="font-medium">
                                                        {startTime}
                                                </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">End Time</span>
                                                <span className="font-medium">
                                                        {endTime}
                                                </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Employee</span>
                                                <span className="font-medium">{
                                                        employee
                                                }</span >
                                        </div>
                                        <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Type</span>
                                                <span className="font-medium">
                                                        {type}
                                                </span >
                                        </div>
                                        {typedData.default.isBooking && (
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Booking Email</span>
                                                        <span className="font-medium">
                                                                {bookingEmail}
                                                        </span >
                                                </div>
                                        )}
                                </div>
                        </div>

                        <div className="flex justify-end space-x-2 mt-4 pt-2 border-t">
                                <Button variant="outline" type="button" onClick={() => setClose()}>
                                        Cancel
                                </Button>
                                <Button onClick={() => onSubmit()}> {typedData.default.isBooking ? ("Cancel Booking") : ("Delete Availability")}</Button>
                        </div>
                </div>
        )
}
