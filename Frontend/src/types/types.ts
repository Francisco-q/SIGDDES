export interface TotemQR {
    id: number;
    latitude: number;
    longitude: number;
    name: string;
    description: string;
    imageUrl: string;
    campus: string;
  }
  
  export interface ReceptionQR {
    id: number;
    latitude: number;
    longitude: number;
    name: string;
    description: string;
    imageUrl: string;
    campus: string;
  }
  
  export interface PathPoint {
    latitude: number;
    longitude: number;
    order: number;
  }
  
  export interface Path {
    id: number;
    name: string;
    points: PathPoint[];
    campus: string;
  }