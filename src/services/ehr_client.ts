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
 */
export interface Observation {
    /**
     * The observation's ID (Firestore document ID).
     */
    id: string;
    /**
     * The observation's type or code (e.g., blood_pressure).
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
 */
export interface Encounter {
    /**
     * The encounter's ID (Firestore document ID).
     */
    id: string;
    /**
     * The encounter's type or class (e.g., outpatient).
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
     * The reason for the encounter.
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
 * Represents a clinical note in Firestore.
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
 *
 * @returns A promise that resolves to an array of Patient objects.
 */
export async function getPatientsList(): Promise<Patient[]> {
    try {
        const snapshot = await getDocs(patientsCollection);
        const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
        console.log(`[EHR Client] Fetched ${patients.length} patients from Firestore.`);
        return patients;
    } catch (error) {
        console.error("Error fetching patients list:", error);
        throw new Error('Failed to fetch patients list from Firestore.');
    }
}


/**
 * Asynchronously retrieves patient data from Firestore.
 *
 * @param patientId The ID of the patient to retrieve.
 * @returns A promise that resolves to a Patient object or throws an error if not found.
 */
export async function getPatient(patientId: string): Promise<Patient> {
    // await delay(150); // Optional delay
    try {
        const docRef = doc(db, 'patients', patientId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Patient with ID ${patientId} not found in Firestore.`);
        }
        console.log(`[EHR Client] Fetched patient: ${patientId} from Firestore.`);
        return { id: docSnap.id, ...docSnap.data() } as Patient;
    } catch (error) {
        console.error(`Error fetching patient ${patientId}:`, error);
        throw new Error(`Failed to fetch patient ${patientId} from Firestore.`);
    }
}

/**
 * Asynchronously retrieves recent observations for a patient from Firestore.
 *
 * @param patientId The ID of the patient to retrieve observations for.
 * @param count The maximum number of observations to retrieve.
 * @returns A promise that resolves to an array of Observation objects. Returns empty array if no observations.
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
        console.log(`[EHR Client] Fetched ${observations.length} observations for patient: ${patientId} from Firestore.`);
        return observations;
    } catch (error) {
        console.error(`Error fetching observations for patient ${patientId}:`, error);
        // Don't throw, return empty array on error as per original mock behavior
        return [];
    }
}

/**
 * Asynchronously retrieves recent encounters for a patient from Firestore.
 *
 * @param patientId The ID of the patient to retrieve encounters for.
 * @param count The maximum number of encounters to retrieve.
 * @returns A promise that resolves to an array of Encounter objects. Returns empty array if no encounters.
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
        console.log(`[EHR Client] Fetched ${encounters.length} encounters for patient: ${patientId} from Firestore.`);
        return encounters;
    } catch (error) {
        console.error(`Error fetching encounters for patient ${patientId}:`, error);
        // Return empty array on error
        return [];
    }
}

/**
 * Asynchronously posts a clinical note to Firestore.
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
        console.log(`[EHR Client] Posted note with ID: ${docRef.id} for patient ${patientId} to Firestore.`);
        console.log(`[EHR Client] Note content: ${noteContent.substring(0, 100)}...`);
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
        console.log(`[EHR Client] Created new patient with ID: ${docRef.id} - ${patientData.name} in Firestore.`);
        // Return the full patient object including the new ID
        return { ...patientData, id: docRef.id };
    } catch (error) {
        console.error('Error creating patient in Firestore:', error);
        throw new Error('Failed to create patient in Firestore.');
    }
}
