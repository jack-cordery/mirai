import * as React from "react"
import {
        type UniqueIdentifier,
} from "@dnd-kit/core"
import {
        SortableContext,
        verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
        IconChevronLeft,
        IconChevronRight,
        IconChevronsLeft,
        IconChevronsRight,
        IconDotsVertical,
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
        VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

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
import { DropdownMenu, DropdownMenuContent } from "./ui/dropdown-menu"
import { DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { BookingTypeDeleteModal, BookingTypeEditModal } from "./booking-type-modals"
import { loadWorkingDayTimes } from "@/lib/utils"

export const BookingTypeDataSchema = z.object({
        type_id: z.number(),
        title: z.string(),
        description: z.string(),
        fixed: z.boolean(),
        cost: z.number(),
        duration: z.number(),
        created_at: z.string(),
        last_edited: z.string(),
});

export function BookingTypeTable() {
        const {
                bookingTypeData,
                setIsBookingTypeEditModalOpen,
                setBookingTypeEditModalRow,
                setIsBookingTypeDeleteModalOpen,
                setBookingTypeDeleteModalRow,
        } = useTableContext();
        const { slotDuration } = loadWorkingDayTimes()
        const [columnVisibility, setColumnVisibility] =
                React.useState<VisibilityState>({})
        const [pagination, setPagination] = React.useState({
                pageIndex: 0,
                pageSize: 10,
        })

        const dataIds = React.useMemo<UniqueIdentifier[]>(
                () => bookingTypeData?.map(({ type_id }) => type_id) || [],
                [bookingTypeData]
        )
        const columns: ColumnDef<z.infer<typeof BookingTypeDataSchema>>[] = [
                {
                        accessorKey: "title",
                        header: "Title",
                        cell: ({ row }) => {
                                return <p>{row.original.title}</p>
                        },
                },
                {
                        accessorKey: "description",
                        header: "Description",
                        cell: ({ row }) => {
                                return <p>{row.original.description}</p>
                        },
                },
                {
                        accessorKey: "fixed",
                        header: "Fixed",
                        cell: ({ row }) => {
                                return <p>{row.original.fixed ? "☑︎" : "□"}</p>
                        },
                },
                {
                        accessorKey: "cost",
                        header: "Cost",
                        cell: ({ row }) => {
                                return <p>£{(row.original.cost / 100).toFixed(2)}</p>
                        },
                },
                {
                        accessorKey: "duration",
                        header: "Duration (minutes)",
                        cell: ({ row }) => {
                                return <p>{row.original.duration * slotDuration}</p>
                        },
                },
                {
                        accessorKey: "created_at",
                        header: "Create At",
                        cell: ({ row }) => {
                                if (!row.original.created_at) {
                                        return <p> NULL </p>
                                }
                                return <p>{new Date(row.original.created_at).toDateString()}</p>
                        },
                },
                {
                        accessorKey: "last_edited",
                        header: "Last Edited",
                        cell: ({ row }) => {
                                if (!row.original.last_edited) {
                                        return <p> NULL </p>
                                }
                                return <p> {new Date(row.original.last_edited).toDateString()} </p>
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
                                                <DropdownMenuItem onClick={() => {
                                                        setBookingTypeEditModalRow(row.original);
                                                        setIsBookingTypeEditModalOpen(true);
                                                }}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                        setBookingTypeDeleteModalRow(row.original);
                                                        setIsBookingTypeDeleteModalOpen(true);
                                                }}>Delete</DropdownMenuItem>
                                        </DropdownMenuContent >
                                </DropdownMenu >
                        ),
                },
        ]

        const table = useReactTable({
                data: bookingTypeData,
                columns: columns,
                state: {
                        columnVisibility,
                        pagination,
                },
                getRowId: (row) => row.type_id.toString(),
                enableRowSelection: true,
                onColumnVisibilityChange: setColumnVisibility,
                onPaginationChange: setPagination,
                getCoreRowModel: getCoreRowModel(),
                getFilteredRowModel: getFilteredRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
                getSortedRowModel: getSortedRowModel(),
                getFacetedRowModel: getFacetedRowModel(),
                getFacetedUniqueValues: getFacetedUniqueValues(),
        })

        return (
                <TabsContent
                        value="booking-types"
                        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
                >
                        <div className="overflow-hidden rounded-lg border">
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
                                                                        <TableRow key={row.original.type_id}>
                                                                                {row.getVisibleCells().map((cell) => (
                                                                                        <TableCell key={cell.id}>
                                                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                                        </TableCell>
                                                                                ))}
                                                                        </TableRow>

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
                                <BookingTypeEditModal />
                                <BookingTypeDeleteModal />
                        </div>
                </TabsContent>
        )
}
