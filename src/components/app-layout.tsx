
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
import { Home, Users, Settings, FileText } from 'lucide-react';
import type { Patient } from '@/services/ehr_client';

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  children: React.ReactNode;
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  children,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="p-4">
          <h1 className="text-xl font-semibold text-primary">MediScribeAI</h1>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-0">
            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="px-4">Patients</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {patients.map((patient) => (
                    <SidebarMenuItem key={patient.id}>
                      <SidebarMenuButton
                        className="justify-start"
                        isActive={selectedPatient?.id === patient.id}
                        onClick={() => onSelectPatient(patient.id)}
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
        <SidebarFooter className="p-4">
          <Button variant="ghost" className="justify-start gap-2">
            <Settings /> Settings
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
