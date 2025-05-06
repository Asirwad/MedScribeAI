
'use client';

import React, { useState, useMemo, useEffect } from 'react'; // Import useState, useMemo, useEffect
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
import { Users, Settings, UserPlus, PanelLeft, Home, MoreVertical, Trash2, Edit, Search, X } from 'lucide-react'; // Added Search, X
import type { Patient } from '@/services/ehr_client';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DeletePatientDialog } from '@/components/delete-patient-dialog';
import { useToast } from '@/hooks/use-toast';
import { UpdatePatientForm } from '@/components/update-patient-form';
import { Input } from '@/components/ui/input'; // Import Input
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'; // Import Tooltip components for search clear

interface AppLayoutProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void;
  onReturnToLanding: () => void;
  onPatientDeleted: (deletedPatientId: string) => void;
  onPatientUpdated: (updatedPatientId: string, updatedData: Omit<Patient, 'id'>) => Promise<void>;
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
}

export function AppLayout({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onReturnToLanding,
  onPatientDeleted,
  onPatientUpdated,
  children,
  initialSidebarOpen = true,
}: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <AppLayoutContent
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={onSelectPatient}
        onAddPatient={onAddPatient}
        onReturnToLanding={onReturnToLanding}
        onPatientDeleted={onPatientDeleted}
        onPatientUpdated={onPatientUpdated}
      >
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  );
}

// Helper function for highlighting search terms
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight) {
    return <span>{text}</span>;
  }
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={index} className="font-bold text-primary">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </span>
  );
};


// Inner component to access sidebar context
function AppLayoutContent({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onReturnToLanding,
  onPatientDeleted,
  onPatientUpdated,
  children,
}: Omit<AppLayoutProps, 'initialSidebarOpen'>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToUpdate, setPatientToUpdate] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const { toast } = useToast();

  const handlePatientSelectAndClose = (patientId: string) => {
    onSelectPatient(patientId);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDeleteClick = (patient: Patient) => {
     setPatientToDelete(patient);
     setIsDeleteDialogOpen(true);
  };

  const handleUpdateClick = (patient: Patient) => {
      setPatientToUpdate(patient);
      setIsUpdateDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!patientToDelete) return;

      try {
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

  const handleConfirmUpdate = async (updatedData: Omit<Patient, 'id'>) => {
     if (!patientToUpdate) return;

     try {
         await onPatientUpdated(patientToUpdate.id, updatedData);
         toast({
             title: "Patient Updated",
             description: `${updatedData.name}'s details have been updated.`,
         });
         setPatientToUpdate(null);
         setIsUpdateDialogOpen(false);
     } catch (error) {
         console.error('Error updating patient:', error);
         toast({
             title: "Update Failed",
             description: `Could not update ${patientToUpdate?.name}'s details. Please try again.`,
             variant: "destructive",
         });
     }
  };

   // Filter patients based on search query
   const filteredPatients = useMemo(() => {
     if (!searchQuery) {
       return patients;
     }
     return patients.filter(patient =>
       patient.name.toLowerCase().includes(searchQuery.toLowerCase())
     );
   }, [patients, searchQuery]);

   // Clear search query
   const clearSearch = () => {
       setSearchQuery('');
   };

   // Close mobile sidebar if search query is cleared
   useEffect(() => {
       if (isMobile && !searchQuery) {
           // Optional: Close mobile sidebar when search is cleared?
           // setOpenMobile(false);
       }
   }, [searchQuery, isMobile, setOpenMobile]);


  return (
    <>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="p-4 flex justify-between items-center">
          <button onClick={onReturnToLanding} className="flex items-center gap-2 group outline-none focus:ring-2 focus:ring-ring rounded-md p-1 -m-1">
             <span className="text-xl font-semibold text-primary">MedScribeAI</span>
          </button>
        </SidebarHeader>
        <ScrollArea className="flex-1">
          <SidebarContent className="p-0">
            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="px-4 flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground tracking-wider pt-2 pb-1">
                 <span>Patients</span>
                 {/* Search Icon - Consider removing if input is always visible */}
                 {/* <Search className="h-4 w-4 text-muted-foreground" /> */}
               </SidebarGroupLabel>

                {/* Search Input - Positioned below the label */}
                <div className="px-4 py-2 relative group-data-[collapsible=icon]:hidden">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                       type="text"
                       placeholder="Search patients..."
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-8 h-8 text-sm bg-sidebar-accent/50 border-sidebar-border focus:ring-primary/50" // Adjusted style
                    />
                    {searchQuery && (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Clear search</p>
                            </TooltipContent>
                         </Tooltip>
                    )}
                </div>

              <SidebarGroupContent className="px-2 py-1">
                <SidebarMenu>
                  {filteredPatients.length === 0 && (
                    <p className="px-2 text-sm text-muted-foreground italic">
                        {searchQuery ? 'No patients match your search.' : 'No patients added yet.'}
                    </p>
                  )}
                  {filteredPatients.map((patient) => (
                    <SidebarMenuItem key={patient.id} className="group/menu-item">
                       <div className="flex items-center w-full">
                          <SidebarMenuButton
                            className="flex-grow justify-start font-normal pr-8"
                            isActive={selectedPatient?.id === patient.id}
                            onClick={() => handlePatientSelectAndClose(patient.id)}
                            tooltip={patient.name}
                          >
                             <Users />
                             {/* Use HighlightedText component */}
                             <span className="truncate">
                                 <HighlightedText text={patient.name} highlight={searchQuery} />
                             </span>
                          </SidebarMenuButton>

                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground opacity-0 group-hover/menu-item:opacity-100 focus:opacity-100 group-data-[state=open]:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                     <MoreVertical className="h-4 w-4" />
                                     <span className="sr-only">Patient Options</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side="right"
                                align="start"
                                className="w-48"
                                onClick={(e) => e.stopPropagation()}
                               >
                                  <DropdownMenuItem onClick={() => handleUpdateClick(patient)}>
                                     <Edit className="mr-2 h-4 w-4" />
                                     <span>Update Info</span>
                                  </DropdownMenuItem>
                                 <DropdownMenuSeparator />
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

       <div className="flex flex-col flex-1 min-h-svh overflow-hidden">
         <MobileHeader onReturnToLanding={onReturnToLanding} />
         <SidebarInset className="flex-1 flex flex-col overflow-hidden">
             {children}
         </SidebarInset>
       </div>

        <DeletePatientDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            patientName={patientToDelete?.name ?? ''}
            onConfirm={handleConfirmDelete}
        />
        {patientToUpdate && (
          <UpdatePatientForm
            isOpen={isUpdateDialogOpen}
            onOpenChange={setIsUpdateDialogOpen}
            patientData={patientToUpdate}
            onPatientUpdated={handleConfirmUpdate}
          />
        )}
    </>
  );
}


function MobileHeader({ onReturnToLanding }: { onReturnToLanding: () => void }) {
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
          className="h-8 w-8 flex-shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
        >
           <PanelLeft className="h-5 w-5" />
        </Button>
         <button onClick={onReturnToLanding} className="flex items-center gap-1 outline-none focus:ring-2 focus:ring-ring rounded-md p-1 -m-1">
             <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
            <span className="text-lg font-semibold text-primary">MedScribeAI</span>
         </button>
         <div className="w-8 flex-shrink-0"></div>
     </header>
  );
}
