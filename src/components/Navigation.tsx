import { useAuth } from '@/components/auth/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from '@/components/ui/navigation-menu';
import { 
  Wrench, 
  Users, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  CreditCard,
  TrendingUp
} from 'lucide-react';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export function Navigation({ currentView, setCurrentView }: NavigationProps) {
  const { user, userRole, signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'jobs', label: t('nav.jobs'), icon: ClipboardList, roles: ['admin', 'technician', 'counter'] },
    { id: 'pos', label: 'Point of Sale', icon: CreditCard, roles: ['admin', 'cashier', 'clerk', 'counter', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'counter'] },
    { id: 'account-customers', label: 'Account Customers', icon: Users, roles: ['admin', 'counter', 'manager'] },
    { id: 'parts', label: t('nav.parts'), icon: Package, roles: ['admin', 'technician', 'counter'] },
    { id: 'analytics', label: 'Reports & Analytics', icon: TrendingUp, roles: ['admin', 'manager'] },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3, roles: ['admin'] },
    { id: 'settings', label: t('nav.settings'), icon: Settings, roles: ['admin'] },
  ];

  const availableMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole || '')
  );

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Wrench className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Job Manager</span>
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              {availableMenuItems.map((item) => (
                <NavigationMenuItem key={item.id}>
                  <Button
                    variant={currentView === item.id ? "default" : "ghost"}
                    onClick={() => setCurrentView(item.id)}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="text-sm">{user?.email}</span>
            <Badge variant="secondary" className="capitalize">
              {userRole}
            </Badge>
          </div>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}