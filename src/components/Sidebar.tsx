
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "./NotificationCenter";
import { 
  Sidebar as ShadcnSidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }: SidebarProps) => {
  const { state, toggleSidebar } = useSidebar();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'properties', label: 'Properties', icon: '🏢' },
    { id: 'tenants', label: 'Tenants', icon: '👥' },
    { id: 'leases', label: 'Lease Management', icon: '📋' },
    { id: 'rent-tracking', label: 'Rent Tracking', icon: '💰' },
    { id: 'expense-tracking', label: 'Expense Tracking', icon: '💸' },
    { id: 'billing', label: 'Billing & Reports', icon: '📈' },
    { id: 'problems', label: 'Problem Reporting', icon: '⚠️' },
    { id: 'documents', label: 'Documents', icon: '📄' }
  ];

  const filteredMenuItems = menuItems;

  return (
    <ShadcnSidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b border-border overflow-hidden">
        <div className={`flex items-center ${state === 'expanded' ? 'justify-between p-4' : 'justify-center p-2'}`}>
          <div className={`flex items-center gap-2 ${state === 'collapsed' ? 'sr-only' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RM</span>
            </div>
            <span className="text-lg font-semibold whitespace-nowrap">
              Rental Management
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 flex-shrink-0"
          >
            {state === 'expanded' ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* Enhanced Header with Search and Actions */}
        <div className={`p-4 ${state === 'collapsed' ? 'px-2' : ''}`}>
          <div className={`flex items-center space-x-3 mb-4 ${state === 'collapsed' ? 'justify-center' : ''}`}>
            <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {state === 'expanded' && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@example.com'}</p>
                {user?.role && (
                  <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {user.role}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Action Bar Removed */}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu>
          {filteredMenuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                isActive={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                tooltip={state === 'collapsed' ? item.label : undefined}
                className={`${activeTab === item.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''} hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={state === 'collapsed' ? 'sr-only' : ''}>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {state === 'expanded' ? 'Logout' : ''}
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
};

export default Sidebar;
