import { postRaise } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Unauthorized() {

        const navigate = useNavigate();
        const [status, setStatus] = useState<boolean | null>(null);

        const handleRaise = async () => {
                try {
                        const status = await postRaise()
                        if (status == 201) {
                                setStatus(true)
                        } else if (status == 202) {
                                setStatus(false)
                        }
                } catch (err) {
                        toast("raise request failed please try again")
                }
        }

        if (status == false) {
                return (
                        <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 px-4 text-center">
                                <div className="text-[6rem] font-bold tracking-tight mb-4 text-green-500 select-none">
                                        ✔
                                </div>
                                <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                                        Successfully Submitted!
                                </h1>
                                <p className="text-sm md:text-base text-zinc-400 mb-6 max-w-md">
                                        Your request has been successfully submitted. You will be notified
                                        when your submission has been reviewed.
                                </p>


                                <div className="absolute bottom-6 text-xs text-zinc-500">
                                        Mirai, 2025 — Designed with restraint ✶
                                </div>
                        </div>
                )
        }

        if (status == true) {
                return (
                        <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 px-4 text-center">
                                <div className="text-[6rem] font-bold tracking-tight mb-4 text-blue-500 select-none">
                                        🎉
                                </div>
                                <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                                        Role Updated!
                                </h1>
                                <p className="text-sm md:text-base text-zinc-400 mb-6 max-w-md">
                                        You have successfully been granted admin privileges. Please proceed.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                        <Button variant="ghost" onClick={() => navigate("/auth")}>
                                                → Proceed
                                        </Button>
                                </div>

                                <div className="absolute bottom-6 text-xs text-zinc-500">
                                        Mirai, 2025 — Designed with restraint ✶
                                </div>
                        </div>
                )
        }
        return (
                <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 px-4 text-center">
                        <div className="text-[8rem] font-bold tracking-tight mb-4 text-zinc-600 select-none">
                                403
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                                Access Denied
                        </h1>
                        <p className="text-sm md:text-base text-zinc-400 mb-6 max-w-md">
                                You don’t have permission to view this page. Please log in with the
                                correct account or raise a request.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                                <Button variant="ghost" onClick={() => navigate("/")}>
                                        ← Back to Home
                                </Button>
                                <Button variant="outline" onClick={handleRaise}>
                                        Raise request →
                                </Button>
                        </div>

                        <div className="absolute bottom-6 text-xs text-zinc-500">
                                Mirai, 2025 — Designed with restraint ✶
                        </div>
                </div>
        );
}
