import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import TimeSelection from "@/components/time-selection"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { type AvailabilitySlot, displayTime, timeToValue, type BookingType, type SelectedTimes, type TimeOfDay, valueToTime, datetimeToTime, type SlotTimeOfDay } from "@/types/booking"
import { generateOptionsFromSlots, loadWorkingDayTimes } from "@/lib/utils"
import { getAllBookingTypes } from "@/api/booking-type"
import { getAllAvailability } from "@/api/availability"
import { toast } from "sonner"
import { Dialog, DialogClose } from "@radix-ui/react-dialog"
import { DialogContent, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from "./ui/dialog"
import { format } from "date-fns"
import { postBooking } from "@/api/bookings"
import { useAuth } from "@/contexts/auth-context"

export default function BookingCalendar() {

        const { startTime, endTime } = loadWorkingDayTimes()
        const { user } = useAuth();
        const today = new Date()

        const [date, setDate] = React.useState<Date | undefined>(
                new Date()
        );
        const [selectedTime, setSelectedTime] = React.useState<SlotTimeOfDay | null>(null)
        const [selectedTimes, setSelectedTimes] = React.useState<SelectedTimes>({
                startTime: null,
                endTime: null
        });
        const [bookingTypes, setBookingTypes] = React.useState<BookingType[]>([])
        const [availabilitySlots, setAvailabilitySlots] = React.useState<AvailabilitySlot[]>([])
        const [selectedBookingType, setSelectedBookingType] = React.useState<BookingType | null>(null)

        const [isBookingModalOpen, setIsBookingModalOpen] = React.useState<boolean>(false);

        const handleChange = (times: SelectedTimes) => { setSelectedTimes(times) }

        const timeSlots = React.useMemo(() => {
                if (!date) {
                        return []
                }
                const slots = generateOptionsFromSlots(
                        selectedTimes.startTime ? selectedTimes.startTime : startTime,
                        selectedTimes.endTime ? selectedTimes.endTime : endTime,
                        availabilitySlots, date);
                return slots
        }, [selectedTimes, availabilitySlots, date])

        const bookedDates = React.useMemo(() => {
                const dates: Date[] = [];
                const aSlots = availabilitySlots.filter((a) => {
                        const opt = datetimeToTime(a.datetime)
                        const start = selectedTimes.startTime
                        const end = selectedTimes.endTime
                        if (!opt) {
                                return false
                        }

                        if (start) {
                                if (opt.hour < start.hour) return false;
                                if (opt.hour === start.hour && opt.minute < start.minute) return false;
                        }

                        if (end) {
                                if (opt.hour > end.hour) return false;
                                if (opt.hour === end.hour && opt.minute > end.minute) return false;
                        }
                        return true;
                });

                const uniqueDates = Array.from(
                        new Set(aSlots.map(slot => new Date(slot.datetime).toISOString().split("T")[0]))
                );

                const current = new Date();
                const future = new Date();
                future.setFullYear(current.getFullYear() + 1)

                while (current <= future) {
                        dates.push(new Date(current));
                        current.setDate(current.getDate() + 1);
                }
                const booked = dates.filter(d => {
                        return !uniqueDates.includes(d.toISOString().split("T")[0])
                })
                return booked
        }, [availabilitySlots, selectedTimes])

        React.useEffect(() => {
                const fetchData = async () => {
                        try {
                                const [resBookingTypes, resAvailabilitySlots] = await Promise.all([getAllBookingTypes(), getAllAvailability()])
                                setBookingTypes(resBookingTypes)
                                setAvailabilitySlots(resAvailabilitySlots)
                        } catch (err) {
                                toast(`error fetching data ${err}`)
                        }
                }
                fetchData()
        }, [])


        const handleConfirmBooking = async () => {
                const user_id = user?.id;
                const slot_ids = selectedTime?.id ? [selectedTime.id] : [];
                const type_id = selectedBookingType?.type_id;
                try {
                        if (user_id === undefined || type_id === undefined) {
                                throw new Error("invalid inputs")
                        }
                        const res = await postBooking({
                                user_id,
                                availability_slots: slot_ids,
                                type_id,
                                notes: "",
                        })
                        setSelectedTime(null);
                        toast("booking created!")
                        setIsBookingModalOpen(false)

                } catch (err) {
                        toast("failed to confirm booking, please try again");
                }
        }

        return (
                <Card className="gap-0 p-0">
                        <CardContent className="relative p-0 md:pr-48">
                                <div className="flex flex-col border-b">
                                        <div className="flex border-b p-4 flex-row  gap-2">
                                                <h1>
                                                        Select Booking Type
                                                </h1>
                                                <Select
                                                        value={selectedBookingType?.title ? selectedBookingType.title : ""}
                                                        onValueChange={(title) => {
                                                                const type = bookingTypes.find(t => t.title === title) || null;
                                                                setSelectedBookingType(type);
                                                        }}
                                                >
                                                        <SelectTrigger className="w-[180px]">
                                                                <SelectValue placeholder="Booking Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                                <SelectGroup>
                                                                        {bookingTypes.map((b) => (
                                                                                <SelectItem key={b.title} value={b.title}  >
                                                                                        {b.title}
                                                                                </SelectItem>
                                                                        ))}
                                                                </SelectGroup>
                                                        </SelectContent>
                                                </Select >

                                        </div>
                                        <div className="flex border-b p-4 flex-row items-center justify-center gap-2">
                                                <h1>
                                                        Show availabilily of a given time slot
                                                </h1>
                                                <TimeSelection
                                                        defaultStart={startTime}
                                                        defaultEnd={endTime}
                                                        selectedTimes={selectedTimes}
                                                        onChange={handleChange}
                                                />
                                        </div>
                                </div>
                                <div className="p-6 flex justify-center items-center">
                                        <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                defaultMonth={date}
                                                disabled={bookedDates}
                                                showOutsideDays={false}
                                                modifiers={{
                                                        booked: bookedDates,
                                                        past: (date: Date) => date < today,
                                                }}
                                                modifiersClassNames={{
                                                        booked: "[&>button]:line-through opacity-100",
                                                        past: "[&>button]:text-gray-400 pointer-events-none"
                                                }}
                                                className="bg-transparent p-0 [--cell-size:--spacing(10)] md:[--cell-size:--spacing(12)]"
                                                formatters={{
                                                        formatWeekdayName: (date) => {
                                                                return date.toLocaleString("en-US", { weekday: "short" })
                                                        },
                                                }}
                                        />
                                </div>
                                <div className="no-scrollbar inset-y-0 right-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-t-0 md:border-l">
                                        <div className="grid gap-2">
                                                {timeSlots.map((time) => (
                                                        <Button
                                                                key={displayTime(time)}
                                                                variant={selectedTime === time ? "default" : "outline"}
                                                                onClick={() => setSelectedTime(time)}
                                                                className="w-full shadow-none"
                                                        >
                                                                {displayTime(time)}
                                                        </Button>
                                                ))}
                                        </div>
                                </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 border-t px-6 !py-5 md:flex-row">
                                <div className="text-sm">
                                        {date && selectedTime ? (
                                                <>
                                                        Your current selection is for{" "}
                                                        <span className="font-medium">
                                                                {" "}
                                                                {date?.toLocaleDateString("en-US", {
                                                                        weekday: "long",
                                                                        day: "numeric",
                                                                        month: "long",
                                                                })}{" "}
                                                        </span>
                                                        at <span className="font-medium">{timeToValue(selectedTime)}</span> {" "}
                                                        for a {selectedBookingType?.title}
                                                </>
                                        ) : (
                                                <>Select a date and time for your meeting.</>
                                        )}
                                </div>
                                <Button
                                        disabled={!date || !selectedTime || !selectedBookingType}
                                        className="w-full md:ml-auto md:w-auto"
                                        variant="outline"
                                        onClick={() => setIsBookingModalOpen(true)}
                                >
                                        Continue
                                </Button>
                        </CardFooter>
                        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
                                <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                                <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                                <DialogTitle>Confirm Booking</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-6 py-2">
                                                <div className="bg-muted/50 rounded-lg p-4 flex flex-col gap-3">
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Date</span>
                                                                <span className="font-medium">{format(date ?? 0, "dd MMM yyyy")}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Start Time</span>
                                                                <span className="font-medium">
                                                                        {selectedTime?.hour}:{selectedTime?.minute.toString().padStart(2, "0")}
                                                                </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Amount</span>
                                                                <span className="font-medium">£{((selectedBookingType?.cost ?? 0) / 100).toFixed(2)}</span >
                                                        </div>
                                                </div>
                                        </div>
                                        <DialogFooter>
                                                <DialogClose asChild>
                                                        <Button variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button type="button" onClick={handleConfirmBooking}>Confirm</Button>
                                        </DialogFooter>
                                </DialogContent>

                        </Dialog>
                </Card>
        )
}
