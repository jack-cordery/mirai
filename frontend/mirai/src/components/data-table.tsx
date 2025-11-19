import * as React from "react"
import {
        useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
        IconGripVertical,
} from "@tabler/icons-react"
import {
        flexRender,
} from "@tanstack/react-table"
import type {
        Row,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select"
import {
        TableCell,
        TableRow,
} from "@/components/ui/table"
import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
} from "@/components/ui/tabs"
import { postApprove, postReject } from "@/api/auth"
import type { GetAllRequestsResponse } from "@/types/user"
import { useTableContext } from "@/contexts/table-context"
import { BookingsTable } from "./bookings-table"
import { RequestDataSchema, RequestDataTable } from "./requests-table"

// Create a separate component for the drag handle
export function DragHandle({ id }: { id: number }) {
        const { attributes, listeners } = useSortable({
                id,
        })

        return (
                <Button
                        {...attributes}
                        {...listeners}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-7 hover:bg-transparent"
                >
                        <IconGripVertical className="text-muted-foreground size-3" />
                        <span className="sr-only">Drag to reorder</span>
                </Button>
        )
}

export function DraggableRow({ row }: { row: Row<z.infer<typeof RequestDataSchema>> }) {
        const { transform, transition, setNodeRef, isDragging } = useSortable({
                id: row.original.id,
        })

        return (
                <TableRow
                        data-state={row.getIsSelected() && "selected"}
                        data-dragging={isDragging}
                        ref={setNodeRef}
                        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
                        style={{
                                transform: CSS.Transform.toString(transform),
                                transition: transition,
                        }}
                >
                        {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                        ))}
                </TableRow>
        )
}

export async function handleApprove(
        requestID: number,
        setData: React.Dispatch<React.SetStateAction<GetAllRequestsResponse[]>>
) {
        try {
                const new_row: GetAllRequestsResponse = await postApprove(requestID)
                setData(prev => prev.map(row =>
                        row.id === requestID ? { ...new_row } : row
                ));
                return true
        } catch (err) {
                toast("approval failed, please try again or refresh your page")
                return false
        }

}
export async function handleReject(
        requestID: number,
        setData: React.Dispatch<React.SetStateAction<GetAllRequestsResponse[]>>
) {
        try {
                const new_row: GetAllRequestsResponse = await postReject(requestID)

                setData(prev => prev.map(row =>
                        row.id === requestID ? { ...new_row } : row
                ));
                return true
        } catch (err) {
                toast("rejection failed, please try again or refresh your page")
                return false
        }
}

export function DataTable() {
        const { numPending, fetchTableData } = useTableContext();

        React.useEffect(() => {
                const fetchData = async () => {
                        await fetchTableData();
                };

                fetchData();
        }, []);
        return (
                <Tabs
                        defaultValue="admin-requests"
                        className="w-full flex-col justify-start gap-6"
                >
                        <div className="flex items-center justify-between px-4 lg:px-6">
                                <Label htmlFor="view-selector" className="sr-only">
                                        View
                                </Label>
                                <Select defaultValue="outline">
                                        <SelectTrigger
                                                className="flex w-fit @4xl/main:hidden"
                                                size="sm"
                                                id="view-selector"
                                        >
                                                <SelectValue placeholder="Select a view" />
                                        </SelectTrigger>
                                        <SelectContent>
                                                <SelectItem value="admin-requests">Admin Requests</SelectItem>
                                                <SelectItem value="bookings">Bookings</SelectItem>
                                                <SelectItem value="employees">Employees</SelectItem>
                                                <SelectItem value="booking-types">Booking Types</SelectItem>
                                                <SelectItem value="updates">Updates</SelectItem>
                                        </SelectContent>
                                </Select>
                                <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
                                        <TabsTrigger value="admin-requests">
                                                Admin Requests <Badge variant="secondary">{numPending}</Badge>
                                        </TabsTrigger>
                                        <TabsTrigger value="bookings">
                                                Bookings
                                        </TabsTrigger>
                                        <TabsTrigger value="employees">
                                                Employees
                                        </TabsTrigger>
                                        <TabsTrigger value="booking-types">
                                                Booking Types
                                        </TabsTrigger>
                                        <TabsTrigger value="updates">
                                                Updates
                                        </TabsTrigger>
                                </TabsList>

                        </div>

                        <RequestDataTable />
                        <BookingsTable />

                        <TabsContent
                                value="past-performance"
                                className="flex flex-col px-4 lg:px-6"
                        >
                                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
                        </TabsContent>
                        <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
                                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
                        </TabsContent>
                        <TabsContent
                                value="focus-documents"
                                className="flex flex-col px-4 lg:px-6"
                        >
                                <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
                        </TabsContent>
                </Tabs>
        )
}
