
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger, // Keep import for potential future use if needed, but mainly for mobile trigger logic
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarGroupContent,
  useSidebar, // Import useSidebar hook
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Settings, UserPlus, PanelLeft } from 'lucide-react'; // Import PanelLeft for mobile trigger
import type { Patient } from '@/services/ehr_client';
import { ThemeToggle } from '@/components/theme-toggle';

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void; // Callback to open the add patient form
  children: React.ReactNode;
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient, // Receive the callback
  children,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      {/* Desktop Sidebar Structure */}
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary">MediScribeAI</h1>
           {/* Removed SidebarTrigger from here - moved to MobileHeader */}
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-0">
            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="px-4 flex justify-between items-center">
                 <span>Patients</span>
               </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {patients.length === 0 && (
                    <p className="px-4 text-sm text-muted-foreground italic">No patients added yet.</p>
                  )}
                  {patients.map((patient) => (
                    <SidebarMenuItem key={patient.id}>
                      <SidebarMenuButton
                        className="justify-start"
                        isActive={selectedPatient?.id === patient.id}
                        onClick={() => onSelectPatient(patient.id)}
                        tooltip={patient.name} // Add tooltip for collapsed state
                      >
                        <Users /> {/* Keep icon */}
                        <span>{patient.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </ScrollArea>
        <SidebarFooter className="p-4 border-t border-sidebar-border flex flex-col gap-2">
           <Button variant="outline" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2" onClick={onAddPatient} aria-label='Add Patient'>
             <UserPlus /> <span className="group-data-[collapsible=icon]:hidden">Add Patient</span>
           </Button>
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <Button variant="ghost" className="flex-1 justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex-none" aria-label='Settings'>
              <Settings /> <span className="group-data-[collapsible=icon]:hidden">Settings</span>
            </Button>
            <ThemeToggle /> {/* Add ThemeToggle */}
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset>
         {/* Header for Mobile View with Trigger */}
         <MobileHeader />
         {/* The actual page content */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}


// Separate component for mobile header to use the hook
function MobileHeader() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
     // Sticky header visible only on mobile (md:hidden)
     <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        {/* Mobile Sidebar Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8" // Consistent icon button size
          onClick={toggleSidebar} // Use the hook's toggle function
          aria-label="Toggle Sidebar"
        >
           <PanelLeft className="h-5 w-5" />
        </Button>

        {/* Optional: Mobile App Title/Logo */}
         <h1 className="text-lg font-semibold text-primary">MediScribeAI</h1>

        {/* Placeholder for other potential mobile header items */}
         <div className="w-8"></div> {/* Spacer to balance the layout */}
     </header>
  );
}
