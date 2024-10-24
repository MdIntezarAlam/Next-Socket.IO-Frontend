import { create } from 'zustand';

export interface TypeRoom {
  roomId: string | undefined;
  username: string | undefined;
  timestamp: any;
  message: string;
}

interface IRoom {
  room: TypeRoom | null;
  setRoom: (room: TypeRoom | null) => void;
}
export const useRoom = create<IRoom>((set) => ({
  room: null,
  setRoom: (room) => set({ room: room }),
}));
