"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CreditCard, Users, LayoutDashboard, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/people", label: "Personas", icon: Users },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              Gastos Tarjeta
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-1.5",
                    pathname === item.href && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex items-center gap-1 border-t px-4 py-1 sm:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex-1">
            <Button
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full gap-1.5",
                pathname === item.href && "bg-secondary text-secondary-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
    </header>
  )
}
