import Scheduler from "@/components/scheduler";
import { SparklesCore } from "@/components/ui/sparkles";
import { SchedulerProvider } from "@/providers/schedular-provider";
import React from "react";

const BackgroundAnimation = React.memo(() => {
        return (
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
        );
});



export default function Schedule() {
        return (
                <div className="h-screen w-full relative bg-black flex items-center justify-center overflow-hidden">
                        <BackgroundAnimation />

                        <div className="relative z-20 w-full max-w-5xl max-h-[90vh] px-4">
                                {/* This container scrolls if Scheduler is too tall */}
                                <div className="bg-opacity-10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 h-[90vh] overflow-y-auto">
                                        <SchedulerProvider
                                                weekStartsOn="monday"
                                        // onAddEvent={onAddEvent}
                                        // onUpdateEvent={onUpdateEvent}
                                        // onDeleteEvent={onDeleteEvent}
                                        // initialState={events}
                                        >
                                                <Scheduler />
                                        </SchedulerProvider>
                                </div>
                        </div>
                </div>
        );
}
