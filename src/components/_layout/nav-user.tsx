/** @format */

"use client";

import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { db } from "@/lib/db";
import { GoogleSignInButton } from "@/components/_auth/GoogleSignInButton";

function NavUserSignedIn() {
    const { isMobile } = useSidebar();
    const user = db.useUser();
    const { data, isLoading } = db.useQuery({
        profiles: {
            $: {
                where: { "user.id": user.id },
            },
        },
    });

    const profile = data?.profiles?.[0];
    const userName = profile
        ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
          "User"
        : "User";
    const userPlan = profile?.plan || "free";
    const userAvatar = profile?.googlePicture || user.imageURL || "";

    const handleSignOut = () => {
        db.auth.signOut();
    };

    const getInitials = (name: string) => {
        const parts = name.split(" ");
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name[0]?.toUpperCase() || "U";
    };

    if (isLoading) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        size="lg"
                        disabled
                    >
                        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={userAvatar}
                                    alt={userName}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {userName}
                                </span>
                                <span className="truncate text-xs capitalize">
                                    {userPlan}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={userAvatar}
                                        alt={userName}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {getInitials(userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {userName}
                                    </span>
                                    <span className="truncate text-xs capitalize">
                                        {userPlan}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Sparkles />
                                Upgrade to Pro
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <BadgeCheck />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <CreditCard />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Bell />
                                Notifications
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

function NavUserSignedOut() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="px-2 py-2">
                    <GoogleSignInButton />
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export function NavUser() {
    return (
        <>
            <db.SignedIn>
                <NavUserSignedIn />
            </db.SignedIn>
            <db.SignedOut>
                <NavUserSignedOut />
            </db.SignedOut>
        </>
    );
}
