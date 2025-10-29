import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"

type Booking = {
        id: number
        date: string
        employee: string
        service: string
        status: "Paid" | "Pending" | "Cancelled"
        amount: string
}

const mockBookings: Booking[] = [
        { id: 1, date: "2025-10-22", employee: "Jane Smith", service: "Massage", status: "Paid", amount: "$60.00" },
        { id: 2, date: "2025-10-24", employee: "Mark Johnson", service: "Physio", status: "Pending", amount: "$80.00" },
        { id: 3, date: "2025-10-28", employee: "Sarah Lee", service: "Yoga Session", status: "Cancelled", amount: "$30.00" },
        { id: 4, date: "2025-11-02", employee: "Jane Smith", service: "Massage", status: "Paid", amount: "$60.00" },
]

export default function UserBookings() {
        const [search, setSearch] = useState("")
        const [sortAsc, setSortAsc] = useState(true)
        const [bookings, setBookings] = useState<Booking[]>(mockBookings)

        const handleSort = () => {
                const sorted = [...bookings].sort((a, b) =>
                        sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
                )
                setBookings(sorted)
                setSortAsc(!sortAsc)
        }

        const filtered = bookings.filter((b) =>
                b.employee.toLowerCase().includes(search.toLowerCase()) ||
                b.service.toLowerCase().includes(search.toLowerCase())
        )

        return (
                <Card className="w-full">
                        <CardHeader>
                                <CardTitle>Your Bookings</CardTitle>
                                <CardDescription>View your previous and upcoming bookings here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                        <div className="flex flex-col gap-1 w-full max-w-xs">
                                                <Label htmlFor="search">Search</Label>
                                                <Input
                                                        id="search"
                                                        placeholder="Search by service or employee..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                />
                                        </div>
                                        <Button variant="outline" onClick={handleSort} className="mt-5">
                                                Sort by Date <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                </div>

                                <Table>
                                        <TableHeader>
                                                <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Service</TableHead>
                                                        <TableHead>Employee</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                                {filtered.length === 0 ? (
                                                        <TableRow>
                                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                                                        No bookings found.
                                                                </TableCell>
                                                        </TableRow>
                                                ) : (
                                                        filtered.map((b) => (
                                                                <TableRow key={b.id}>
                                                                        <TableCell>{b.date}</TableCell>
                                                                        <TableCell>{b.service}</TableCell>
                                                                        <TableCell>{b.employee}</TableCell>
                                                                        <TableCell>
                                                                                <Badge
                                                                                        variant={
                                                                                                b.status === "Paid"
                                                                                                        ? "default"
                                                                                                        : b.status === "Pending"
                                                                                                                ? "secondary"
                                                                                                                : "destructive"
                                                                                        }
                                                                                >
                                                                                        {b.status}
                                                                                </Badge>
                                                                        </TableCell>
                                                                        <TableCell>{b.amount}</TableCell>
                                                                </TableRow>
                                                        ))
                                                )}
                                        </TableBody>
                                </Table>
                        </CardContent>
                </Card>
        )
}
