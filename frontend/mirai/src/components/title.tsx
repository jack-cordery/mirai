import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { Button } from "./ui/button";
import { useNavigate } from 'react-router-dom';

export function Title() {
        const navigate = useNavigate();
        return (

                <BackgroundBeamsWithCollision>
                        <div className="relative z-20 text-center">
                                <h2 className="text-2xl md:text-4xl lg:text-7xl font-bold text-black dark:text-white font-sans tracking-tight">
                                        Organise your Future!
                                        <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                                                <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                                                        <span>With Mirai.</span>
                                                </div>
                                                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                                                        <span>With Mirai.</span>
                                                </div>
                                        </div>
                                </h2>

                                <div className="mt-20">
                                        <Button className="text-2xl" variant="ghost" onClick={() => { navigate("/login") }}>
                                                Login
                                        </Button>
                                </div>
                        </div>
                </BackgroundBeamsWithCollision>);
}
