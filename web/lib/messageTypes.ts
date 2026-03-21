export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  jobId: string | null;
  content: string;
  isBlocked: boolean;
  flagReason: string | null;
  createdAt: string;
}

export interface ConversationPreview {
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: string;
  updatedAt: string;
}
