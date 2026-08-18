export interface CreateRoomInput {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface UpdateRoomInput {
  name?: string;
  description?: string | null;
  isPrivate?: boolean;
}