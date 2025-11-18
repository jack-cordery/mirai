import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import TimeSelection from "@/components/time-selection"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { type AvailabilitySlot, displayTime, timeToValue, type BookingType, type SelectedTimes, type TimeOfDay, valueToTime, datetimeToTime, type SlotTimeOfDay, type Employee } from "@/types/booking"
import { generateOptionsFromSlots, getCost, loadWorkingDayTimes } from "@/lib/utils"
import { getAllBookingTypes } from "@/api/booking-type"
import { getAllAvailability, getAllFreeAvailability } from "@/api/availability"
import { toast } from "sonner"
import { Dialog, DialogClose } from "@radix-ui/react-dialog"
import { DialogContent, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from "./ui/dialog"
import { format } from "date-fns"
import { postBooking } from "@/api/bookings"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { getAllEmployees } from "@/api/employee"

export default function BookingCalendar() {

        const unit = 30

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
        const [employees, setEmployees] = React.useState<Employee[]>([])
        const [availabilitySlots, setAvailabilitySlots] = React.useState<AvailabilitySlot[]>([])
        const [selectedBookingType, setSelectedBookingType] = React.useState<BookingType | null>(null)
        const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)

        const [isBookingModalOpen, setIsBookingModalOpen] = React.useState<boolean>(false);

        const handleChange = (times: SelectedTimes) => { setSelectedTimes(times) }
        const navigate = useNavigate();

        const timeSlots = React.useMemo(() => {
                if (!date) {
                        return []
                }
                const slots = generateOptionsFromSlots(
                        selectedTimes.startTime ? selectedTimes.startTime : startTime,
                        selectedTimes.endTime ? selectedTimes.endTime : endTime,
                        availabilitySlots.filter((a) => a.type_id === selectedBookingType?.type_id), date);
                return slots.filter((s) => s.duration >= (selectedBookingType?.duration ?? 0));
        }, [selectedTimes, availabilitySlots, date, selectedBookingType])

        const bookedDates = React.useMemo(() => {
                const dates: Date[] = [];
                const slots = generateOptionsFromSlots(
                        selectedTimes.startTime ? selectedTimes.startTime : startTime,
                        selectedTimes.endTime ? selectedTimes.endTime : endTime,
                        availabilitySlots.filter((a) => a.type_id === selectedBookingType?.type_id), date);
                const filteredSlots = slots.filter((s) => s.duration >= (selectedBookingType?.duration ?? 0)).map((a) => a.id);
                const aSlots = availabilitySlots.filter((a) => filteredSlots.includes(a.availability_slot_id)).filter((a) => a.type_id === selectedBookingType?.type_id).filter((a) => {
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
        }, [availabilitySlots, selectedTimes, selectedBookingType])

        React.useEffect(() => {
                const fetchData = async () => {
                        try {
                                const [resBookingTypes, resAvailabilitySlots, resEmployees] = await Promise.all([getAllBookingTypes(), getAllFreeAvailability(), getAllEmployees()])
                                setBookingTypes(resBookingTypes)
                                setEmployees(resEmployees)
                                setAvailabilitySlots(resAvailabilitySlots)
                                setSelectedBookingType(resBookingTypes[0])
                                setSelectedEmployee(resEmployees[0])
                        } catch (err) {
                                toast(`error fetching data ${err}`)
                        }
                }
                fetchData()
        }, [])


        const handleConfirmBooking = async () => {
                const userId = user?.id;
                const slotId = selectedTime?.id;
                const otherIds = selectedTime?.slotIDs ?? [];
                const typeId = selectedBookingType?.type_id;
                try {
                        if (userId === undefined || typeId === undefined || slotId === undefined) {
                                throw new Error("invalid inputs")
                        }
                        const slotIds = [slotId, ...otherIds.slice(0, (selectedBookingType?.duration ?? 1) - 1)]
                        await postBooking({
                                user_id: userId,
                                availability_slots: slotIds,
                                type_id: typeId,
                                notes: "",
                        })
                        setSelectedTime(null);
                        toast("booking created!")
                        setIsBookingModalOpen(false)
                        navigate("/user/bookings")
                } catch (err) {
                        toast("failed to confirm booking, please try again");
                }
        }

        return (
                <Card className="gap-0 p-4">
                        <CardContent className="relative p-0 md:pr-48">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
                                        {/* Booking Type */}
                                        <div className="flex flex-col md:flex-1">
                                                <label className="text-sm text-neutral-400 mb-1">Booking Type</label>
                                                <Select
                                                        value={selectedBookingType?.title || ""}
                                                        onValueChange={(title) => {
                                                                const type = bookingTypes.find(t => t.title === title) || null;
                                                                setSelectedBookingType(type);
                                                        }}
                                                >
                                                        <SelectTrigger className="">
                                                                <SelectValue placeholder="Select Booking Type" />
                                                        </SelectTrigger>
                                                        <SelectContent className="">
                                                                <SelectGroup>
                                                                        {bookingTypes.map(b => (
                                                                                <SelectItem
                                                                                        key={b.title}
                                                                                        value={b.title}
                                                                                        className=""
                                                                                >
                                                                                        {b.title}
                                                                                </SelectItem>
                                                                        ))}
                                                                </SelectGroup>
                                                        </SelectContent>
                                                </Select>
                                        </div>

                                        {/* Employee */}
                                        <div className="flex flex-col md:flex-1">
                                                <label className="text-sm text-neutral-400 mb-1">Employee</label>
                                                <Select
                                                        value={selectedEmployee?.employee_id?.toString() ?? ""}
                                                        onValueChange={(id) => {
                                                                const employee = employees.find(e => e.employee_id === Number(id)) || null;
                                                                setSelectedEmployee(employee);
                                                        }}
                                                >
                                                        <SelectTrigger className="">
                                                                <SelectValue placeholder="Select Employee" />
                                                        </SelectTrigger>
                                                        <SelectContent className="">
                                                                <SelectGroup>
                                                                        {employees.map(e => (
                                                                                <SelectItem
                                                                                        key={e.employee_id}
                                                                                        value={e.employee_id.toString()}
                                                                                        className="hover:bg-neutral-700 transition"
                                                                                >
                                                                                        {e.name[0].toUpperCase() + e.name.slice(1).toLowerCase()}{" "}
                                                                                        {e.surname[0].toUpperCase() + e.surname.slice(1).toLowerCase()}
                                                                                </SelectItem>
                                                                        ))}
                                                                </SelectGroup>
                                                        </SelectContent>
                                                </Select>
                                        </div>

                                        {/* Time Selection */}
                                        <div className="flex flex-col mr-4 md:flex-1">
                                                <label className="text-sm text-neutral-400 mb-1">Time Slot</label>

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
                                <div className="text-sm max-w-full md:max-w-[500px] break-words">
                                        {date && selectedTime && selectedEmployee ? (
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
                                                        with {
                                                                (selectedEmployee?.name[0].toUpperCase() || "")
                                                                + selectedEmployee?.name.substring(1).toLowerCase()
                                                                + ' '
                                                                + selectedEmployee?.surname[0].toUpperCase()
                                                                + selectedEmployee?.surname.substring(1).toLowerCase()
                                                        }
                                                </>
                                        ) : (
                                                <>Select a date and time for your meeting.</>
                                        )}
                                </div>
                                <Button
                                        disabled={!date || !selectedTime || !selectedBookingType || !selectedEmployee}
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
                                                                <span className="text-muted-foreground">Type</span>
                                                                <span className="font-medium">
                                                                        {(selectedBookingType?.title ?? "")}
                                                                </span >
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Start Time</span>
                                                                <span className="font-medium">
                                                                        {selectedTime?.hour}:{selectedTime?.minute.toString().padStart(2, "0")}
                                                                </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Employee</span>
                                                                <span className="font-medium">{
                                                                        (selectedEmployee?.name[0].toUpperCase() || "")
                                                                        + selectedEmployee?.name.substring(1).toLowerCase()
                                                                        + ' '
                                                                        + selectedEmployee?.surname[0].toUpperCase()
                                                                        + selectedEmployee?.surname.substring(1).toLowerCase()
                                                                }</span >
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Duration</span>
                                                                <span className="font-medium">
                                                                        {(selectedBookingType?.duration ?? 0) * unit} minutes
                                                                </span >
                                                        </div>

                                                        <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Amount</span>
                                                                <span className="font-medium">£{((getCost(selectedBookingType, selectedBookingType?.duration ?? 0) ?? 0) / 100).toFixed(2)}</span >
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
                </Card >
        )
}
