import { SparklesCore } from "@/components/ui/sparkles";
import UserLanding from "@/components/user-landing";

export default function UserLandingPage() {
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
                                <UserLanding />
                        </div>
                </div>
        )
}
