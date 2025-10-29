import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, CalendarPlus, Users } from "lucide-react"

export default function AdminLanding() {
        const navigate = useNavigate()

        return (
                <Card className="max-w-xl w-full text-center">
                        <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Admin Home🧭</CardTitle>
                                <CardDescription>Manage your team, schedule, and booking types from one place.</CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-6 mt-4">
                                <div className="grid grid-cols-3 gap-4">
                                        <button onClick={() => navigate("/admin/dashboard")} className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted cursor-pointer transition">
                                                <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Overview</p>
                                        </button>
                                        <button onClick={() => navigate("/admin/scheduler")} className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted cursor-pointer transition">
                                                <CalendarPlus className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Manage Schedule</p>
                                        </button>
                                        <button onClick={() => navigate("/admin/create")} className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted cursor-pointer transition">
                                                <Users className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Employees</p>
                                        </button>
                                </div>
                        </CardContent>
                </Card >
        );
}
