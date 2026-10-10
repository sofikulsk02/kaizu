import { prisma } from "../../database/prisma";
import { NotFoundError } from "../../core/ApiError";
import { CreateChapterDto, UpdateChapterDto } from "./chapter.schema";
import { CacheService } from "../../core/cache.service";

export class ChapterService {
  public static async createChapter(userId: string, subjectId: string, dto: CreateChapterDto) {
    // Verify subject exists and belongs to user
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundError("Subject not found");
    }

    const chapter = await prisma.chapter.create({
      data: {
        subjectId,
        title: dto.title,
        description: dto.description,
      },
      include: {
        topics: true,
      },
    });

    await CacheService.invalidateUserSubjects(userId);
    return chapter;
  }

  public static async getChaptersBySubject(userId: string, subjectId: string) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundError("Subject not found");
    }

    return prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { createdAt: "asc" },
      include: {
        topics: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  public static async getChapterById(userId: string, id: string) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id,
        subject: { userId },
      },
      include: {
        subject: true,
        topics: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    return chapter;
  }

  public static async updateChapter(userId: string, id: string, dto: UpdateChapterDto) {
    const existing = await prisma.chapter.findFirst({
      where: {
        id,
        subject: { userId },
      },
    });

    if (!existing) {
      throw new NotFoundError("Chapter not found");
    }

    const updated = await prisma.chapter.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        topics: true,
      },
    });

    await CacheService.invalidateUserSubjects(userId);
    return updated;
  }

  public static async deleteChapter(userId: string, id: string) {
    const existing = await prisma.chapter.findFirst({
      where: {
        id,
        subject: { userId },
      },
    });

    if (!existing) {
      throw new NotFoundError("Chapter not found");
    }

    await prisma.chapter.delete({
      where: { id },
    });

    await CacheService.invalidateUserSubjects(userId);
    return { success: true, message: "Chapter deleted successfully" };
  }
}
