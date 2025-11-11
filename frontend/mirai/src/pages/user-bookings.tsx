import { SparklesCore } from "@/components/ui/sparkles";
import UserBookings from "@/components/user-bookings";
import { TableProvider } from "@/contexts/table-context";

export default function Booking() {
        return (
                <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">

                        <div className="w-full absolute inset-0 h-screen">
                                <SparklesCore
                                        id="tsparticles-calendar"
                                        background="transparent"
                                        minSize={0.6}
                                        maxSize={1.4}
                                        particleDensity={100}
                                        className="w-full h-full"
                                        particleColor="#FFFFFF"
                                />
                        </div>

                        <div className="relative z-20">
                                <TableProvider>
                                        <UserBookings />
                                </TableProvider >
                        </div>
                </div>
        )
}
