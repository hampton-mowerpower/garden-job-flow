import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Users, 
  Settings, 
  Package, 
  BarChart3, 
  LogOut,
  UserCog
} from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

const navigationItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/parts', icon: Package, label: 'Parts Catalogue' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/admin', icon: Settings, label: 'Admin Settings' },
]

export function Navigation() {
  const location = useLocation()
  const { user, userRole, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="bg-card border-r border-border p-4 min-h-screen">
      <div className="space-y-2">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Job Booking System</h2>
          {user && (
            <div className="text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>{user.email}</span>
                <Badge variant="secondary" className="text-xs">
                  {userRole}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {navigationItems.map((item) => (
          <Button
            key={item.path}
            asChild
            variant={location.pathname === item.path ? 'default' : 'ghost'}
            className="w-full justify-start"
          >
            <Link to={item.path}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}

        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}