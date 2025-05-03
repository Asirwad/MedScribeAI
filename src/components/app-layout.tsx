
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Home, Users, Settings, FileText, UserPlus } from 'lucide-react'; // Added UserPlus
import type { Patient } from '@/services/ehr_client';

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
      <Sidebar>
        <SidebarHeader className="p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary">MediScribeAI</h1>
           <SidebarTrigger /> {/* Keep trigger if needed */}
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-0">
            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="px-4 flex justify-between items-center">
                 <span>Patients</span>
                 {/* Add Patient Button integrated into label or separate button */}
                 {/* Option 1: Button within Label */}
                 {/* <Button variant="ghost" size="sm" onClick={onAddPatient} className="h-auto p-1">
                   <UserPlus className="h-4 w-4" />
                 </Button> */}
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
                      >
                        <Users className="h-4 w-4" /> {/* Adjusted icon size */}
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
          {/* Option 2: Add Patient button in Footer */}
           <Button variant="outline" className="w-full justify-start gap-2" onClick={onAddPatient}>
             <UserPlus /> Add Patient
           </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings /> Settings
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
