
export type AnomalyType = 'Normal' | 'Electricity Spike Detected' | 'Water Leakage Detected';

export interface SensorData {
  timestamp: string;
  electricity: number;
  water: number;
  anomaly: AnomalyType;
}
