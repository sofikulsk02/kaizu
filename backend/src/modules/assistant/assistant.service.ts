import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  geminiApiKey,
  michiMaxInputChars,
  michiMaxHistoryMessages,
  michiMaxOutputTokens,
  michiDailyRequestLimit,
} from "../../config";
import { AssistantRepository } from "./assistant.repository";
import { AssistantContextService } from "./assistant.context";
import { AssistantPromptBuilder } from "./assistant.prompt";
import { BadRequestError, InternalError } from "../../core/ApiError";

export class AssistantService {
  private static getGeminiClient(): GoogleGenerativeAI {
    if (!geminiApiKey) {
      throw new BadRequestError(
        "Gemini API key is not configured. Please set GEMINI_API_KEY in the backend environment."
      );
    }
    return new GoogleGenerativeAI(geminiApiKey);
  }

  /**
   * Process a chat message with streaming response
   */
  static async streamChat(
    userId: string,
    userName: string,
    message: string,
    conversationId?: string,
    pageContext?: { type?: string; recordId?: string; recordName?: string },
    onChunk?: (text: string) => void
  ): Promise<{ conversationId: string; fullResponse: string }> {
    // 1. Input Validation
    const trimmedMessage = (message || "").trim();
    if (!trimmedMessage) {
      throw new BadRequestError("Message cannot be empty.");
    }
    if (trimmedMessage.length > michiMaxInputChars) {
      throw new BadRequestError(
        `Message exceeds maximum allowed length of ${michiMaxInputChars} characters.`
      );
    }

    // 2. Daily Rate Limits Check (Free-tier protection)
    const dailyCount = await AssistantRepository.countUserDailyMessages(userId);
    if (dailyCount >= michiDailyRequestLimit) {
      throw new BadRequestError(
        `Daily free-tier request limit reached (${michiDailyRequestLimit} requests/day). Please try again tomorrow.`
      );
    }

    // 3. Conversation Management
    let conversation;
    if (conversationId) {
      conversation = await AssistantRepository.findConversationById(conversationId, userId);
      if (!conversation) {
        throw new BadRequestError("Conversation not found or unauthorized.");
      }
    } else {
      // Auto derive title from first message (first 40 characters)
      const initialTitle =
        trimmedMessage.length > 36 ? trimmedMessage.substring(0, 36) + "..." : trimmedMessage;
      conversation = await AssistantRepository.createConversation(userId, initialTitle);
    }

    // 4. Save User Message
    await AssistantRepository.createMessage(conversation.id, "USER", trimmedMessage);
    await AssistantRepository.touchConversation(conversation.id, userId);

    // 5. Gather Kaizu Grounded Context & System Prompt
    const userContext = await AssistantContextService.assembleUserContext(
      userId,
      userName,
      pageContext
    );
    const systemInstruction = AssistantPromptBuilder.getSystemPrompt(userContext);

    // 6. Gather bounded recent history
    const recentMessages = await AssistantRepository.getRecentMessages(
      conversation.id,
      michiMaxHistoryMessages
    );

    // 7. Initialize Gemini Model (Using gemini-3.8-flash as required by Google Generative AI API)
    const genAI = this.getGeminiClient();
    const primaryModelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    
    // Format conversation history for Gemini SDK
    // Exclude the last message since we will pass it in the prompt/chat
    const historyContents = recentMessages.slice(0, -1).map((msg) => ({
      role: msg.role === "USER" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    let fullResponse = "";

    try {
      const model = genAI.getGenerativeModel({
        model: primaryModelName,
        systemInstruction: systemInstruction,
        generationConfig: {
          maxOutputTokens: michiMaxOutputTokens,
          temperature: 0.7,
        },
      });

      const chat = model.startChat({
        history: historyContents,
      });

      const result = await chat.sendMessageStream(trimmedMessage);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullResponse += chunkText;
          if (onChunk) {
            onChunk(chunkText);
          }
        }
      }
    } catch (err: any) {
      console.error("Gemini Assistant Provider Error:", err);
      if (err?.status === 429 || err?.message?.includes("quota")) {
        throw new BadRequestError(
          "Gemini free-tier quota temporarily exhausted. Please wait a minute and try again."
        );
      }
      throw new InternalError(
        err?.message || "Failed to communicate with Michi assistant."
      );
    }

    // 8. Save Assistant Response in Database
    if (fullResponse) {
      await AssistantRepository.createMessage(conversation.id, "ASSISTANT", fullResponse);
      await AssistantRepository.touchConversation(conversation.id, userId);
    }

    return {
      conversationId: conversation.id,
      fullResponse,
    };
  }

  /**
   * List conversations
   */
  static async listConversations(userId: string) {
    const list = await AssistantRepository.listUserConversations(userId);
    return list.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      lastMessagePreview: c.messages[0]?.content
        ? c.messages[0].content.slice(0, 80) + "..."
        : undefined,
    }));
  }

  /**
   * Get single conversation with full message history
   */
  static async getConversation(conversationId: string, userId: string) {
    const conversation = await AssistantRepository.findConversationById(conversationId, userId);
    if (!conversation) {
      throw new BadRequestError("Conversation not found or unauthorized.");
    }
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(conversationId: string, userId: string) {
    const success = await AssistantRepository.deleteConversation(conversationId, userId);
    if (!success) {
      throw new BadRequestError("Conversation not found or unauthorized.");
    }
    return { success: true };
  }

  /**
   * Get user usage stats
   */
  static async getUsageStats(userId: string) {
    const dailyCount = await AssistantRepository.countUserDailyMessages(userId);
    return {
      dailyRequestsUsed: dailyCount,
      dailyLimit: michiDailyRequestLimit,
      remaining: Math.max(0, michiDailyRequestLimit - dailyCount),
    };
  }
}
