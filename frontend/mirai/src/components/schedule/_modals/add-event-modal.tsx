"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useModal } from "@/providers/modal-context";
import SelectDate from "@/components/schedule/_components/add-event-components/select-date";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type EventFormData, eventSchema, type Event, type Option } from "@/types/index";
import { useScheduler } from "@/providers/schedular-provider";
import { v4 as uuidv4 } from 'uuid';
import { postAvailabilitySlot } from "@/api/availability";
import { toast } from "sonner";


export default function AddEventModal({
        CustomAddEventModal,
}: {
        CustomAddEventModal?: React.FC<{ register: any; errors: any }>;
}) {
        const { setClose, data } = useModal();
        const { handlers, typeOptions, employeeOptions, selectedEmployee, setSelectedEmployee, selectedType, setSelectedType } = useScheduler();

        const typedData = data as { default: Event };

        const {
                register,
                handleSubmit,
                reset,
                formState: { errors },
                setValue,
        } = useForm<EventFormData>({
                resolver: zodResolver(eventSchema),
                defaultValues: {
                        startDate: new Date(),
                        endDate: new Date(),
                        type: typeOptions[0],
                        employee: employeeOptions[0],
                },
        });

        // Reset the form on initialization
        useEffect(() => {
                if (data?.default) {
                        const eventData = data?.default;
                        reset({
                                startDate: eventData.startDate,
                                endDate: eventData.endDate,
                                type: typeOptions[0],
                                employee: employeeOptions[0],
                        });
                }
        }, [data, reset]);

        const onSubmit: SubmitHandler<EventFormData> = async (formData) => {
                const newEvent: Event = {
                        id: uuidv4().toString(),
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        employeeId: formData.employee.id,
                        typeId: formData.type.id,
                };
                // TODO:: call api and only on success handleAddEvent
                try {
                        const res = await postAvailabilitySlot({
                                employee_id: newEvent.employeeId,
                                start_time: newEvent.startDate.toString(),
                                end_time: newEvent.endDate.toString(),
                                type_id: newEvent.typeId,

                        })

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
                                                        startDate: data?.default?.startDate || new Date(),
                                                        endDate: data?.default?.endDate || new Date(),
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
                                                                                        setSelectedType(type);
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
                                                                                        setSelectedEmployee(employee);
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
