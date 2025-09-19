"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Calendar,
  Heart,
  Award,
  Settings,
  LogOut,
  Building2,
  UserCheck,
} from "lucide-react"
import type { Profile } from "@/lib/types"
import type { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Bell, Moon, Sun, Mail, AlertCircle } from "lucide-react"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: Profile
  user?: User
}

export function DashboardLayout({ children, profile, user }: DashboardLayoutProps) {
  const [showVerificationBanner, setShowVerificationBanner] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Base navigation items for all roles
  const baseNavigationItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/alumni", icon: Users, label: "Alumni Network" },
    { href: "/dashboard/events", icon: Calendar, label: "Events" },
    { href: "/dashboard/mentorship", icon: UserCheck, label: "Mentorship" },
    { href: "/dashboard/donations", icon: Heart, label: "Donations" },
    { href: "/dashboard/achievements", icon: Award, label: "Achievements" },
  ]

  // Role-specific navigation items
  const roleSpecificItems = []
  if (profile.role === "super_admin") {
    roleSpecificItems.push({ href: "/dashboard/universities", icon: Building2, label: "Universities" })
  }

  const navigationItems = [...baseNavigationItems.slice(0, 1), ...roleSpecificItems, ...baseNavigationItems.slice(1)]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/40 bg-card/30 backdrop-blur">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border/40 px-6">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">LegacyLink</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="border-t border-border/40 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start space-x-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{profile.full_name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{profile.role.replace("_", " ")}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Welcome,</span>
            <span className="font-medium text-foreground">{profile.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {/* Notifications (placeholder) */}
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            {/* Visible Logout */}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
        {/* Email Verification Banner */}
        {user && !user.email_confirmed_at && showVerificationBanner && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    Email Verification Required
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please verify your email to complete your profile and access all features.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/auth/verify-email">
                  <Button 
                    size="sm" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Verify Email
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowVerificationBanner(false)}
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
