
export enum MessageType {
  STICKY_NOTE = 'STICKY_NOTE',
  STICKER = 'STICKER',
  VOICE_NOTE = 'VOICE_NOTE',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  SYSTEM = 'SYSTEM'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'available' | 'busy' | 'waiting';
}

export interface GroupSession {
  activePair: [string, string] | null; // IDs of the two people currently on the wall
  startTime: number | null;
  waitlist: string[];
}

export interface StickyNote {
  id: string;
  senderId: string;
  text: string;
  color: string;
  timestamp: number;
  rotation: number;
  x: number;
  y: number;
  isDragging?: boolean;
}

export interface Photo {
  id: string;
  senderId: string;
  imageUrl: string;
  caption: string;
  timestamp: number;
  rotation: number;
  x: number;
  y: number;
}

export interface VideoMessage {
  id: string;
  senderId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  timestamp: number;
  rotation: number;
  x: number;
  y: number;
}

export interface Sticker {
  id: string;
  senderId: string;
  emoji: string;
  timestamp: number;
  x: number;
  y: number;
}

export interface VoiceNote {
  id: string;
  senderId: string;
  duration: number;
  audioBlobUrl: string;
  timestamp: number;
}

export interface LocationData {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
}
