
import { db } from '@/lib/firebase'; // Import Firestore instance
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc, // Use setDoc for postNote if note ID is known or not needed as return
    query,
    where,
    orderBy,
    limit,
    Timestamp, // Use Firestore Timestamp for dates if possible
    serverTimestamp, // For setting creation time automatically
    writeBatch, // Import writeBatch for atomic deletes
    deleteDoc, // Import deleteDoc
} from 'firebase/firestore';

/**
 * Represents a patient record in Firestore.
 */
export interface Patient {
    /**
     * The patient's ID (Firestore document ID).
     */
    id: string;
    /**
     * The patient's name.
     */
    name: string;
    /**
     * The patient's date of birth (YYYY-MM-DD string for simplicity, consider Timestamp).
     */
    dateOfBirth: string;
    /**
     * The patient's gender.
     */
    gender: string;
    // Optional: Add created/updated timestamps if needed
    // createdAt?: Timestamp;
}

/**
 * Represents a clinical observation for a patient in Firestore.
 * This is for specific, measurable data points (e.g., vitals, labs).
 */
export interface Observation {
    /**
     * The observation's ID (Firestore document ID).
     */
    id: string;
    /**
     * The observation's type or code (e.g., 'blood_pressure', 'heart_rate', 'ChiefComplaint').
     */
    code: string;
    /**
     * The observation's measured value (e.g., '120/80', '72').
     */
    value: string;
    /**
     * The units of the observation value (e.g., 'mmHg', 'bpm').
     */
    units?: string;
    /**
     * The date the observation was recorded (YYYY-MM-DD string, consider Timestamp).
     */
    date: string; // Store as string for now to match previous mock, but Timestamp is better
    /**
     * Reference to the patient this observation belongs to.
     */
    patientId: string;
    // Optional: Use Firestore Timestamp for better querying/sorting
    // recordedAt?: Timestamp;
}

/**
 * Represents a patient encounter in Firestore.
 * This is for visits or interactions (e.g., outpatient, emergency).
 */
export interface Encounter {
    /**
     * The encounter's ID (Firestore document ID).
     */
    id: string;
    /**
     * The encounter's type or class (e.g., 'outpatient', 'emergency').
     */
    class: string;
    /**
     * The start date of the encounter (YYYY-MM-DD string, consider Timestamp).
     */
    startDate: string;
    /**
     * The end date of the encounter (optional, YYYY-MM-DD string).
     */
    endDate?: string;
    /**
     * The primary reason for the encounter (e.g., 'Follow-up', 'Annual physical').
     */
    reason?: string;
    /**
     * Reference to the patient this encounter belongs to.
     */
    patientId: string;
    // Optional: Use Firestore Timestamp
    // startedAt?: Timestamp;
    // endedAt?: Timestamp;
}

/**
 * Represents a clinical note (like a SOAP note) in Firestore.
 */
export interface Note {
    id: string;
    patientId: string;
    content: string;
    createdAt: Timestamp; // Use server timestamp for creation time
}


// Firestore Collection References
const patientsCollection = collection(db, 'patients');
const observationsCollection = collection(db, 'observations');
const encountersCollection = collection(db, 'encounters');
const notesCollection = collection(db, 'notes');

// Simulate API call delay (optional, can be removed)
// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Asynchronously retrieves a list of all patients from Firestore.
 * Logs detailed error if fetch fails.
 *
 * @returns A promise that resolves to an array of Patient objects.
 * @throws An error if fetching from Firestore fails.
 */
export async function getPatientsList(): Promise<Patient[]> {
    try {
        const snapshot = await getDocs(patientsCollection);
        const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        console.log(`[EHR Client] Fetched ${patients.length} patients from Firestore.`);
        // Handle cases where snapshot exists but is empty (valid case, not an error)
        if (patients.length === 0) {
            console.log("[EHR Client] No patients found in the 'patients' collection.");
        }
        return patients;
    } catch (error: any) { // Catch specific error type if known, otherwise 'any'
        // Log the detailed error object for debugging
        console.error("Error fetching patients list from Firestore:", error);
        // Check for specific Firestore error codes if needed
        if (error.code === 'permission-denied') {
             console.error("Firestore permission denied. Check your security rules.");
        } else if (error.code === 'unauthenticated') {
             console.error("Firestore request unauthenticated. Ensure user is logged in or rules allow public access.");
        } else if (error.code === 'unavailable') {
            console.error("Firestore service unavailable. Check Firebase status or network connection.");
        }
        // Re-throw a user-friendly error, but the detailed one is logged above
        throw new Error('Failed to fetch patients list from Firestore. Check console/logs for details.');
    }
}


