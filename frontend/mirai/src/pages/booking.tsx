import BookingCalendar from "@/components/booking-calendar";
import { Button } from "@/components/ui/button";
import { SparklesCore } from "@/components/ui/sparkles";
import { useNavigate } from "react-router-dom";

export default function Booking() {
        const navigate = useNavigate();
        return (
                <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">
                        {/* Top-left button */}
                        <Button
                                className="absolute top-4 left-4 z-30 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={() => navigate("/create")}>
                                Admin
                        </Button>

                        {/* Sparkles background */}
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

                        {/* Calendar */}
                        <div className="relative z-20">
                                <BookingCalendar />
                        </div>
                </div>
        )
}
