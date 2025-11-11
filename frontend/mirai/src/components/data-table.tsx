import * as React from "react"
import {
        closestCenter,
        DndContext,
        KeyboardSensor,
        MouseSensor,
        TouchSensor,
        useSensor,
        useSensors,
        type DragEndEvent,
        type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
        arrayMove,
        SortableContext,
        useSortable,
        verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
        IconChevronLeft,
        IconChevronRight,
        IconChevronsLeft,
        IconChevronsRight,
        IconCircleCheckFilled,
        IconCircleXFilled,
        IconDotsVertical,
        IconGripVertical,
        IconLoader,
} from "@tabler/icons-react"
import {
        flexRender,
        getCoreRowModel,
        getFacetedRowModel,
        getFacetedUniqueValues,
        getFilteredRowModel,
        getPaginationRowModel,
        getSortedRowModel,
        useReactTable,
} from "@tanstack/react-table"
import type {
        ColumnDef,
        ColumnFiltersState,
        Row,
        SortingState,
        VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
        ChartConfig,
} from "@/components/ui/chart"
import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select"
import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
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
import { RequestDataTable } from "./requests-table"


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
                                                <SelectItem value="key-personnel">Updates</SelectItem>
                                        </SelectContent>
                                </Select>
                                <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
                                        <TabsTrigger value="admin-requests">
                                                Admin Requests <Badge variant="secondary">{numPending}</Badge>

                                        </TabsTrigger>
                                        <TabsTrigger value="bookings">
                                                Bookings
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