/**
 * Asynchronously retrieves patient data from Firestore.
 *
 * @param patientId The ID of the patient to retrieve.
 * @returns A promise that resolves to a Patient object or null if not found or on error.
 */
export async function getPatient(patientId: string): Promise<Patient | null> {
    // await delay(150); // Optional delay
    try {
        const docRef = doc(db, 'patients', patientId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.warn(`[EHR Client] Patient with ID ${patientId} not found in Firestore.`);
            return null; // Return null if not found
        }
        console.log(`[EHR Client] Fetched patient: ${patientId} from Firestore.`);
        return { id: docSnap.id, ...docSnap.data() } as Patient;
    } catch (error) {
        console.error(`Error fetching patient ${patientId}:`, error);
        // Return null on error instead of throwing
        return null;
    }
}

/**
 * Asynchronously retrieves recent observations (specific measurements) for a patient from Firestore.
 *
 * @param patientId The ID of the patient to retrieve observations for.
 * @param count The maximum number of observations to retrieve.
 * @returns A promise that resolves to an array of Observation objects. Returns empty array if no observations or on error.
 */
export async function getObservations(patientId: string, count: number = 5): Promise<Observation[]> {
    // await delay(200); // Optional delay
    try {
        // Query observations for the specific patient, order by date descending, limit results
        const q = query(
            observationsCollection,
            where('patientId', '==', patientId),
            orderBy('date', 'desc'), // Assumes 'date' is a string like 'YYYY-MM-DD' or a Timestamp
            limit(count)
        );
        const snapshot = await getDocs(q);
        const observations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Observation));
        console.log(`[EHR Client] Fetched ${observations.length} OBSERVATIONS for patient: ${patientId} from Firestore.`);
        return observations;
    } catch (error) {
        console.error(`Error fetching observations for patient ${patientId}:`, error);
        // Don't throw, return empty array on error as per original mock behavior
        return [];
    }
}

/**
 * Asynchronously retrieves recent encounters (visits/interactions) for a patient from Firestore.
 *
 * @param patientId The ID of the patient to retrieve encounters for.
 * @param count The maximum number of encounters to retrieve.
 * @returns A promise that resolves to an array of Encounter objects. Returns empty array if no encounters or on error.
 */
export async function getEncounters(patientId: string, count: number = 5): Promise<Encounter[]> {
    // await delay(250); // Optional delay
    try {
        // Query encounters for the specific patient, order by start date descending, limit results
         const q = query(
            encountersCollection,
            where('patientId', '==', patientId),
            orderBy('startDate', 'desc'), // Assumes 'startDate' is a string or Timestamp
            limit(count)
        );
        const snapshot = await getDocs(q);
        const encounters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Encounter));
        console.log(`[EHR Client] Fetched ${encounters.length} ENCOUNTERS for patient: ${patientId} from Firestore.`);
        return encounters;
    } catch (error) {
        console.error(`Error fetching encounters for patient ${patientId}:`, error);
        // Return empty array on error
        return [];
    }
}

/**
 * Asynchronously posts a clinical note (SOAP note) to Firestore.
 *
 * @param patientId The ID of the patient the note belongs to.
 * @param noteContent The content of the note to post.
 * @returns A promise that resolves when the note has been successfully posted or throws an error.
 */
export async function postNote(patientId: string, noteContent: string): Promise<void> {
    // await delay(300); // Optional delay
    try {
        // Add a new document with an auto-generated ID
        const docRef = await addDoc(notesCollection, {
            patientId: patientId,
            content: noteContent,
            createdAt: serverTimestamp(), // Use server timestamp
        });
        console.log(`[EHR Client] Posted NOTE with ID: ${docRef.id} for patient ${patientId} to Firestore.`);
        // console.log(`[EHR Client] Note content: ${noteContent.substring(0, 100)}...`); // Optional: Log snippet
    } catch (error) {
        console.error(`Error posting note for patient ${patientId}:`, error);
        throw new Error(`Failed to post note for patient ${patientId} to Firestore.`);
    }
}

/**
 * Asynchronously creates a new patient in Firestore.
 *
 * @param patientData Data for the new patient (name, DOB, gender).
 * @returns A promise that resolves to the newly created Patient object (including its Firestore ID).
 */
export async function createPatient(patientData: Omit<Patient, 'id'>): Promise<Patient> {
    // await delay(400); // Optional delay
    try {
        // Add a new document with an auto-generated ID
        const docRef = await addDoc(patientsCollection, {
            ...patientData,
            // createdAt: serverTimestamp(), // Optional: Add creation timestamp
        });
        console.log(`[EHR Client] Created new PATIENT with ID: ${docRef.id} - ${patientData.name} in Firestore.`);
        // Return the full patient object including the new ID
        return { ...patientData, id: docRef.id };
    } catch (error) {
        console.error('Error creating patient in Firestore:', error);
        throw new Error('Failed to create patient in Firestore.');
    }
}


