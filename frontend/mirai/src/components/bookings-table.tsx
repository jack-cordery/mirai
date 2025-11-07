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
        verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
        IconChevronLeft,
        IconChevronRight,
        IconChevronsLeft,
        IconChevronsRight,
        IconCircleCheck,
        IconCircleCheckFilled,
        IconCircleXFilled,
        IconDotsVertical,
        IconLoader,
        IconRefresh,
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
        SortingState,
        VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        TabsContent,
} from "@/components/ui/tabs"
import { useTableContext } from "@/contexts/table-context"
import { DraggableRow } from "./data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { CancelModal, CompleteModal, ConfirmModal, PaidModal } from "./booking-table-modals"
import { ArrowUpDown } from "lucide-react"

export const BookingDataSchema = z.object({
        id: z.number(),
        user_id: z.number(),
        user_name: z.string(),
        user_surname: z.string(),
        user_email: z.string(),
        user_last_login: z.string(),
        type_id: z.number(),
        type_title: z.string(),
        paid: z.boolean(),
        cost: z.number(),
        status: z.string(),
        status_updated_at: z.string(),
        status_updated_by: z.string(),
        notes: z.string(),
        created_at: z.string(),
        last_edited: z.string(),
        start_time: z.string(),
        end_time: z.string(),
});

