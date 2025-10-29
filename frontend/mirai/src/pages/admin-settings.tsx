import AdminSettingsForm from "@/components/admin-settings-form";
import { SparklesCore } from "@/components/ui/sparkles";
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
export default function AdminSettings() {
        return (
                <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">
                        <BackgroundAnimation />
                        <div className="relative z-20">
                                <AdminSettingsForm />
                        </div>
                </div>)
}