/**
 * Asynchronously adds a new observation for a patient to Firestore.
 * This is typically used when saving derived data from a note (e.g., chief complaint).
 *
 * @param patientId The ID of the patient the observation belongs to.
 * @param observationData Data for the new observation (code, value, units, date).
 * @returns A promise that resolves to the newly created Observation object (including its Firestore ID).
 * @throws An error if adding the document fails.
 */
export async function addObservation(
    patientId: string,
    observationData: Omit<Observation, 'id' | 'patientId'>
): Promise<Observation> {
    try {
        const docRef = await addDoc(observationsCollection, {
            ...observationData,
            patientId: patientId,
            // recordedAt: serverTimestamp(), // Optional: Use server timestamp for recorded time
        });
        console.log(`[EHR Client] Added OBSERVATION with ID: ${docRef.id} for patient ${patientId}. Code: ${observationData.code}`);
        return { ...observationData, patientId, id: docRef.id };
    } catch (error) {
        console.error(`Error adding observation for patient ${patientId}:`, error);
        throw new Error(`Failed to add observation for patient ${patientId} to Firestore.`);
    }
}

/**
 * Asynchronously adds a new encounter for a patient to Firestore.
 * This is typically used when saving a note to represent the visit itself.
 *
 * @param patientId The ID of the patient the encounter belongs to.
 * @param encounterData Data for the new encounter (class, startDate, endDate, reason).
 * @returns A promise that resolves to the newly created Encounter object (including its Firestore ID).
 * @throws An error if adding the document fails.
 */
export async function addEncounter(
    patientId: string,
    encounterData: Omit<Encounter, 'id' | 'patientId'>
): Promise<Encounter> {
    try {
        const docRef = await addDoc(encountersCollection, {
            ...encounterData,
            patientId: patientId,
            // startedAt: serverTimestamp(), // Optional: Use server timestamp
        });
        console.log(`[EHR Client] Added ENCOUNTER with ID: ${docRef.id} for patient ${patientId}. Class: ${encounterData.class}`);
        return { ...encounterData, patientId, id: docRef.id };
    } catch (error) {
        console.error(`Error adding encounter for patient ${patientId}:`, error);
        throw new Error(`Failed to add encounter for patient ${patientId} to Firestore.`);
    }
}

/**
 * Asynchronously deletes a patient and all their related data (observations, encounters, notes)
 * from Firestore using a batch write for atomicity.
 *
 * @param patientId The ID of the patient to delete.
 * @returns A promise that resolves when the deletion is complete.
 * @throws An error if any part of the deletion process fails.
 */
export async function deletePatientAndRelatedData(patientId: string): Promise<void> {
    console.log(`[EHR Client] Starting deletion process for patient ID: ${patientId}`);
    const batch = writeBatch(db);

    try {
        // 1. Delete the patient document itself
        const patientDocRef = doc(db, 'patients', patientId);
        batch.delete(patientDocRef);
        console.log(`[EHR Client] Queued patient doc deletion: ${patientId}`);

        // 2. Query and queue deletion for related observations
        const obsQuery = query(observationsCollection, where('patientId', '==', patientId));
        const obsSnapshot = await getDocs(obsQuery);
        obsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
            console.log(`[EHR Client] Queued observation deletion: ${doc.id}`);
        });
        console.log(`[EHR Client] Queued ${obsSnapshot.size} observations for deletion.`);

        // 3. Query and queue deletion for related encounters
        const encQuery = query(encountersCollection, where('patientId', '==', patientId));
        const encSnapshot = await getDocs(encQuery);
        encSnapshot.forEach(doc => {
            batch.delete(doc.ref);
             console.log(`[EHR Client] Queued encounter deletion: ${doc.id}`);
        });
        console.log(`[EHR Client] Queued ${encSnapshot.size} encounters for deletion.`);


        // 4. Query and queue deletion for related notes
        const notesQuery = query(notesCollection, where('patientId', '==', patientId));
        const notesSnapshot = await getDocs(notesQuery);
        notesSnapshot.forEach(doc => {
             batch.delete(doc.ref);
             console.log(`[EHR Client] Queued note deletion: ${doc.id}`);
        });
         console.log(`[EHR Client] Queued ${notesSnapshot.size} notes for deletion.`);

        // 5. Commit the batch write
        await batch.commit();
        console.log(`[EHR Client] Successfully deleted patient ${patientId} and all related data.`);

    } catch (error) {
        console.error(`Error deleting patient ${patientId} and related data:`, error);
        throw new Error(`Failed to delete patient ${patientId}.`);
    }
}


// Helper function to get current date in YYYY-MM-DD format
export function getCurrentDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
