import { getAllRequests } from "@/api/auth";
import type { GetAllRequestsResponse } from "@/types/user";
import React, { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

type TableContextType = {
        numPending: number;
        setNumPending: React.Dispatch<React.SetStateAction<number>>
        requestData: GetAllRequestsResponse[];
        setRequestData: React.Dispatch<React.SetStateAction<GetAllRequestsResponse[]>>
}

const TableContext = createContext<TableContextType | undefined>(undefined);

type TableProviderProps = {
        children: ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
        const [numPending, setNumPending] = useState(0);
        const [requestData, setRequestData] = React.useState<GetAllRequestsResponse[]>([]);
        const fetchData = async () => {
                try {
                        const res: GetAllRequestsResponse[] = await getAllRequests()
                        setRequestData(res)
                        setNumPending(res.filter(r => r.status === "PENDING").length)
                } catch (err) {
                        toast("data fetch failed, please try again later")
                }

        }
        React.useEffect(() => {
                fetchData();
        }, []);

        return (
                <TableContext.Provider value={{ numPending, setNumPending, requestData, setRequestData }}>
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
