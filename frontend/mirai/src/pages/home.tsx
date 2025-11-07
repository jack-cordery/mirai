import { Title } from "@/components/title";
import { ModeToggle } from "@/components/mode-toggle"; // example

export default function Home() {
        return (
                <div className="w-screen h-screen relative overflow-hidden">
                        <div className="absolute top-4 right-4 z-50">
                                <ModeToggle />
                        </div>

                        <div className="w-full h-full flex flex-col items-center justify-center">
                                <Title />
                        </div>
                </div>
        );
}