export function BookingsTable() {
        const {
                bookingData,
                setBookingData,
                setIsPaidModalOpen,
                setPaidModalRow,
                setCancelModalRow,
                setIsCancelModalOpen,
                setConfirmModalRow,
                setIsConfirmModalOpen,
                setCompleteModalRow,
                setIsCompleteModalOpen,
        } = useTableContext();
        const [rowSelection, setRowSelection] = React.useState({})
        const [columnVisibility, setColumnVisibility] =
                React.useState<VisibilityState>({})
        const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
                []
        )
        const [sorting, setSorting] = React.useState<SortingState>([])
        const [pagination, setPagination] = React.useState({
                pageIndex: 0,
                pageSize: 10,
        })
        const sortableId = React.useId()
        const sensors = useSensors(
                useSensor(MouseSensor, {}),
                useSensor(TouchSensor, {}),
                useSensor(KeyboardSensor, {})
        )

        const dataIds = React.useMemo<UniqueIdentifier[]>(
                () => bookingData?.map(({ id }) => id) || [],
                [bookingData]
        )
        const columns: ColumnDef<z.infer<typeof BookingDataSchema>>[] = [
                {
                        id: 'select-col',
                        header: ({ table }) => (
                                <Checkbox
                                        checked={
                                                table.getIsAllRowsSelected()
                                                        ? true
                                                        : table.getIsSomeRowsSelected()
                                                                ? "indeterminate"
                                                                : false
                                        }
                                        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                                />
                        ),
                        cell: ({ row }) => (
                                <Checkbox
                                        checked={row.getIsSelected()}
                                        disabled={!row.getCanSelect()}
                                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                                />
                        ),
                },
                {
                        accessorKey: "date",
                        header: "Date",
                        cell: ({ row }) => {
                                if (!row.original.start_time) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.start_time).toDateString()} </p>
                        },
                },
                {
                        accessorKey: "starting_time",
                        header: "Start Time",
                        cell: ({ row }) => {
                                if (!row.original.start_time) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.start_time).toLocaleTimeString()} </p>
                        },
                },
                {
                        accessorKey: "end_time",
                        header: "End Time",
                        cell: ({ row }) => {
                                if (!row.original.end_time) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.end_time).toLocaleTimeString()} </p>
                        },
                },
                {
                        accessorKey: "user_name",
                        header: "Name",
                        cell: ({ row }) => {
                                const styledName = row.original.user_name.charAt(0).toUpperCase()
                                        + row.original.user_name.slice(1).toLowerCase()
                                        + " "
                                        + row.original.user_surname.charAt(0).toUpperCase()
                                        + row.original.user_surname.slice(1).toLowerCase();
                                return <p> {styledName} </p>
                        },
                        enableHiding: false,
                },
                {
                        accessorKey: "user_email",
                        header: "Email",
                        cell: ({ row }) => {
                                return <p> {row.original.user_email} </p>
                        },
                },
                {
                        accessorKey: "type_title",
                        header: "Type",
                        cell: ({ row }) => {
                                return <p> {row.original.type_title} </p>
                        },
                },
                {
                        accessorKey: "paid",
                        header: "Paid",
                        cell: ({ row }) => {
                                if (!row.original.paid) {
                                        return <p> ❌ </p>
                                }
                                return <p> ✅ </p>
                        },
                },
                {
                        accessorKey: "cost",
                        header: "Cost",
                        cell: ({ row }) => {
                                const costPounds = row.original.cost / 100
                                return <p> £{costPounds.toFixed(2)} </p>
                        },
                },
                {
                        accessorKey: "status",
                        header: "Status",
                        cell: ({ row }) => (
                                <Badge variant="outline" className="text-muted-foreground px-1.5">
                                        {row.original.status === "completed" ? (
                                                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
                                        ) : row.original.status === "cancelled" ? (
                                                <IconCircleXFilled className="fill-red-500 dark:fill-red-400" />
                                        ) : row.original.status === "confirmed" ? (
                                                <IconCircleCheck className="stroke-green-500 dark:stroke-green-400" />
                                        ) : row.original.status === "rescheduled" ? (
                                                <IconRefresh className="stroke-yellow-500 dark:stroke-yellow-400" />
                                        ) : row.original.status === "completed" ? (
                                                <IconCircleXFilled className="fill-green-500 dark:fill-green-400" />
                                        ) : (
                                                <IconLoader />
                                        )}
                                        {row.original.status}
                                </Badge>
                        ),
                },
                {
                        accessorKey: "status_updated_at",
                        header: "Status Updated At",
                        cell: ({ row }) => {
                                if (!row.original.status_updated_at) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.status_updated_at).toDateString()} </p>
                        },
                },
                {
                        accessorKey: "status_updated_by",
                        header: "Status Updated By",
                        cell: ({ row }) => {
                                return <p> {row.original.status_updated_by} </p>
                        },
                },
                {
                        accessorKey: "notes",
                        header: "Notes",
                        cell: ({ row }) => {
                                return <p> {row.original.notes} </p>
                        },
                },
                {
                        accessorKey: "created_at",
                        header: ({ column }) => {
                                return (
                                        <Button
                                                variant="ghost"
                                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                                                className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-md cursor-pointer"
                                        >
                                                Created At
                                                <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                )
                        },
                        cell: ({ row }) => {
                                if (!row.original.created_at) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.created_at).toDateString()} </p>
                        },
                },
                {
                        id: "actions",
                        cell: ({ row }) => (
                                <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                                <Button
                                                        variant="ghost"
                                                        className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                                        size="icon"
                                                >
                                                        <IconDotsVertical />
                                                        <span className="sr-only">Open menu</span>
                                                </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                                {!row.original.paid &&
                                                        < DropdownMenuItem onClick={async () => {
                                                                setIsPaidModalOpen(true);
                                                                setPaidModalRow(row.original);
                                                        }
                                                        }>Payment</DropdownMenuItem>
                                                }
                                                <DropdownMenuItem >Reschedule</DropdownMenuItem>
                                                {!(row.original.status === "cancelled") &&
                                                        < DropdownMenuItem onClick={async () => {
                                                                setIsCancelModalOpen(true);
                                                                setCancelModalRow(row.original);
                                                        }
                                                        }>Cancel</DropdownMenuItem>
                                                }
                                                {(row.original.status === "created")
                                                        &&
                                                        < DropdownMenuItem onClick={async () => {
                                                                setIsConfirmModalOpen(true);
                                                                setConfirmModalRow(row.original);
                                                        }
                                                        }>Confirm</DropdownMenuItem>
                                                }
                                                {(row.original.status === "confirmed") && (row.original.paid)
                                                        &&
                                                        < DropdownMenuItem onClick={async () => {
                                                                setIsCompleteModalOpen(true);
                                                                setCompleteModalRow(row.original);
                                                        }
                                                        }>Complete</DropdownMenuItem>
                                                }
                                        </DropdownMenuContent>
                                </DropdownMenu >
                        ),
                },


        ]
        const table = useReactTable({
                data: bookingData,
                columns: columns,
                state: {
                        sorting,
                        columnVisibility,
                        rowSelection,
                        columnFilters,
                        pagination,
                },
                getRowId: (row) => row.id.toString(),
                enableRowSelection: true,
                onRowSelectionChange: setRowSelection,
                onSortingChange: setSorting,
                onColumnFiltersChange: setColumnFilters,
                onColumnVisibilityChange: setColumnVisibility,
                onPaginationChange: setPagination,
                getCoreRowModel: getCoreRowModel(),
                getFilteredRowModel: getFilteredRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
                getSortedRowModel: getSortedRowModel(),
                getFacetedRowModel: getFacetedRowModel(),
                getFacetedUniqueValues: getFacetedUniqueValues(),
        })

        function handleDragEnd(event: DragEndEvent) {
                const { active, over } = event
                if (active && over && active.id !== over.id) {
                        setBookingData((data) => {
                                const oldIndex = dataIds.indexOf(active.id)
                                const newIndex = dataIds.indexOf(over.id)
                                return arrayMove(data, oldIndex, newIndex)
                        })
                }
        }

        return (
                <TabsContent
                        value="bookings"
                        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
                >
                        <div className="overflow-hidden rounded-lg border">
                                <DndContext
                                        collisionDetection={closestCenter}
                                        modifiers={[restrictToVerticalAxis]}
                                        onDragEnd={handleDragEnd}
                                        sensors={sensors}
                                        id={sortableId}
                                >
                                        <Table>
                                                <TableHeader className="bg-muted sticky top-0 z-10">
                                                        {table.getHeaderGroups().map((headerGroup) => (
                                                                <TableRow key={headerGroup.id}>
                                                                        {headerGroup.headers.map((header) => {
                                                                                return (
                                                                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                                                                                {header.isPlaceholder
                                                                                                        ? null
                                                                                                        : flexRender(
                                                                                                                header.column.columnDef.header,
                                                                                                                header.getContext()
                                                                                                        )}
                                                                                        </TableHead>
                                                                                )
                                                                        })}
                                                                </TableRow>
                                                        ))}
                                                </TableHeader>
                                                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                                        {table.getRowModel().rows?.length ? (
                                                                <SortableContext
                                                                        items={dataIds}
                                                                        strategy={verticalListSortingStrategy}
                                                                >
                                                                        {table.getRowModel().rows.map((row) => (
                                                                                <DraggableRow key={row.id} row={row} />
                                                                        ))}
                                                                </SortableContext>
                                                        ) : (
                                                                <TableRow>
                                                                        <TableCell
                                                                                colSpan={columns.length}
                                                                                className="h-24 text-center"
                                                                        >
                                                                                No results.
                                                                        </TableCell>
                                                                </TableRow>
                                                        )}
                                                </TableBody>
                                        </Table>
                                </DndContext>
                        </div>
                        <div className="flex items-center justify-between px-4">
                                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                        {table.getFilteredRowModel().rows.length} row(s) selected.
                                </div>
                                <div className="flex w-full items-center gap-8 lg:w-fit">
                                        <div className="hidden items-center gap-2 lg:flex">
                                                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                                        Rows per page
                                                </Label>
                                                <Select
                                                        value={`${table.getState().pagination.pageSize}`}
                                                        onValueChange={(value) => {
                                                                table.setPageSize(Number(value))
                                                        }}
                                                >
                                                        <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                                                <SelectValue
                                                                        placeholder={table.getState().pagination.pageSize}
                                                                />
                                                        </SelectTrigger>
                                                        <SelectContent side="top">
                                                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                                                                {pageSize}
                                                                        </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                </Select>
                                        </div>
                                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                                {table.getPageCount()}
                                        </div>
                                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                                <Button
                                                        variant="outline"
                                                        className="hidden h-8 w-8 p-0 lg:flex"
                                                        onClick={() => table.setPageIndex(0)}
                                                        disabled={!table.getCanPreviousPage()}
                                                >
                                                        <span className="sr-only">Go to first page</span>
                                                        <IconChevronsLeft />
                                                </Button>
                                                <Button
                                                        variant="outline"
                                                        className="size-8"
                                                        size="icon"
                                                        onClick={() => table.previousPage()}
                                                        disabled={!table.getCanPreviousPage()}
                                                >
                                                        <span className="sr-only">Go to previous page</span>
                                                        <IconChevronLeft />
                                                </Button>
                                                <Button
                                                        variant="outline"
                                                        className="size-8"
                                                        size="icon"
                                                        onClick={() => table.nextPage()}
                                                        disabled={!table.getCanNextPage()}
                                                >
                                                        <span className="sr-only">Go to next page</span>
                                                        <IconChevronRight />
                                                </Button>
                                                <Button
                                                        variant="outline"
                                                        className="hidden size-8 lg:flex"
                                                        size="icon"
                                                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                                        disabled={!table.getCanNextPage()}
                                                >
                                                        <span className="sr-only">Go to last page</span>
                                                        <IconChevronsRight />
                                                </Button>
                                        </div>
                                </div>
                        </div>
                        <PaidModal />
                        <CancelModal />
                        <ConfirmModal />
                        <CompleteModal />

                </TabsContent>
        )
}
