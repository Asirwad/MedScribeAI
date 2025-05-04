
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Settings, UserPlus, PanelLeft } from 'lucide-react';
import type { Patient } from '@/services/ehr_client';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void;
  children: React.ReactNode;
  initialSidebarOpen?: boolean; // Add optional prop to control initial state
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  children,
  initialSidebarOpen = true, // Default to true if not provided
}: AppLayoutProps) {
  return (
    // Pass initialSidebarOpen to SidebarProvider's defaultOpen prop
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      {/* Desktop Sidebar Structure */}
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary">MediScribeAI</h1>
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
                        tooltip={patient.name}
                      >
                        <Users />
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
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area wrapper */}
      <div className="flex flex-col flex-1 min-h-svh overflow-hidden">
         {/* Header for Mobile View with Trigger */}
         <MobileHeader />

         {/* SidebarInset provides styling context and handles padding */}
         {/* Content scrolling handled by the child div in page.tsx */}
         <SidebarInset className="flex-1 flex flex-col overflow-hidden">
             {/* The actual page content passed as children */}
             {children}
         </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


// Separate component for mobile header to use the hook
function MobileHeader() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
     <header className={cn(
         "sticky top-0 z-40",
         "flex h-14 items-center justify-between shrink-0",
         "border-b bg-background px-4",
         "md:hidden"
        )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
           <PanelLeft className="h-5 w-5" />
        </Button>
         <h1 className="text-lg font-semibold text-primary">MediScribeAI</h1>
         <div className="w-8"></div> {/* Spacer */}
     </header>
  );
}
