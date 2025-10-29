import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, CalendarPlus, Users } from "lucide-react"

export default function AdminLanding() {
        const navigate = useNavigate()

        return (
                <Card className="max-w-xl w-full text-center">
                        <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Admin Dashboard 🧭</CardTitle>
                                <CardDescription>Manage your team, schedule, and booking types from one place.</CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-6 mt-4">
                                <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                                <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Overview</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                                <CalendarPlus className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Manage Schedule</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                                <Users className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Employees</p>
                                        </div>
                                </div>
                        </CardContent>

                        <CardFooter className="flex justify-center gap-4">
                                <Button onClick={() => navigate("/admin/dashboard")}>Go to Dashboard</Button>
                                <Button variant="outline" onClick={() => navigate("/admin/create")}>Create Booking Type</Button>
                        </CardFooter>
                </Card>
        );
}
