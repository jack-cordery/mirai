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
        IconCircleCheckFilled,
        IconCircleXFilled,
        IconDotsVertical,
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
import { DraggableRow, DragHandle, handleApprove, handleReject, type RequestDataSchema } from "./data-table"


export function BookingsTable() {
        const { numPending, setNumPending, requestData, setRequestData } = useTableContext();
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
                () => requestData?.map(({ id }) => id) || [],
                [requestData]
        )
        const columns: ColumnDef<z.infer<typeof RequestDataSchema>>[] = [
                {
                        id: "drag",
                        header: () => null,
                        cell: ({ row }) => <DragHandle id={row.original.id} />,
                },
                {
                        accessorKey: "requesting_user_email",
                        header: "Email",
                        cell: ({ row }) => {
                                return <p> {row.original.requesting_user_email} </p>
                        },
                        enableHiding: false,
                },
                {
                        accessorKey: "requested_role_name",
                        header: "Requested Role",
                        cell: ({ row }) => (
                                <div className="w-32">
                                        <Badge variant="outline" className="text-muted-foreground px-1.5">
                                                {row.original.requested_role_name}
                                        </Badge>
                                </div>
                        ),
                },
                {
                        accessorKey: "status",
                        header: "Status",
                        cell: ({ row }) => (
                                <Badge variant="outline" className="text-muted-foreground px-1.5">
                                        {row.original.status === "APPROVED" ? (
                                                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
                                        ) : row.original.status === "REJECTED" ? (
                                                <IconCircleXFilled className="fill-red-500 dark:fill-red-400" />
                                        ) : (
                                                <IconLoader />
                                        )}
                                        {row.original.status}
                                </Badge>
                        ),
                },
                {
                        accessorKey: "created_at",
                        header: "Created At",
                        cell: ({ row }) => {
                                if (!row.original.created_at) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.created_at).toDateString()} </p>
                        },
                },
                {
                        accessorKey: "approved_at",
                        header: "Reviewed At",
                        cell: ({ row }) => {
                                if (!row.original.approved_at) {
                                        return <p> - </p>
                                }
                                return <p> {new Date(row.original.approved_at).toDateString()} </p>
                        },
                },
                {
                        accessorKey: "approving_user_email",
                        header: "Reviewed By",
                        cell: ({ row }) => {
                                if (!row.original.approved_at) {
                                        return <p> - </p>
                                }
                                return <p> {row.original.approving_user_email} </p>
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
                                                <DropdownMenuItem onClick={async () => {
                                                        const prevStatus = row.original.status;
                                                        const success = await handleApprove(row.original.id, setRequestData);
                                                        if (prevStatus === "PENDING" && success) {
                                                                setNumPending(numPending - 1);
                                                        }
                                                }
                                                }>✅ Approve</DropdownMenuItem>
                                                <DropdownMenuItem onClick={async () => {
                                                        const prevStatus = row.original.status;
                                                        const success = await handleReject(row.original.id, setRequestData);
                                                        if (prevStatus === "PENDING" && success) {
                                                                setNumPending(numPending - 1);
                                                        }
                                                }
                                                }>❌ Reject</DropdownMenuItem>
                                        </DropdownMenuContent>
                                </DropdownMenu>
                        ),
                },
        ]
        const table = useReactTable({
                data: requestData,
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
                        setRequestData((data) => {
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
                </TabsContent>
        )
}
