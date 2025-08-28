import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import TimeSelection from "@/components/time-selection"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select"
import { type AvailabilitySlot, displayTime, timeToValue, type BookingType, type SelectedTimes, type TimeOfDay, valueToTime, datetimeToTime } from "@/types/booking"
import { generateOptionsFromSlots, loadWorkingDayTimes } from "@/lib/utils"
import { getAllBookingTypes } from "@/api/booking-type"
import { getAllAvailability } from "@/api/availability"

export default function BookingCalendar() {

        const { startTime, endTime } = loadWorkingDayTimes()
        const today = new Date()

        const [date, setDate] = React.useState<Date | undefined>(
                new Date()
        );
        const [selectedTime, setSelectedTime] = React.useState<TimeOfDay | null>(null)
        const [selectedTimes, setSelectedTimes] = React.useState<SelectedTimes>({
                startTime: null,
                endTime: null
        });
        const [bookingTypes, setBookingTypes] = React.useState<BookingType[]>([])
        const [availabilitySlots, setAvailabilitySlots] = React.useState<AvailabilitySlot[]>([])
        const [selectedBookingType, setSelectedBookingType] = React.useState<string | null>(null)

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
                                console.log(`error fetching data ${err}`)

                        }
                }
                fetchData()
        }, [])

        return (
                <Card className="gap-0 p-0">
                        <CardContent className="relative p-0 md:pr-48">
                                <div className="flex flex-col border-b">
                                        <div className="flex border-b p-4 flex-row  gap-2">
                                                <h1>
                                                        Select Booking Type
                                                </h1>
                                                <Select
                                                        value={selectedBookingType ? selectedBookingType : ""}
                                                        onValueChange={setSelectedBookingType}
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
                                                        for a {selectedBookingType}
                                                </>
                                        ) : (
                                                <>Select a date and time for your meeting.</>
                                        )}
                                </div>
                                <Button
                                        disabled={!date || !selectedTime}
                                        className="w-full md:ml-auto md:w-auto"
                                        variant="outline"
                                >
                                        Continue
                                </Button>
                        </CardFooter>
                </Card>
        )
}
