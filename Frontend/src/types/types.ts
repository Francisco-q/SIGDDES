export interface TotemQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  imageUrls: string[];
  campus: string;
  status: string;
}

export interface ReceptionQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  imageUrls: string[];
  campus: string;
  schedule: string;
  status: string;
}

export interface PathPoint {
  latitude: number;
  longitude: number;
  order: number;
}

export interface Path {
  id: number;
  name: string;
  points: { latitude: number; longitude: number }[];
  campus: string;
}