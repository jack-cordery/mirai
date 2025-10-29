import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { CalendarDays, Clock, CreditCard } from "lucide-react"

export default function UserLanding() {
        const navigate = useNavigate()

        return (
                <Card className="max-w-xl w-full text-center">
                        <CardHeader>
                                <CardTitle className="text-2xl font-semibold">Welcome Back 👋</CardTitle>
                                <CardDescription>Your bookings, payments, and schedule — all in one place.</CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-6 mt-4">
                                <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col items-center gap-2">
                                                <CalendarDays className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">View Bookings</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                                <Clock className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Upcoming Sessions</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                                                <p className="text-sm font-medium">Payment History</p>
                                        </div>
                                </div>
                        </CardContent>

                        <CardFooter className="flex justify-center gap-4">
                                <Button onClick={() => navigate("/user/bookings")}>My Bookings</Button>
                                <Button variant="outline" onClick={() => navigate("/user/settings")}>Settings</Button>
                        </CardFooter>
                </Card>
        )
}
