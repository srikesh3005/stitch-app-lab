// src/lib/firebaseService.ts
import { database } from "./firebaseConfig";
import { ref, set, onValue, get, push } from "firebase/database";

export type VehicleData = {
  speed: number;
  obstacleDistance: number;
  timestamp: string;
};

const VEHICLE_DATA_PATH = "vehicleData";

// Write vehicle data to Firebase with timestamp as key
export function writeVehicleData(data: VehicleData): Promise<void> {
  const dataRef = ref(database, `${VEHICLE_DATA_PATH}/${data.timestamp}`);
  return set(dataRef, data);
}

// Listen to all vehicle data changes in real-time
export function listenVehicleData(callback: (data: Record<string, VehicleData> | null) => void): () => void {
  const dataRef = ref(database, VEHICLE_DATA_PATH);
  return onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}

// Get all vehicle data once
export async function getVehicleData(): Promise<Record<string, VehicleData> | null> {
  const dataRef = ref(database, VEHICLE_DATA_PATH);
  const snapshot = await get(dataRef);
  return snapshot.val();
}

// Get latest vehicle data entry
export async function getLatestVehicleData(): Promise<VehicleData | null> {
  const data = await getVehicleData();
  if (!data) return null;
  
  const timestamps = Object.keys(data).sort((a, b) => parseInt(b) - parseInt(a));
  const latestTimestamp = timestamps[0];
  
  return latestTimestamp ? data[latestTimestamp] : null;
}