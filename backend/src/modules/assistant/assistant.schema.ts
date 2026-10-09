export interface ChatRequestBody {
  message: string;
  conversationId?: string;
  pageContext?: {
    type?: "dashboard" | "subject" | "goal" | "project" | "activity" | "settings";
    recordId?: string;
    recordName?: string;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

export interface ConversationDetailDTO {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageDTO[];
}
