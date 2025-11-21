import { Button } from "@/components/ui/button";
// If you are using React Router, keep this. If Next.js, use useRouter
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function Title() {
        const navigate = useNavigate();

        return (
                <div className="relative h-screen w-full bg-neutral-950 flex flex-col items-center justify-center overflow-hidden">

                        {/* --- BACKGROUND LAYERS --- */}

                        {/* 1. The Grid Pattern: Represents structure, scheduling, and reliability */}
                        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                        {/* 2. The Ambient Glow: Adds depth behind the text so it doesn't feel flat */}
                        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-violet-500 opacity-20 blur-[100px]"></div>


                        {/* --- CONTENT --- */}

                        <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-4xl">

                                {/* Main Headline */}
                                <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[1.1]">
                                        Organise your Future.
                                </h2>

                                {/* Gradient Sub-headline */}
                                <div className="mt-2 md:mt-4">
                                        <span className="text-4xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400">
                                                With Mirai.
                                        </span>
                                </div>

                                {/* Description */}
                                <p className="mt-8 text-lg md:text-xl text-neutral-400 max-w-lg mx-auto font-medium">
                                        The booking platform built for peace of mind. <br className="hidden md:block" />
                                        Simple, reliable, and designed to get out of your way.
                                </p>

                                <div className="relative group mt-4">

                                        {/* 1. The "Time Rings" (Decorative Center Piece) */}
                                        {/* Outer Ring - Slow Rotation */}
                                        <div className="absolute -inset-12 rounded-full border border-neutral-800 border-dashed opacity-20 animate-[spin_60s_linear_infinite] pointer-events-none"></div>
                                        {/* Inner Ring - Reverse Rotation */}
                                        <div className="absolute -inset-6 rounded-full border border-neutral-800 opacity-40 animate-[spin_40s_linear_infinite_reverse] pointer-events-none"></div>

                                        {/* 2. The Glow Behind */}
                                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-500"></div>

                                        {/* 3. The "Cool" Button */}
                                        <div className="relative group mt-4">

                                                {/* Optional: Subtle static glow behind the button */}
                                                <div className="absolute -inset-1 bg-violet-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                                                <button
                                                        onClick={() => navigate("/login")}
                                                        className="relative inline-flex h-16 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-neutral-950"
                                                >
                                                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#7c3aed_50%,#000000_100%)]" />

                                                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-neutral-950 px-10 text-sm font-medium text-neutral-200 backdrop-blur-3xl gap-3 transition-colors group-hover:bg-neutral-900">
                                                                <LockKeyhole className="h-4 w-4 text-neutral-500 group-hover:text-violet-400 transition-colors" />
                                                                <span className="text-lg tracking-wide font-semibold group-hover:text-white transition-colors">LOGIN TO MIRAI</span>
                                                                <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:translate-x-1 group-hover:text-violet-400 transition-all" />
                                                        </span>
                                                </button>
                                        </div>
                                </div>

                                {/* Reflection under the button for depth */}
                                <div className="mt-8 h-1 w-40 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-20 blur-md"></div>

                        </div>

                        {/* Bottom Fade: Blends the grid into the footer/next section naturally */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none"></div>
                </div>
        );
}
