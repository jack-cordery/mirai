import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export default function AppSidebarLayout() {
        return (
                <SidebarProvider
                        defaultOpen={false}
                >
                        <div className="flex w-full min-h-screen">
                                <AppSidebar />

                                <main className="relative flex-1 h-screen overflow-hidden bg-background">
                                        <div className="absolute top-4 left-4 z-30">
                                                <SidebarTrigger />
                                        </div>
                                        <div className="relative z-10 h-full">
                                                <Outlet />
                                        </div>
                                </main>
                        </div>
                </SidebarProvider>
        )
}
