import { getAllFreeAvailability } from "@/api/availability";
import { getAllBookingTypes } from "@/api/booking-type";
import { postReschedule, type GetAllBookingsResponse } from "@/api/bookings";
import { getAllEmployees } from "@/api/employee";
import { loadWorkingDayTimes } from "@/lib/utils";
import type { AvailabilitySlot, BookingType, Employee, SelectedTimes, SlotTimeOfDay } from "@/types/booking";
import React, { useContext, type ReactNode } from "react";
import { createContext } from "react";
import { toast } from "sonner";
import { useTableContext } from "./table-context";

type BookingCalendarContextType = {
        date: Date | undefined,
        setDate: React.Dispatch<React.SetStateAction<Date | undefined>>,
        bookingTypes: BookingType[],
        setBookingTypes: React.Dispatch<React.SetStateAction<BookingType[]>>,
        employees: Employee[],
        setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
        availabilitySlots: AvailabilitySlot[],
        setAvailabilitySlots: React.Dispatch<React.SetStateAction<AvailabilitySlot[]>>,
        selectedTime: SlotTimeOfDay | null,
        setSelectedTime: React.Dispatch<React.SetStateAction<SlotTimeOfDay | null>>,
        selectedTimes: SelectedTimes,
        setSelectedTimes: React.Dispatch<React.SetStateAction<SelectedTimes>>,
        selectedEmployee: Employee | null,
        setSelectedEmployee: React.Dispatch<React.SetStateAction<Employee | null>>,
        selectedBookingType: BookingType | null,
        setSelectedBookingType: React.Dispatch<React.SetStateAction<BookingType | null>>,
        isBookingModalOpen: boolean,
        setIsBookingModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
        isRescheduleModalOpen: boolean,
        setIsRescheduleModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
        rescheduleModalRow: GetAllBookingsResponse | null
        setRescheduleModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
        handleRescheduleBooking: () => Promise<void>;
}

const BookingCalendarContext = createContext<BookingCalendarContextType | undefined>(undefined);

type BookingCalendarProviderProps = {
        children: ReactNode,
}

export const BookingCalendarProvider: React.FC<BookingCalendarProviderProps> = ({ children }: BookingCalendarProviderProps) => {
        const { slotDuration } = loadWorkingDayTimes();
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
        const [rescheduleModalRow, setRescheduleModalRow] = React.useState<GetAllBookingsResponse | null>(null);
        const [isRescheduleModalOpen, setIsRescheduleModalOpen] = React.useState<boolean>(false);
        const [isBookingModalOpen, setIsBookingModalOpen] = React.useState<boolean>(false);
        const { fetchTableData } = useTableContext();

        const handleRescheduleBooking = async () => {
                const startDate = new Date(date?.getTime() ?? 0);
                startDate.setHours(selectedTime?.hour ?? 0, selectedTime?.minute ?? 0, 0, 0)
                const durationMins = (selectedTime?.duration ?? 0) * slotDuration
                const endDate = new Date(startDate.getTime())
                endDate.setMinutes(endDate.getMinutes() + durationMins)

                try {
                        await postReschedule(
                                rescheduleModalRow?.id ?? 0,
                                selectedEmployee?.employee_id ?? 0,
                                selectedBookingType?.type_id ?? 0,
                                rescheduleModalRow?.notes ?? "",
                                rescheduleModalRow?.paid ?? false,
                                startDate.toISOString(),
                                endDate.toISOString(),
                        )
                        setIsRescheduleModalOpen(false)
                        setIsBookingModalOpen(false)
                        fetchTableData()
                        toast("booking rescheduled!")
                } catch (err) {
                        toast("failed to reschedule booking, please try again");
                }
        }

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

        return (
                <BookingCalendarContext.Provider value={{
                        date,
                        setDate,
                        bookingTypes,
                        setBookingTypes,
                        employees,
                        setEmployees,
                        availabilitySlots,
                        setAvailabilitySlots,
                        selectedTime,
                        setSelectedTime,
                        selectedTimes,
                        setSelectedTimes,
                        selectedEmployee,
                        setSelectedEmployee,
                        selectedBookingType,
                        setSelectedBookingType,
                        isBookingModalOpen,
                        setIsBookingModalOpen,
                        isRescheduleModalOpen,
                        setIsRescheduleModalOpen,
                        rescheduleModalRow,
                        setRescheduleModalRow,
                        handleRescheduleBooking,
                }} >
                        {children}
                </BookingCalendarContext.Provider >

        )
}

export const useBookingCalendarContext = () => {
        const context = useContext(BookingCalendarContext)

        if (!context) {
                throw new Error("useBookingCalendarContext must be used within a BookingCalendarProvider");
        }
        return context;
}


