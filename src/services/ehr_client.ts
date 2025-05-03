/**
 * Represents a patient record.
 */
export interface Patient {
  /**
   * The patient's ID.
   */
  id: string;
  /**
   * The patient's name.
   */
  name: string;
  /**
   * The patient's date of birth.
   */
  dateOfBirth: string;
  /**
   * The patient's gender.
   */
  gender: string;
}

/**
 * Represents a clinical observation for a patient.
 */
export interface Observation {
  /**
   * The observation's ID.
   */
  id: string;
  /**
   * The observation's type or code (e.g., blood pressure, temperature).
   */
  code: string;
  /**
   * The observation's value.
   */
  value: string;
  /**
   * The units of the observation value.
   */
  units?: string;
  /**
   * The date and time the observation was recorded.
   */
  date: string;
}

/**
 * Represents a patient encounter.
 */
export interface Encounter {
  /**
   * The encounter's ID.
   */
  id: string;
  /**
   * The encounter's type or class (e.g., inpatient, outpatient).
   */
  class: string;
  /**
   * The start date and time of the encounter.
   */
  startDate: string;
  /**
   * The end date and time of the encounter.
   */
  endDate?: string;
  /**
   * The reason for the encounter.
   */
  reason?: string;
}

// Mock Data Store (simulating a database)
const mockPatientsStore: Record<string, Patient> = {
  '123': { id: '123', name: 'John Doe', dateOfBirth: '1970-01-01', gender: 'Male' },
  '456': { id: '456', name: 'Jane Smith', dateOfBirth: '1985-05-15', gender: 'Female' },
  '789': { id: '789', name: 'Robert Johnson', dateOfBirth: '1992-11-30', gender: 'Male' },
};

const mockObservationsStore: Record<string, Observation[]> = {
  '123': [
    { id: 'obs1', code: 'blood_pressure', value: '120/80', units: 'mmHg', date: '2024-07-15' },
    { id: 'obs2', code: 'heart_rate', value: '72', units: 'bpm', date: '2024-07-15' },
    { id: 'obs3', code: 'temperature', value: '37.0', units: 'C', date: '2024-07-14' },
  ],
  '456': [
    { id: 'obs4', code: 'blood_pressure', value: '110/70', units: 'mmHg', date: '2024-07-10' },
     { id: 'obs5', code: 'weight', value: '65', units: 'kg', date: '2024-07-10' },
  ],
   '789': [
    { id: 'obs6', code: 'blood_glucose', value: '95', units: 'mg/dL', date: '2024-06-20' },
  ],
};

const mockEncountersStore: Record<string, Encounter[]> = {
  '123': [
    { id: 'enc1', class: 'outpatient', startDate: '2024-07-15', reason: 'Annual checkup' },
    { id: 'enc2', class: 'telehealth', startDate: '2024-05-01', reason: 'Follow-up' },
  ],
  '456': [
    { id: 'enc3', class: 'outpatient', startDate: '2024-07-10', reason: 'Consultation' },
  ],
  '789': [
    { id: 'enc4', class: 'inpatient', startDate: '2024-06-18', endDate: '2024-06-22', reason: 'Procedure' },
     { id: 'enc5', class: 'outpatient', startDate: '2024-03-11', reason: 'Initial visit' },
  ],
};

const mockNotesStore: Record<string, string[]> = {
    '123': [],
    '456': [],
    '789': [],
};


// Simulate API call delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Asynchronously retrieves patient data from the EHR simulation.
 *
 * @param patientId The ID of the patient to retrieve.
 * @returns A promise that resolves to a Patient object or throws an error if not found.
 */
export async function getPatient(patientId: string): Promise<Patient> {
  await delay(150); // Simulate network latency
  const patient = mockPatientsStore[patientId];
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found.`);
  }
  console.log(`[EHR Client] Fetched patient: ${patientId}`);
  return patient;
}

/**
 * Asynchronously retrieves observations for a patient from the EHR simulation.
 *
 * @param patientId The ID of the patient to retrieve observations for.
 * @returns A promise that resolves to an array of Observation objects. Returns empty array if no observations.
 */
export async function getObservations(patientId: string): Promise<Observation[]> {
   await delay(200); // Simulate network latency
   const observations = mockObservationsStore[patientId] || [];
   console.log(`[EHR Client] Fetched ${observations.length} observations for patient: ${patientId}`);
   return observations;
}

/**
 * Asynchronously retrieves encounters for a patient from the EHR simulation.
 *
 * @param patientId The ID of the patient to retrieve encounters for.
 * @returns A promise that resolves to an array of Encounter objects. Returns empty array if no encounters.
 */
export async function getEncounters(patientId: string): Promise<Encounter[]> {
   await delay(250); // Simulate network latency
   const encounters = mockEncountersStore[patientId] || [];
   console.log(`[EHR Client] Fetched ${encounters.length} encounters for patient: ${patientId}`);
   return encounters;
}

/**
 * Asynchronously posts a clinical note to the EHR simulation.
 *
 * @param patientId The ID of the patient the note belongs to.
 * @param noteContent The content of the note to post.
 * @returns A promise that resolves when the note has been successfully posted or throws an error.
 */
export async function postNote(patientId: string, noteContent: string): Promise<void> {
  await delay(300); // Simulate network latency
  if (!mockNotesStore.hasOwnProperty(patientId)) {
     throw new Error(`Cannot post note for non-existent patient ID: ${patientId}`);
   }
  mockNotesStore[patientId].push(noteContent);
  console.log(`[EHR Client] Posted note for patient ${patientId}. Total notes: ${mockNotesStore[patientId].length}`);
  console.log(`[EHR Client] Note content: ${noteContent.substring(0, 100)}...`); // Log truncated content
  // In a real scenario, you might return the ID of the newly created note or confirm success.
}

// Example of how you might add a new patient (not used in the app currently, but shows pattern)
// export async function createPatient(patientData: Omit<Patient, 'id'>): Promise<Patient> {
//   await delay(400);
//   const newId = `pat_${Math.random().toString(36).substring(2, 9)}`;
//   const newPatient: Patient = { ...patientData, id: newId };
//   mockPatientsStore[newId] = newPatient;
//   mockObservationsStore[newId] = [];
//   mockEncountersStore[newId] = [];
//   mockNotesStore[newId] = [];
//   console.log(`[EHR Client] Created new patient: ${newId}`);
//   return newPatient;
// }
