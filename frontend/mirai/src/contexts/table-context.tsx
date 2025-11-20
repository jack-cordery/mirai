import { getAllRequests } from "@/api/auth";
import { getAllBookingTypes, type GetBookingTypeResponse } from "@/api/booking-type";
import { getAllBookings, type GetAllBookingsResponse } from "@/api/bookings";
import { getAllEmployees, type GetEmployeeResponse } from "@/api/employee";
import type { GetAllRequestsResponse } from "@/types/user";
import React, { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

type TableContextType = {
        numPending: number;
        setNumPending: React.Dispatch<React.SetStateAction<number>>;
        requestData: GetAllRequestsResponse[];
        setRequestData: React.Dispatch<React.SetStateAction<GetAllRequestsResponse[]>>;
        bookingData: GetAllBookingsResponse[];
        setBookingData: React.Dispatch<React.SetStateAction<GetAllBookingsResponse[]>>;
        employeeData: GetEmployeeResponse[];
        setEmployeeData: React.Dispatch<React.SetStateAction<GetEmployeeResponse[]>>;
        bookingTypeData: GetBookingTypeResponse[];
        setBookingTypeData: React.Dispatch<React.SetStateAction<GetBookingTypeResponse[]>>;
        isPaidModalOpen: boolean;
        setIsPaidModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isCancelModalOpen: boolean;
        setIsCancelModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isConfirmModalOpen: boolean;
        setIsConfirmModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isCompleteModalOpen: boolean;
        setIsCompleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isEmployeeEditModalOpen: boolean;
        setIsEmployeeEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isEmployeeDeleteModalOpen: boolean;
        setIsEmployeeDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isBookingTypeEditModalOpen: boolean;
        setIsBookingTypeEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        isBookingTypeDeleteModalOpen: boolean;
        setIsBookingTypeDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        paidModalRow: GetAllBookingsResponse | null
        setPaidModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
        cancelModalRow: GetAllBookingsResponse | null
        setCancelModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
        confirmModalRow: GetAllBookingsResponse | null
        setConfirmModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
        completeModalRow: GetAllBookingsResponse | null
        setCompleteModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
        employeeEditModalRow: GetEmployeeResponse | null
        setEmployeeEditModalRow: React.Dispatch<React.SetStateAction<GetEmployeeResponse | null>>;
        employeeDeleteModalRow: GetEmployeeResponse | null
        setEmployeeDeleteModalRow: React.Dispatch<React.SetStateAction<GetEmployeeResponse | null>>;
        bookingTypeEditModalRow: GetBookingTypeResponse | null
        setBookingTypeEditModalRow: React.Dispatch<React.SetStateAction<GetBookingTypeResponse | null>>;
        bookingTypeDeleteModalRow: GetBookingTypeResponse | null
        setBookingTypeDeleteModalRow: React.Dispatch<React.SetStateAction<GetBookingTypeResponse | null>>;
        fetchTableData: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

type TableProviderProps = {
        children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
        const [numPending, setNumPending] = useState(0);
        const [requestData, setRequestData] = React.useState<GetAllRequestsResponse[]>([]);
        const [bookingData, setBookingData] = React.useState<GetAllBookingsResponse[]>([]);
        const [employeeData, setEmployeeData] = React.useState<GetEmployeeResponse[]>([]);
        const [bookingTypeData, setBookingTypeData] = React.useState<GetBookingTypeResponse[]>([]);
        const [isPaidModalOpen, setIsPaidModalOpen] = React.useState<boolean>(false);
        const [isCancelModalOpen, setIsCancelModalOpen] = React.useState<boolean>(false);
        const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState<boolean>(false);
        const [isCompleteModalOpen, setIsCompleteModalOpen] = React.useState<boolean>(false);
        const [isEmployeeEditModalOpen, setIsEmployeeEditModalOpen] = React.useState<boolean>(false);
        const [isEmployeeDeleteModalOpen, setIsEmployeeDeleteModalOpen] = React.useState<boolean>(false);
        const [isBookingTypeEditModalOpen, setIsBookingTypeEditModalOpen] = React.useState<boolean>(false);
        const [isBookingTypeDeleteModalOpen, setIsBookingTypeDeleteModalOpen] = React.useState<boolean>(false);
        const [paidModalRow, setPaidModalRow] = React.useState<GetAllBookingsResponse | null>(null);
        const [cancelModalRow, setCancelModalRow] = React.useState<GetAllBookingsResponse | null>(null);
        const [confirmModalRow, setConfirmModalRow] = React.useState<GetAllBookingsResponse | null>(null);
        const [completeModalRow, setCompleteModalRow] = React.useState<GetAllBookingsResponse | null>(null);
        const [employeeEditModalRow, setEmployeeEditModalRow] = React.useState<GetEmployeeResponse | null>(null);
        const [employeeDeleteModalRow, setEmployeeDeleteModalRow] = React.useState<GetEmployeeResponse | null>(null);
        const [bookingTypeEditModalRow, setBookingTypeEditModalRow] = React.useState<GetBookingTypeResponse | null>(null);
        const [bookingTypeDeleteModalRow, setBookingTypeDeleteModalRow] = React.useState<GetBookingTypeResponse | null>(null);

        const fetchTableData = async () => {
                try {
                        const [requestRes, bookingRes, employeeRes, bookingTypeRes]: [GetAllRequestsResponse[], GetAllBookingsResponse[], GetEmployeeResponse[], GetBookingTypeResponse[]]
                                = await Promise.all(
                                        [getAllRequests(), getAllBookings(), getAllEmployees(), getAllBookingTypes()]
                                );
                        setRequestData(requestRes ?? []);
                        setNumPending(requestData.filter(r => r.status === "PENDING").length);
                        setBookingData(bookingRes ?? []);
                        setEmployeeData(employeeRes ?? []);
                        setBookingTypeData(bookingTypeRes ?? []);
                } catch (err) {
                        toast("data fetch failed, please try again later")
                }

        }

        return (
                <TableContext.Provider value={{
                        numPending,
                        setNumPending,
                        requestData,
                        setRequestData,
                        bookingData,
                        setBookingData,
                        employeeData,
                        setEmployeeData,
                        bookingTypeData,
                        setBookingTypeData,
                        isPaidModalOpen,
                        setIsPaidModalOpen,
                        isCancelModalOpen,
                        setIsCancelModalOpen,
                        isConfirmModalOpen,
                        setIsConfirmModalOpen,
                        isCompleteModalOpen,
                        setIsCompleteModalOpen,
                        isEmployeeEditModalOpen,
                        setIsEmployeeEditModalOpen,
                        isEmployeeDeleteModalOpen,
                        setIsEmployeeDeleteModalOpen,
                        isBookingTypeEditModalOpen,
                        setIsBookingTypeEditModalOpen,
                        isBookingTypeDeleteModalOpen,
                        setIsBookingTypeDeleteModalOpen,
                        paidModalRow,
                        setPaidModalRow,
                        cancelModalRow,
                        setCancelModalRow,
                        confirmModalRow,
                        setConfirmModalRow,
                        completeModalRow,
                        setCompleteModalRow,
                        employeeEditModalRow,
                        setEmployeeEditModalRow,
                        employeeDeleteModalRow,
                        setEmployeeDeleteModalRow,
                        bookingTypeEditModalRow,
                        setBookingTypeEditModalRow,
                        bookingTypeDeleteModalRow,
                        setBookingTypeDeleteModalRow,
                        fetchTableData,
                }}>
                        {children}
                </TableContext.Provider>
        );
};

export const useTableContext = () => {
        const context = useContext(TableContext);
        if (!context) {
                throw new Error("useTableContext must be used within a TableProvider");
        }
        return context;
};
