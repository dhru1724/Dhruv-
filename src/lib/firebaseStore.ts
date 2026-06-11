import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase lazily to prevent startup crashes when keys are unavailable
let db: any = null;

export function getDb() {
  if (!db) {
    try {
      const app = initializeApp(firebaseConfig);
      // Pass the specific firestoreDatabaseId from configuration
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      
      // Warm up connection check to verify Firestore connectivity
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'streaks', 'connection-test'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('offline')) {
            console.warn("Firestore appears offline. Operating with local storage cache sync fallback.");
          }
        }
      };
      testConnection();
    } catch (e) {
      console.error("Firebase initialization failed:", e);
    }
  }
  return db;
}

// --------------------------------------------------------------------------
// TASK STREAK CORE SERVICE DEFINITION
// --------------------------------------------------------------------------

export interface StreakData {
  syncId: string;
  startDate: string; // YYYY-MM-DD
  longestStreak: number;
  currentStreak: number;
  completedDates: string[]; // List of YYYY-MM-DD dates completed
}

// Ensure high unique identity for device sync groups
const KEY_SYNC_ID = 'lifeos_cloud_sync_id';
const KEY_STREAK_CACHE = 'lifeos_streak_cache_v5';

// Generates a descriptive, friendly unique cloud ID if not specified
export function getOrCreateSyncId(): string {
  let syncId = localStorage.getItem(KEY_SYNC_ID);
  if (!syncId) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    syncId = `lifeos-${rand}`;
    localStorage.setItem(KEY_SYNC_ID, syncId);
  }
  return syncId;
}

// Save customized or existing Sync ID
export function setSyncId(id: string) {
  if (id && id.trim()) {
    localStorage.setItem(KEY_SYNC_ID, id.trim());
  }
}

// Get standard local date string in YYYY-MM-DD local timezone format
export function getLocalDateString(date_obj: Date = new Date()): string {
  const yyyy = date_obj.getFullYear();
  const mm = String(date_obj.getMonth() + 1).padStart(2, '0');
  const dd = String(date_obj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Load current streak data from localStorage cache first
export function getLocalStreakCache(): StreakData {
  const syncId = getOrCreateSyncId();
  const saved = localStorage.getItem(KEY_STREAK_CACHE);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          syncId: parsed.syncId || syncId,
          startDate: parsed.startDate || getLocalDateString(),
          longestStreak: Number(parsed.longestStreak) || 0,
          currentStreak: Number(parsed.currentStreak) || 0,
          completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : []
        };
      }
    } catch (e) {
      console.error("Failed to parse cached streak data", e);
    }
  }
  
  // Clean fresh default state relative to today
  return {
    syncId,
    startDate: getLocalDateString(),
    longestStreak: 0,
    currentStreak: 0,
    completedDates: []
  };
}

// Standard streak calculator algorithm (Cleaned up from previous historical constraints)
export function calculateStreak(completedDates: string[], startDate: string): { currentStreak: number; longestStreak: number; completionRate: number } {
  const todayStr = getLocalDateString();
  
  // Filter only dates starting from today's baseline start date
  const filtered = Array.from(new Set(completedDates))
    .filter(d => d >= startDate)
    .sort();

  // Create Date objects for calculation
  const startDay = new Date(startDate + 'T00:00:00');
  const todayDay = new Date(todayStr + 'T00:00:00');
  
  // Calculate difference of days between startDate and today
  const diffTime = Math.max(0, todayDay.getTime() - startDay.getTime());
  const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of today

  // Number of completed days starting from starting point
  const completedCount = filtered.length;
  const completionRate = elapsedDays > 0 ? Math.min(100, Math.round((completedCount / elapsedDays) * 100)) : 0;

  // Let's compute the consecutive runs backwards from today or yesterday
  let currentStreak = 0;
  const hasToday = filtered.includes(todayStr);

  // Get yesterday's date string
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);
  const hasYesterday = filtered.includes(yesterdayStr);

  if (hasToday || hasYesterday) {
    // If we completed yesterday or today, the streak is alive.
    // We check backwards starting from today (if completed) or yesterday (if today is not completed yet).
    let targetDate = hasToday ? new Date() : yesterday;
    let keepChecking = true;
    
    while (keepChecking) {
      const targetStr = getLocalDateString(targetDate);
      if (targetStr < startDate) {
        break;
      }
      if (filtered.includes(targetStr)) {
        currentStreak++;
        targetDate.setDate(targetDate.getDate() - 1);
      } else {
        keepChecking = false;
      }
    }
  } else {
    currentStreak = 0;
  }

  // Find the longest overall streak sequence since start date
  let longestRun = 0;
  let tempRun = 0;
  
  if (filtered.length > 0) {
    let checkDate = new Date(startDate + 'T00:00:00');
    const endDate = new Date(todayStr + 'T00:00:00');
    
    while (checkDate <= endDate) {
      const checkStr = getLocalDateString(checkDate);
      if (filtered.includes(checkStr)) {
         tempRun++;
         if (tempRun > longestRun) {
           longestRun = tempRun;
         }
      } else {
         tempRun = 0;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
  }

  return {
    currentStreak,
    longestStreak: longestRun,
    completionRate
  };
}

// Saves computed streak data to local storage and syncs to Firebase
export async function saveStreakData(data: StreakData): Promise<void> {
  // Always update local cache first (instant local updates)
  localStorage.setItem(KEY_STREAK_CACHE, JSON.stringify(data));

  // Sync to Firestore database in parallel (non-blocking cloud persistence)
  const dbInstance = getDb();
  if (dbInstance) {
    try {
      await setDoc(doc(dbInstance, 'streaks', data.syncId), {
        syncId: data.syncId,
        startDate: data.startDate,
        longestStreak: data.longestStreak,
        currentStreak: data.currentStreak,
        completedDates: data.completedDates
      });
    } catch (e) {
      console.warn("Firestore sync deferred. Operating in offline/cached mode.", e);
      if (e instanceof Error && e.message.includes("permission")) {
        handleFirestoreError(e, OperationType.WRITE, `streaks/${data.syncId}`);
      }
    }
  }
}

// Reset entire streak state from scratch from today
export async function resetStreakSystem(): Promise<StreakData> {
  const syncId = getOrCreateSyncId();
  const todayStr = getLocalDateString();
  
  const freshData: StreakData = {
    syncId,
    startDate: todayStr,
    longestStreak: 0,
    currentStreak: 0,
    completedDates: []
  };

  await saveStreakData(freshData);
  return freshData;
}
