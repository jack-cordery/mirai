"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom";

export function FailedLoginToast() {
        const navigate = useNavigate();

        const date = new Date;

        return (
                <Button
                        variant="outline"
                        onClick={() =>
                                toast("Login failed, either try again or go to sign-up", {
                                        description: date.toLocaleDateString(),
                                        action: {
                                                label: "Register",
                                                onClick: () => navigate("/register"),
                                        },
                                })
                        }
                >
                        Show Toast
                </Button>
        )
}
