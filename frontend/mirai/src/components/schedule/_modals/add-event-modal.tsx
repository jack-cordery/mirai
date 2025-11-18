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
import { postAvailabilitySlot, putAvailabilitySlot } from "@/api/availability";
import { toast } from "sonner";
import type { PostAvailabilitySlotResponse, PutAvailabilitySlotResponse } from "@/types/booking";


export default function AddEventModal({
        CustomAddEventModal,
}: {
        CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
        const { setClose } = useModal();
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
                        startDate: getNearest30MinuteBlock(currentDate),
                        endDate: getNearest30MinuteBlock(currentDate),
                        type: typeOptions[0],
                        employee: selectedEmployeeAvailability || employeeOptions[0],
                },
        });
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
                                                        startDate: getNearest30MinuteBlock(currentDate),
                                                        endDate: getNearest30MinuteBlock(currentDate),
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
