
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
import { Users, Settings, UserPlus, PanelLeft, Home } from 'lucide-react'; // Added Home icon
import type { Patient } from '@/services/ehr_client';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void;
  onReturnToLanding: () => void; // Added prop for returning to landing
  children: React.ReactNode;
  initialSidebarOpen?: boolean; // Add optional prop to control initial state
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onReturnToLanding, // Destructure the new prop
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
          <button onClick={onReturnToLanding} className="flex items-center gap-2 group outline-none focus:ring-2 focus:ring-ring rounded-md p-1 -m-1">
             <span className="text-xl font-semibold text-primary">MedScribeAI</span> {/* Renamed */}
          </button>
          {/* Add the return to landing button here maybe? Or keep in footer */}
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
            {/* Add button to return to landing page */}
             <Button variant="outline" className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2" onClick={onReturnToLanding} aria-label='Return Home'>
                <Home /> <span className="group-data-[collapsible=icon]:hidden">Return Home</span>
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
      {/* Apply overflow-hidden to prevent content scrollbar when sidebar is open */}
      <div className="flex flex-col flex-1 min-h-svh overflow-hidden">
         {/* Header for Mobile View with Trigger */}
         <MobileHeader onReturnToLanding={onReturnToLanding} /> {/* Pass handler */}

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
function MobileHeader({ onReturnToLanding }: { onReturnToLanding: () => void }) {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
     <header className={cn(
         "sticky top-0 z-40", // Ensure it stays on top
         "flex h-14 items-center justify-between shrink-0", // Fixed height, flex layout
         "border-b bg-background px-4", // Styling
         "md:hidden" // Only show on mobile
        )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0" // Ensure button doesn't shrink
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
           <PanelLeft className="h-5 w-5" />
        </Button>
         {/* Centered Title/Logo that can link home */}
         <button onClick={onReturnToLanding} className="flex items-center gap-1 outline-none focus:ring-2 focus:ring-ring rounded-md p-1 -m-1">
            <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            <span className="text-lg font-semibold text-primary">MedScribeAI</span> {/* Renamed */}
         </button>
         <div className="w-8 flex-shrink-0"></div> {/* Spacer to balance the layout */}
     </header>
  );
}
