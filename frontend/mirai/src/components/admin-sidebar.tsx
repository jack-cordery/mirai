import * as React from "react"
import {
        IconDashboard,
        IconInnerShadowTop,
        IconSettings,
        IconCalendarWeek,
        IconCirclePlusFilled,
        IconHome,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
        Sidebar,
        SidebarContent,
        SidebarFooter,
        SidebarHeader,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
        useSidebar,
} from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

const data = {
        navMain: [
                {
                        title: "Quick Create",
                        url: "/admin/create",
                        icon: IconCirclePlusFilled,
                },
                {
                        title: "Home",
                        url: "/admin",
                        icon: IconHome,
                },
                {
                        title: "Dashboard",
                        url: "/admin/dashboard",
                        icon: IconDashboard,
                },
                {
                        title: "Scheduler",
                        url: "/admin/scheduler",
                        icon: IconCalendarWeek,
                },
        ],
        navSecondary: [
                {
                        title: "Settings",
                        url: "/admin/settings",
                        icon: IconSettings,
                },
        ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
        const { user, title } = useAuth();
        const { setPage } = useSidebar();
        const location = useLocation();
        React.useEffect(() => {
                const pageTitle = location.pathname;
                setPage(pageTitle);
        });


        const footerUser = {
                name: "",
                email: user?.email ?? "",
                avatar: "some.jpg",
        }



        return (
                <Sidebar collapsible="offcanvas" {...props}>
                        <SidebarHeader>
                                <SidebarMenu>
                                        <SidebarMenuItem>
                                                <SidebarMenuButton
                                                        asChild
                                                        className="data-[slot=sidebar-menu-button]:!p-1.5"
                                                >
                                                        <a href="/">
                                                                <IconInnerShadowTop className="!size-5" />
                                                                <span className="text-base font-semibold">{title}</span>
                                                        </a>
                                                </SidebarMenuButton>
                                        </SidebarMenuItem>
                                </SidebarMenu>
                        </SidebarHeader>
                        <SidebarContent>
                                <NavMain items={data.navMain} />
                                <NavSecondary items={data.navSecondary} className="mt-auto" />
                        </SidebarContent>
                        <SidebarFooter>
                                <NavUser user={footerUser} />
                        </SidebarFooter >
                </Sidebar >
        )
}
