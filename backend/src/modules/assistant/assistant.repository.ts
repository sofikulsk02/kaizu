import { prisma } from "../../database/prisma";
import { AssistantConversation, AssistantMessage, AssistantMessageRole } from "../../generated/prisma/client";

export class AssistantRepository {
  /**
   * Get all conversations for a user, ordered by updatedAt descending
   */
  static async listUserConversations(userId: string) {
    return prisma.assistantConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      take: 30,
    });
  }

  /**
   * Find conversation strictly verifying user ownership
   */
  static async findConversationById(id: string, userId: string) {
    return prisma.assistantConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  /**
   * Create a new conversation for user
   */
  static async createConversation(userId: string, initialTitle?: string) {
    return prisma.assistantConversation.create({
      data: {
        userId,
        title: initialTitle || "New Conversation",
      },
    });
  }

  /**
   * Update conversation title / updatedAt timestamp
   */
  static async touchConversation(id: string, userId: string, title?: string) {
    return prisma.assistantConversation.updateMany({
      where: { id, userId },
      data: {
        updatedAt: new Date(),
        ...(title ? { title } : {}),
      },
    });
  }

  /**
   * Save a message into a conversation
   */
  static async createMessage(
    conversationId: string,
    role: AssistantMessageRole,
    content: string,
    tokenEstimate?: number
  ) {
    return prisma.assistantMessage.create({
      data: {
        conversationId,
        role,
        content,
        tokenEstimate,
      },
    });
  }

  /**
   * Get recent bounded messages for context window
   */
  static async getRecentMessages(conversationId: string, limit: number = 10) {
    const messages = await prisma.assistantMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return messages.reverse();
  }

  /**
   * Delete conversation ensuring user ownership
   */
  static async deleteConversation(id: string, userId: string) {
    const conversation = await prisma.assistantConversation.findFirst({
      where: { id, userId },
    });

    if (!conversation) {
      return false;
    }

    await prisma.assistantConversation.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Count user messages today for free-tier rate limiting
   */
  static async countUserDailyMessages(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await prisma.assistantMessage.count({
      where: {
        conversation: {
          userId,
        },
        role: "USER",
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    return count;
  }
}
