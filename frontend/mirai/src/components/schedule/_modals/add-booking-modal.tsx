import React, { useEffect, useState } from "react";
import { useScheduler } from "@/providers/schedular-provider";
import type { User } from "@/types/booking";
import BookingCalendar from "@/components/booking-calendar";
import { useBookingCalendarContext } from "@/contexts/booking-calendar-context";
import { format } from "date-fns";

export default function AddBookingModal() {
        const { users } = useBookingCalendarContext();
        const [user, setUser] = useState<User | null>(null);
        const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
                const selectedId = e.target.value;
                const selectedUser = users.find(u => u.user_id.toString() === selectedId) ?? null;
                setUser(selectedUser);
        };

        return (
                <div className="grid gap-6 py-2">
                        {/* 📋 User Selection Dropdown */}
                        <div className="bg-muted/50 rounded-xl p-4 border border-muted-foreground/10">
                                <label className="block text-sm text-muted-foreground mb-1">
                                        Select User
                                </label>
                                <select
                                        className="w-full p-2 rounded-md bg-neutral-900 text-foreground"
                                        value={user?.user_id ?? ""}
                                        onChange={handleChange}
                                >
                                        <option value="" disabled>
                                                Choose a User
                                        </option>
                                        {users.map(u => (
                                                <option key={u.user_id} value={u.user_id}>
                                                        {u.name} {u.surname} ({u.email})
                                                </option>
                                        ))}
                                </select>
                        </div>

                        {/* 📅 Booking Calendar */}
                        <BookingCalendar userID={user?.user_id ?? undefined} skipNav={true} />
                </div>
        );
}

export function EditBookingModal({
        bookingID,
}: {
        bookingID: number;
}) {

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
