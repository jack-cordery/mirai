import { getAllRequests } from "@/api/auth";
import { getAllBookings, type GetAllBookingsResponse } from "@/api/bookings";
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
        isPaidModalOpen: boolean;
        setIsPaidModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
        paidModalRow: GetAllBookingsResponse | null
        setPaidModalRow: React.Dispatch<React.SetStateAction<GetAllBookingsResponse | null>>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

type TableProviderProps = {
        children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
        const [numPending, setNumPending] = useState(0);
        const [requestData, setRequestData] = React.useState<GetAllRequestsResponse[]>([]);
        const [bookingData, setBookingData] = React.useState<GetAllBookingsResponse[]>([]);
        const [isPaidModalOpen, setIsPaidModalOpen] = React.useState<boolean>(false);
        const [paidModalRow, setPaidModalRow] = React.useState<GetAllBookingsResponse | null>(null);

        const fetchData = async () => {
                try {
                        const [requestRes, bookingRes]: [GetAllRequestsResponse[], GetAllBookingsResponse[]]
                                = await Promise.all(
                                        [getAllRequests(), getAllBookings()]
                                );
                        setRequestData(requestRes);
                        setNumPending(requestRes.filter(r => r.status === "PENDING").length);
                        setBookingData(bookingRes);
                } catch (err) {
                        toast("data fetch failed, please try again later")
                }

        }
        React.useEffect(() => {
                fetchData();
        }, []);

        return (
                <TableContext.Provider value={{
                        numPending,
                        setNumPending,
                        requestData,
                        setRequestData,
                        bookingData,
                        setBookingData,
                        isPaidModalOpen,
                        setIsPaidModalOpen,
                        paidModalRow,
                        setPaidModalRow,
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
