import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
        const navigate = useNavigate();
        return (
                <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 px-4 text-center">
                        <div className="text-[8rem] font-bold tracking-tight mb-4 text-zinc-600 select-none">
                                404
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
                                Page Not Found
                        </h1>
                        <p className="text-sm md:text-base text-zinc-400 mb-6 max-w-md">
                                The page you’re looking for doesn’t exist or has been moved.
                        </p>
                        <Button
                                variant="ghost"
                                onClick={() => navigate("/")}
                        >
                                ← Back to Home
                        </Button>
                        <div className="absolute bottom-6 text-xs text-zinc-500">
                                Mirai, 2025 — Designed with restraint ✶
                        </div>
                </div>
        );
}
