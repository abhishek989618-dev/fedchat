export interface CreateMessageInput {
  roomId: string;
  senderId: string;
  content: string;
  messageType: string;
}

export interface UpdateMessageInput {
  content: string;
}