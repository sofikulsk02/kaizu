import { prisma } from "../../database/prisma";
import { NotFoundError } from "../../core/ApiError";
import { CreateTopicDto, UpdateTopicDto } from "./topic.schema";

export class TopicService {
  public static async createTopic(userId: string, chapterId: string, dto: CreateTopicDto) {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        subject: { userId },
      },
    });

    if (!chapter) {
      throw new NotFoundError("Chapter not found");
    }

    return prisma.topic.create({
      data: {
        chapterId,
        title: dto.title,
        status: dto.status || "NOT_STARTED",
        confidence: dto.confidence || null,
        notes: dto.notes || null,
        resources: dto.resources || null,
        nextStep: dto.nextStep || null,
        revisionDate: dto.revisionDate || null,
      },
    });
  }

  public static async updateTopic(userId: string, id: string, dto: UpdateTopicDto) {
    const existing = await prisma.topic.findFirst({
      where: {
        id,
        chapter: {
          subject: { userId },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Topic not found");
    }

    return prisma.topic.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.confidence !== undefined && { confidence: dto.confidence }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.resources !== undefined && { resources: dto.resources }),
        ...(dto.nextStep !== undefined && { nextStep: dto.nextStep }),
        ...(dto.revisionDate !== undefined && { revisionDate: dto.revisionDate }),
      },
    });
  }

  public static async deleteTopic(userId: string, id: string) {
    const existing = await prisma.topic.findFirst({
      where: {
        id,
        chapter: {
          subject: { userId },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError("Topic not found");
    }

    await prisma.topic.delete({
      where: { id },
    });

    return { success: true, message: "Topic deleted successfully" };
  }
}
