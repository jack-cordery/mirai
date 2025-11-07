import { ModeToggle } from "@/components/mode-toggle";
import SignupForm from "@/components/signup-form";
import LoginForm from "@/components/login-form";
import { SparklesCore } from "@/components/ui/sparkles";

export function SignUp() {
        return (
                <div>
                        <div className="absolute top-4 right-4 z-30">
                                <ModeToggle />
                        </div>
                        <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">
                                <div className="w-full absolute inset-0 h-screen">

                                        <SparklesCore
                                                id="tsparticlesfullpage"
                                                background="transparent"
                                                minSize={0.6}
                                                maxSize={1.4}
                                                particleDensity={100}
                                                className="w-full h-full"
                                                particleColor="#FFFFFF"
                                        />
                                </div>
                                <div className="relative z-20">
                                        <SignupForm />
                                </div>
                        </div>
                </div>

        )
}

export function Login() {
        return (
                <div>
                        <div className="absolute top-4 right-4 z-30">
                                <ModeToggle />
                        </div>
                        <div className="h-screen relative w-full bg-black flex flex-col items-center justify-center overflow-hidden">
                                <div className="w-full absolute inset-0 h-screen">

                                        <SparklesCore
                                                id="tsparticlesfullpage"
                                                background="transparent"
                                                minSize={0.6}
                                                maxSize={1.4}
                                                particleDensity={100}
                                                className="w-full h-full"
                                                particleColor="#FFFFFF"
                                        />
                                </div>
                                <div className="relative z-20">
                                        <LoginForm />
                                </div>
                        </div>
                </div>

        )
}
