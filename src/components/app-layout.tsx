
'use client';

import React, { useState } from 'react'; // Import useState
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
import { Users, Settings, UserPlus, PanelLeft, Home, MoreVertical, Trash2, Edit } from 'lucide-react'; // Added icons
import type { Patient } from '@/services/ehr_client';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { DeletePatientDialog } from '@/components/delete-patient-dialog'; // Import the new dialog
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void;
  onReturnToLanding: () => void;
  // Add a callback for after patient deletion
  onPatientDeleted: (deletedPatientId: string) => void;
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onReturnToLanding,
  onPatientDeleted, // Receive the callback
  children,
  initialSidebarOpen = true,
}: AppLayoutProps) {
  return (
    // Pass initialSidebarOpen to SidebarProvider's defaultOpen prop
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <AppLayoutContent
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={onSelectPatient}
        onAddPatient={onAddPatient}
        onReturnToLanding={onReturnToLanding}
        onPatientDeleted={onPatientDeleted} // Pass callback down
      >
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  );
}

// Inner component to access sidebar context
function AppLayoutContent({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onReturnToLanding,
  onPatientDeleted, // Receive callback
  children,
}: Omit<AppLayoutProps, 'initialSidebarOpen'>) {
  const { isMobile, setOpenMobile } = useSidebar(); // Get sidebar context
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const { toast } = useToast();

  const handlePatientSelectAndClose = (patientId: string) => {
    onSelectPatient(patientId);
    if (isMobile) {
      setOpenMobile(false); // Close mobile sidebar on selection
    }
  };

  const handleDeleteClick = (patient: Patient) => {
     setPatientToDelete(patient);
     setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!patientToDelete) return;

      try {
         // Call the parent's delete handler (defined in page.tsx)
         await onPatientDeleted(patientToDelete.id);
         toast({
             title: "Patient Deleted",
             description: `${patientToDelete.name} and all related data have been permanently deleted.`,
         });
         setPatientToDelete(null);
         setIsDeleteDialogOpen(false);
      } catch (error) {
          console.error('Error deleting patient:', error);
          toast({
             title: "Deletion Failed",
             description: `Could not delete ${patientToDelete?.name}. Please try again.`,
             variant: "destructive",
          });
      }
  };

  return (
    <>
      {/* Desktop Sidebar Structure */}
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4 flex justify-between items-center">
          <button onClick={onReturnToLanding} className="flex items-center gap-2 group outline-none focus:ring-2 focus:ring-ring rounded-md p-1 -m-1">
             <span className="text-xl font-semibold text-primary">MedScribeAI</span>
          </button>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-0">
             {/* Wrap patient list in a Group for better visual structure */}
            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="px-4 flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground tracking-wider pt-2 pb-1">
                 <span>Patients</span>
               </SidebarGroupLabel>
              <SidebarGroupContent className="px-2 py-1"> {/* Add padding around the menu */}
                <SidebarMenu>
                  {patients.length === 0 && (
                    <p className="px-2 text-sm text-muted-foreground italic">No patients added yet.</p>
                  )}
                  {patients.map((patient) => (
                    <SidebarMenuItem key={patient.id} className="group/menu-item"> {/* Add group identifier */}
                       <div className="flex items-center w-full"> {/* Flex container for button and dots */}
                          <SidebarMenuButton
                            className="flex-grow justify-start font-normal pr-8" // Add padding for the dots button
                            isActive={selectedPatient?.id === patient.id}
                            onClick={() => handlePatientSelectAndClose(patient.id)}
                            tooltip={patient.name}
                          >
                             <Users />
                             <span className="truncate">{patient.name}</span>
                          </SidebarMenuButton>

                          {/* Dropdown Menu Trigger */}
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 focus:opacity-100 group-data-[state=open]:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden"
                                    onClick={(e) => e.stopPropagation()} // Prevent triggering patient selection
                                  >
                                     <MoreVertical className="h-4 w-4" />
                                     <span className="sr-only">Patient Options</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                className="w-40"
                                onClick={(e) => e.stopPropagation()} // Prevent closing sidebar on mobile
                               >
                                 {/* <DropdownMenuItem disabled>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Rename</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem disabled>
                                     <Users className="mr-2 h-4 w-4" />
                                     <span>Update Info</span>
                                 </DropdownMenuItem> */}
                                 <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={() => handleDeleteClick(patient)}
                                 >
                                     <Trash2 className="mr-2 h-4 w-4" />
                                     <span>Delete Patient</span>
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                       </div>
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
       <div className="flex flex-col flex-1 min-h-svh overflow-hidden">
         <MobileHeader onReturnToLanding={onReturnToLanding} />
         <SidebarInset className="flex-1 flex flex-col overflow-hidden">
             {children}
         </SidebarInset>
       </div>

       {/* Delete Confirmation Dialog */}
        <DeletePatientDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            patientName={patientToDelete?.name ?? ''}
            onConfirm={handleConfirmDelete}
        />
    </>
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
            {/* Placeholder Icon - Consider replacing with a proper logo SVG */}
             <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            <span className="text-lg font-semibold text-primary">MedScribeAI</span>
         </button>
         <div className="w-8 flex-shrink-0"></div> {/* Spacer to balance the layout */}
     </header>
  );
}
