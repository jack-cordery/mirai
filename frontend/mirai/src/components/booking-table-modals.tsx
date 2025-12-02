import { postCancellation, postComplete, postConfirm, postManualPayment, postReschedule } from "@/api/bookings";
import { Button } from "@/components/ui/button"
import {
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTableContext } from "@/contexts/table-context";
import { format } from "date-fns";
import { toast } from "sonner";
import BookingCalendar from "./booking-calendar";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { generateOptionsFromSlots, getCost, loadWorkingDayTimes } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import React from "react";
import { datetimeToTime, displayTime, timeToValue, type AvailabilitySlot, type BookingType, type Employee, type SelectedTimes, type SlotTimeOfDay } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { getAllBookingTypes } from "@/api/booking-type";
import { getAllFreeAvailability } from "@/api/availability";
import { getAllEmployees } from "@/api/employee";
import TimeSelection from "./time-selection";
import { Calendar } from "@/components/ui/calendar"
import CustomModal from "./ui/custom-modal";
import AddEventModal from "./schedule/_modals/add-event-modal";
import { BookingCalendarProvider, useBookingCalendarContext } from "@/contexts/booking-calendar-context";

export function PaidModal() {
        const { isPaidModalOpen, setIsPaidModalOpen, paidModalRow, fetchTableData } = useTableContext();

        const handleManualPayment = async () => {
                const booking_id = paidModalRow?.id;
                if (booking_id === undefined) {
                        toast("no row was select for manual payment");
                        return
                }
                try {
                        await postManualPayment(booking_id)
                        fetchTableData()
                        toast("manual payment accepted");
                        setIsPaidModalOpen(false);

                } catch (err) {
                        toast("manual payment failed, please try again");
                }
        }

        return (
                <Dialog open={isPaidModalOpen} onOpenChange={setIsPaidModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually set Payment</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{paidModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((paidModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(paidModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently record a manual payment in the system.
                                                Make sure you have verified the payment (cash, bank transfer, etc).
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleManualPayment}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}

export function CancelModal() {
        const { isCancelModalOpen, setBookingData, setIsCancelModalOpen, cancelModalRow } = useTableContext();

        const handleCancel = async () => {
                const booking_id = cancelModalRow?.id;
                if (booking_id === undefined) {
                        toast("no row was select for manual cancellation");
                        return
                }
                try {
                        await postCancellation(booking_id)
                        setBookingData(prev => prev.map(row =>
                                row.id === booking_id ? { ...row, status: "cancelled" } : row
                        ));
                        toast("cancellation accepted");
                        setIsCancelModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("manual cancellation failed, please try again");
                }
        }

        return (
                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Cancel</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{cancelModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((cancelModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(cancelModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently cancel a booking in the system.
                                                Make sure you have notified the customer.
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleCancel}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}

export function ConfirmModal() {
        const { isConfirmModalOpen, setIsConfirmModalOpen, confirmModalRow, fetchTableData } = useTableContext();

        const handleConfirm = async () => {
                const booking_id = confirmModalRow?.id;
                if (booking_id === undefined) {
                        toast("no row was select for manual confirmation");
                        return
                }
                try {
                        await postConfirm(booking_id)
                        fetchTableData();
                        toast("confirmation accepted");
                        setIsConfirmModalOpen(false);

                } catch (err) {
                        console.log(err);
                        toast("manual confirmation failed, please try again");
                }
        }

        return (
                <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Confirm</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{confirmModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((confirmModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(confirmModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently confirm a booking in the system.
                                                Make sure you have notified the customer.
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleConfirm}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}

export function CompleteModal() {
        const { isCompleteModalOpen, setIsCompleteModalOpen, completeModalRow, fetchTableData } = useTableContext();

        const handleComplete = async () => {
                const booking_id = completeModalRow?.id;
                if (booking_id === undefined) {
                        toast("no row was select for manual confirmation");
                        return
                }
                try {
                        await postComplete(booking_id)
                        fetchTableData()
                        toast("completion accepted");
                        setIsCompleteModalOpen(false);

                } catch (err) {
                        toast("manual completion failed, please try again");
                }
        }

        return (
                <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                        <DialogTitle>Manually Complete</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-6 py-2">
                                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Customer</span>
                                                        <span className="font-medium">{completeModalRow?.user_email}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-medium">£{((completeModalRow?.cost ?? 0) / 100).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Date</span>
                                                        <span className="font-medium">
                                                                {format(new Date(completeModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground">
                                                This will permanently complete a booking in the system.
                                                Make sure you have notified the customer.
                                        </p>
                                </div>
                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <Button type="button" onClick={handleComplete}>Confirm</Button>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}

// TODO: booking calendar needs to be abstracted so that i can have a reschedule version
// all that would be different is the confirm logic     
export function RescheduleModal() {
        const { isRescheduleModalOpen, setIsRescheduleModalOpen, rescheduleModalRow } = useBookingCalendarContext();
        const { date, selectedEmployee, selectedBookingType, selectedTime, setIsBookingModalOpen } = useBookingCalendarContext();

        return (
                <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
                        <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <DialogContent className="sm:max-w-[90vh] overflow-y-auto max-h-[90vh]">
                                <DialogHeader>
                                        <DialogTitle>Reschedule Booking</DialogTitle>
                                </DialogHeader>

                                <div className="grid gap-6 py-2">

                                        {/* 📋 CURRENT BOOKING SUMMARY CARD */}
                                        <div className="bg-muted/50 rounded-xl p-6 border border-muted-foreground/10 flex flex-col gap-0">
                                                <h3 className="text-base font-semibold text-foreground mb-4 border-b pb-2 border-muted-foreground/20">
                                                        Current Booking Details
                                                </h3>

                                                {/* Booking Type Row */}
                                                <div className="flex justify-between items-center text-sm py-2 border-b border-muted-foreground/10">
                                                        <span className="text-muted-foreground">Booking Type</span>
                                                        <span className="font-medium text-foreground">{rescheduleModalRow?.type_title}</span>
                                                </div>

                                                {/* Employee Row */}
                                                <div className="flex justify-between items-center text-sm py-2 border-b border-muted-foreground/10">
                                                        <span className="text-muted-foreground">Employee</span>
                                                        <span className="font-medium text-foreground">
                                                                {rescheduleModalRow?.employee_name} {rescheduleModalRow?.employee_surname}
                                                        </span>
                                                </div>

                                                {/* Date & Time Row (Highlighted) */}
                                                <div className="flex justify-between items-center text-sm pt-2">
                                                        <span className="text-muted-foreground">Date & Time</span>
                                                        <span className="font-medium text-primary">
                                                                {format(new Date(rescheduleModalRow?.start_time ?? 0), "dd MMM yyyy HH:mm")}
                                                        </span>
                                                </div>
                                        </div>
                                        {/* END CARD */}
                                        <BookingCalendar reschedule={true} />
                                </div>

                                <DialogFooter>
                                        <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                </DialogFooter>
                        </DialogContent>
                </Dialog>
        )
}
