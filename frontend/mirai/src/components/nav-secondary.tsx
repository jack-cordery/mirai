"use client"

import * as React from "react"
import { IconLock, IconUser, type Icon } from "@tabler/icons-react"

import {
        SidebarGroup,
        SidebarGroupContent,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
        useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export function NavSecondary({
        items,
        ...props
}: {
        items: {
                title: string
                url: string
                icon: Icon
        }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
        const { page } = useSidebar();
        const { admin } = useAuth();

        return (
                <SidebarGroup {...props}>
                        <SidebarGroupContent>
                                <SidebarMenu>
                                        {items.map((item) => (
                                                <SidebarMenuItem key={item.title}>
                                                        <SidebarMenuButton
                                                                className={`${page == item.url ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear" : ""}`}
                                                                asChild>
                                                                <a href={item.url}>
                                                                        <item.icon />
                                                                        <span>{item.title}</span>
                                                                </a>
                                                        </SidebarMenuButton>
                                                </SidebarMenuItem>
                                        ))}
                                        <SidebarMenuItem key="admin">
                                                <SidebarMenuButton
                                                        className=""
                                                        asChild>
                                                        {admin ?
                                                                <a href="/user">
                                                                        <IconUser />
                                                                        <span>User</span>
                                                                </a>
                                                                :
                                                                <a href="/admin">
                                                                        <IconLock />
                                                                        <span>Admin</span>
                                                                </a>
                                                        }
                                                </SidebarMenuButton>
                                        </SidebarMenuItem>
                                </SidebarMenu>
                        </SidebarGroupContent>
                </SidebarGroup>
        )
}