const chartData = [
        { month: "January", desktop: 186, mobile: 80 },
        { month: "February", desktop: 305, mobile: 200 },
        { month: "March", desktop: 237, mobile: 120 },
        { month: "April", desktop: 73, mobile: 190 },
        { month: "May", desktop: 209, mobile: 130 },
        { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
        desktop: {
                label: "Desktop",
                color: "var(--primary)",
        },
        mobile: {
                label: "Mobile",
                color: "var(--primary)",
        },
} satisfies ChartConfig

// function TableCellViewer({ item }: { item: z.infer<typeof RequestDataSchema> }) {
//         const isMobile = useIsMobile()
//
//         return (
//                 <Drawer direction={isMobile ? "bottom" : "right"}>
//                         <DrawerTrigger asChild>
//                                 <Button variant="link" className="text-foreground w-fit px-0 text-left">
//                                         {item.header}
//                                 </Button>
//                         </DrawerTrigger>
//                         <DrawerContent>
//                                 <DrawerHeader className="gap-1">
//                                         <DrawerTitle>{item.header}</DrawerTitle>
//                                         <DrawerDescription>
//                                                 Showing total visitors for the last 6 months
//                                         </DrawerDescription>
//                                 </DrawerHeader>
//                                 <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
//                                         {!isMobile && (
//                                                 <>
//                                                         <ChartContainer config={chartConfig}>
//                                                                 <AreaChart
//                                                                         accessibilityLayer
//                                                                         data={chartData}
//                                                                         margin={{
//                                                                                 left: 0,
//                                                                                 right: 10,
//                                                                         }}
//                                                                 >
//                                                                         <CartesianGrid vertical={false} />
//                                                                         <XAxis
//                                                                                 dataKey="month"
//                                                                                 tickLine={false}
//                                                                                 axisLine={false}
//                                                                                 tickMargin={8}
//                                                                                 tickFormatter={(value) => value.slice(0, 3)}
//                                                                                 hide
//                                                                         />
//                                                                         <ChartTooltip
//                                                                                 cursor={false}
//                                                                                 content={<ChartTooltipContent indicator="dot" />}
//                                                                         />
//                                                                         <Area
//                                                                                 dataKey="mobile"
//                                                                                 type="natural"
//                                                                                 fill="var(--color-mobile)"
//                                                                                 fillOpacity={0.6}
//                                                                                 stroke="var(--color-mobile)"
//                                                                                 stackId="a"
//                                                                         />
//                                                                         <Area
//                                                                                 dataKey="desktop"
//                                                                                 type="natural"
//                                                                                 fill="var(--color-desktop)"
//                                                                                 fillOpacity={0.4}
//                                                                                 stroke="var(--color-desktop)"
//                                                                                 stackId="a"
//                                                                         />
//                                                                 </AreaChart>
//                                                         </ChartContainer>
//                                                         <Separator />
//                                                         <div className="grid gap-2">
//                                                                 <div className="flex gap-2 leading-none font-medium">
//                                                                         Trending up by 5.2% this month{" "}
//                                                                         <IconTrendingUp className="size-4" />
//                                                                 </div>
//                                                                 <div className="text-muted-foreground">
//                                                                         Showing total visitors for the last 6 months. This is just
//                                                                         some random text to test the layout. It spans multiple lines
//                                                                         and should wrap around.
//                                                                 </div>
//                                                         </div>
//                                                         <Separator />
//                                                 </>
//                                         )}
//                                         <form className="flex flex-col gap-4">
//                                                 <div className="flex flex-col gap-3">
//                                                         <Label htmlFor="header">Header</Label>
//                                                         <Input id="header" defaultValue={item.header} />
//                                                 </div>
//                                                 <div className="grid grid-cols-2 gap-4">
//                                                         <div className="flex flex-col gap-3">
//                                                                 <Label htmlFor="type">Type</Label>
//                                                                 <Select defaultValue={item.type}>
//                                                                         <SelectTrigger id="type" className="w-full">
//                                                                                 <SelectValue placeholder="Select a type" />
//                                                                         </SelectTrigger>
//                                                                         <SelectContent>
//                                                                                 <SelectItem value="Table of Contents">
//                                                                                         Table of Contents
//                                                                                 </SelectItem>
//                                                                                 <SelectItem value="Executive Summary">
//                                                                                         Executive Summary
//                                                                                 </SelectItem>
//                                                                                 <SelectItem value="Technical Approach">
//                                                                                         Technical Approach
//                                                                                 </SelectItem>
//                                                                                 <SelectItem value="Design">Design</SelectItem>
//                                                                                 <SelectItem value="Capabilities">Capabilities</SelectItem>
//                                                                                 <SelectItem value="Focus Documents">
//                                                                                         Focus Documents
//                                                                                 </SelectItem>
//                                                                                 <SelectItem value="Narrative">Narrative</SelectItem>
//                                                                                 <SelectItem value="Cover Page">Cover Page</SelectItem>
//                                                                         </SelectContent>
//                                                                 </Select>
//                                                         </div>
//                                                         <div className="flex flex-col gap-3">
//                                                                 <Label htmlFor="status">Status</Label>
//                                                                 <Select defaultValue={item.status}>
//                                                                         <SelectTrigger id="status" className="w-full">
//                                                                                 <SelectValue placeholder="Select a status" />
//                                                                         </SelectTrigger>
//                                                                         <SelectContent>
//                                                                                 <SelectItem value="Done">Done</SelectItem>
//                                                                                 <SelectItem value="In Progress">In Progress</SelectItem>
//                                                                                 <SelectItem value="Not Started">Not Started</SelectItem>
//                                                                         </SelectContent>
//                                                                 </Select>
//                                                         </div>
//                                                 </div>
//                                                 <div className="grid grid-cols-2 gap-4">
//                                                         <div className="flex flex-col gap-3">
//                                                                 <Label htmlFor="target">Target</Label>
//                                                                 <Input id="target" defaultValue={item.target} />
//                                                         </div>
//                                                         <div className="flex flex-col gap-3">
//                                                                 <Label htmlFor="limit">Limit</Label>
//                                                                 <Input id="limit" defaultValue={item.limit} />
//                                                         </div>
//                                                 </div>
//                                                 <div className="flex flex-col gap-3">
//                                                         <Label htmlFor="reviewer">Reviewer</Label>
//                                                         <Select defaultValue={item.reviewer}>
//                                                                 <SelectTrigger id="reviewer" className="w-full">
//                                                                         <SelectValue placeholder="Select a reviewer" />
//                                                                 </SelectTrigger>
//                                                                 <SelectContent>
//                                                                         <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
//                                                                         <SelectItem value="Jamik Tashpulatov">
//                                                                                 Jamik Tashpulatov
//                                                                         </SelectItem>
//                                                                         <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
//                                                                 </SelectContent>
//                                                         </Select>
//                                                 </div>
//                                         </form>
//                                 </div>
//                                 <DrawerFooter>
//                                         <Button>Submit</Button>
//                                         <DrawerClose asChild>
//                                                 <Button variant="outline">Done</Button>
//                                         </DrawerClose>
//                                 </DrawerFooter>
//                         </DrawerContent>
//                 </Drawer>
//         )
// }
