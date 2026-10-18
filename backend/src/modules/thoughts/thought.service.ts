import { prisma } from "../../database/prisma";
import { NotFoundError } from "../../core/ApiError";
import { CreateThoughtDto, UpdateThoughtDto } from "./thought.schema";

export class ThoughtService {
  /**
   * Create a new thought scoped strictly to the authenticated user.
   */
  public static async createThought(userId: string, dto: CreateThoughtDto) {
    return prisma.thought.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned ?? false,
      },
    });
  }

  /**
   * Retrieve all thoughts belonging to the user, with optional search over title and content.
   * Pinned thoughts always appear first, followed by most recently updated.
   */
  public static async getThoughts(userId: string, search?: string) {
    const trimmedSearch = search?.trim();

    const whereClause: any = {
      userId,
    };

    if (trimmedSearch) {
      whereClause.OR = [
        {
          title: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: trimmedSearch,
            mode: "insensitive",
          },
        },
      ];
    }

    return prisma.thought.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
    });
  }

  /**
   * Retrieve a single thought by ID, verifying user ownership.
   */
  public static async getThoughtById(userId: string, id: string) {
    const thought = await prisma.thought.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!thought) {
      throw new NotFoundError("Thought not found");
    }

    return thought;
  }

  /**
   * Update a thought's title, content, or pin status with strict ownership verification.
   */
  public static async updateThought(userId: string, id: string, dto: UpdateThoughtDto) {
    // Verify existence and ownership
    const existing = await prisma.thought.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Thought not found");
    }

    const dataToUpdate: any = {};
    if (dto.title !== undefined) dataToUpdate.title = dto.title;
    if (dto.content !== undefined) dataToUpdate.content = dto.content;
    if (dto.isPinned !== undefined) dataToUpdate.isPinned = dto.isPinned;

    return prisma.thought.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Delete a thought with strict ownership verification.
   */
  public static async deleteThought(userId: string, id: string) {
    const existing = await prisma.thought.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundError("Thought not found");
    }

    await prisma.thought.delete({
      where: { id },
    });

    return true;
  }
}
