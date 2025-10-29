"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
        IconBrandGoogle,
} from "@tabler/icons-react";
import { useAuth } from "@/contexts/auth-context";
import { postUser } from "@/api/user";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

function SuccessRegistration() {
        const navigate = useNavigate();
        return (
                <div className="shadow-input my-auto mx-auto w-full max-w-md rounded-none bg-white border border-white p-4 md:rounded-2xl md:p-8 dark:bg-black text-center">
                        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                                Registration Successful 🎉
                        </h2>
                        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                                Your account has been created successfully.
                        </p>

                        <button
                                className="mt-6 group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-green-600 to-emerald-700 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                                onClick={() => navigate("/login")}
                        >
                                Go to Login →
                                <BottomGradient />
                        </button>
                </div>
        )
}

export default function SignupForm() {
        const { isAuthenticated, register } = useAuth();
        const navigate = useNavigate();
        if (isAuthenticated) {
                navigate("/user")
        }
        const [firstName, setFirstName] = useState("");
        const [surname, setSurname] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [registrationSuccess, setRegistrationSuccess] = useState(false);
        const [show, setShow] = useState(false);
        const [showConfirm, setShowConfirm] = useState(false);
        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const toastDate = new Date;
                if (password != confirmPassword) {
                        toast("passwords do not match, please ammend")
                        return
                }
                try {
                        await register(firstName, surname, email, password)
                        setRegistrationSuccess(true);
                } catch (err) {
                        toast("Sign up failed, either try again or login if you already have an account", {
                                description: toastDate.toLocaleDateString(),
                                action: {
                                        label: "Login",
                                        onClick: () => navigate("/login"),
                                },
                        })
                }
        };

        if (registrationSuccess) {
                return (
                        <SuccessRegistration />
                )
        }
        return (
                <div className="shadow-input my-auto mx-auto w-full max-w-md rounded-none bg-white border border-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                                Welcome to Mirai
                        </h2>
                        <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
                                Register to mirai to book with your favourite service provider.
                        </p>

                        <form className="my-8" onSubmit={handleSubmit}>
                                <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                                        <LabelInputContainer>
                                                <Label htmlFor="firstname">First name</Label>
                                                <Input id="firstname" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" />
                                        </LabelInputContainer>
                                        <LabelInputContainer>
                                                <Label htmlFor="lastname">Last name</Label>
                                                <Input id="lastname" placeholder="Last Name" value={surname} type="text" onChange={(e) => setSurname(e.target.value)} />
                                        </LabelInputContainer>
                                </div>
                                <LabelInputContainer className="mb-4">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" placeholder="something@email.com" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
                                </LabelInputContainer>
                                <LabelInputContainer className="mb-4">
                                        <Label htmlFor="password">Password</Label>

                                        <div className="relative">
                                                <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => setShow(!show)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        aria-label={show ? "Hide password" : "Show password"}
                                                >
                                                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>

                                                <Input
                                                        id="password"
                                                        placeholder=""
                                                        value={password}
                                                        type={show ? "text" : "password"}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                />
                                        </div>

                                </LabelInputContainer>
                                <LabelInputContainer className="mb-4">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>

                                        <div className="relative">
                                                <button
                                                        type="button"
                                                        tabIndex={-1}
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                                >
                                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>

                                                <Input
                                                        id="confirmPassword"
                                                        placeholder=""
                                                        value={confirmPassword}
                                                        type={showConfirm ? "text" : "password"}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                        </div>

                                        {confirmPassword && confirmPassword !== password && (
                                                <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                                        )}

                                </LabelInputContainer>

                                <button
                                        className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                                        type="submit"

                                >
                                        Register &rarr;
                                        <BottomGradient />
                                </button>
                                <button
                                        className="group/btn relative mt-3 block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                                        type="button"
                                        onClick={() => navigate("/login")}
                                >
                                        Login &rarr;
                                        <BottomGradient />
                                </button>

                                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                                <div className="flex flex-col space-y-4">
                                        <button
                                                className="group/btn shadow-input relative flex h-10 w-full items-center justify-start space-x-2 rounded-md bg-gray-50 px-4 font-medium text-black dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_#262626]"
                                                type="submit"
                                        >
                                                <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                        Google
                                                </span>
                                                <BottomGradient />
                                        </button>
                                </div>
                        </form>
                </div>
        );
}

const BottomGradient = () => {
        return (
                <>
                        <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
                        <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
                </>
        );
};

const LabelInputContainer = ({
        children,
        className,
}: {
        children: React.ReactNode;
        className?: string;
}) => {
        return (
                <div className={cn("flex w-full flex-col space-y-2", className)}>
                        {children}
                </div>
        );
};
