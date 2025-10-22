import * as React from "react"
import {
        IconCamera,
        IconChartBar,
        IconDashboard,
        IconDatabase,
        IconFileAi,
        IconFileDescription,
        IconFileWord,
        IconFolder,
        IconHelp,
        IconInnerShadowTop,
        IconListDetails,
        IconReport,
        IconSearch,
        IconSettings,
        IconUsers,
        IconCalendarWeek,
        IconCirclePlusFilled,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
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
        user: {
                name: "shadcn",
                email: "m@example.com",
                avatar: "/avatars/shadcn.jpg",
        },
        navMain: [
                {
                        title: "Quick Create",
                        url: "/create",
                        icon: IconCirclePlusFilled,
                },
                {
                        title: "Dashboard",
                        url: "/dashboard",
                        icon: IconDashboard,
                },
                {
                        title: "Scheduler",
                        url: "/scheduler",
                        icon: IconCalendarWeek,
                },
        ],
        navSecondary: [
                {
                        title: "Settings",
                        url: "/settings",
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
                name: (user?.name ?? "" + user?.surname ?? ""),
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
