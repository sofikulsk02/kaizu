import { prisma } from "../../database/prisma";
import { NotFoundError, BadRequestError } from "../../core/ApiError";
import { CreateSubjectDto, UpdateSubjectDto, CreateStudySessionDto } from "./subject.schema";
import { CacheService } from "../../core/cache.service";

export class SubjectService {
  public static async createSubject(userId: string, dto: CreateSubjectDto) {
    const lastSubject = await prisma.subject.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastSubject?.sortOrder ?? -1) + 1;

    const res = await prisma.subject.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        sortOrder: nextSortOrder,
      },
    });
    await CacheService.invalidateUserSubjects(userId);
    return res;
  }

  public static async reorderSubjects(userId: string, orderedIds: string[]) {
    if (!orderedIds || !Array.isArray(orderedIds)) {
      throw new BadRequestError("orderedIds must be an array of subject IDs");
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.subject.updateMany({
          where: { id, userId },
          data: { sortOrder: index },
        })
      )
    );

    await CacheService.invalidateUserSubjects(userId);
    return { success: true };
  }

  public static async getSubjects(userId: string) {
    const cacheKey = `kaizu:user:${userId}:subjects`;
    return CacheService.fetchOrSet(cacheKey, async () => {
      const subjects = await prisma.subject.findMany({
        where: { userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          chapters: {
            include: {
              topics: true,
            },
          },
          studySessions: true,
        },
      });

      return subjects.map((subject) => {
        const chapterCount = subject.chapters.length;
        const allTopics = subject.chapters.flatMap((c) => c.topics);
        const topicCount = allTopics.length;

        const totalTimeStudiedMinutes = subject.studySessions.reduce(
          (acc, s) => acc + s.durationMinutes,
          0
        );

        const activeDaysSet = new Set(
          subject.studySessions.map((s) => new Date(s.occurredAt).toISOString().split("T")[0])
        );

        const { chapters, studySessions, ...subjectWithoutRelations } = subject;

        return {
          ...subjectWithoutRelations,
          chapterCount,
          topicCount,
          totalTimeStudiedMinutes,
          activeDaysCount: activeDaysSet.size,
        };
      });
    }, 300);
  }

  public static async getSubjectById(userId: string, id: string) {
    const cacheKey = `kaizu:user:${userId}:subjects:${id}`;
    return CacheService.fetchOrSet(cacheKey, async () => {
      const subject = await prisma.subject.findFirst({
        where: { id, userId },
        include: {
          chapters: {
            orderBy: { createdAt: "asc" },
            include: {
              topics: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
          studySessions: {
            orderBy: { occurredAt: "desc" },
            include: {
              topic: {
                select: { id: true, title: true, status: true },
              },
            },
          },
        },
      });

      if (!subject) {
        throw new NotFoundError("Subject not found");
      }

      const allTopics = subject.chapters.flatMap((c) => c.topics);
      const chapterCount = subject.chapters.length;
      const topicsTrackedCount = allTopics.length;

      const topicsStudiedCount = allTopics.filter(
        (t) => t.status === "STUDIED" || t.status === "UNDERSTOOD"
      ).length;

      const topicsNeedingRevisionCount = allTopics.filter(
        (t) => t.status === "NEEDS_REVISION" || t.status === "LEARNING"
      ).length;

      const totalTimeStudiedMinutes = subject.studySessions.reduce(
        (acc, s) => acc + s.durationMinutes,
        0
      );

      const activeDaysSet = new Set(
        subject.studySessions.map((s) => new Date(s.occurredAt).toISOString().split("T")[0])
      );

      // Compute Continue Learning hero data
      let continueLearning: {
        topicId?: string;
        topicTitle: string;
        lastStudiedText: string;
        durationMinutes?: number;
        nextStep?: string;
      } | null = null;

      if (subject.studySessions.length > 0) {
        const lastSession = subject.studySessions[0];
        const lastTopic = allTopics.find((t) => t.id === lastSession.topicId);

        const lastDateStr = new Date(lastSession.occurredAt).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        continueLearning = {
          topicId: lastSession.topicId || undefined,
          topicTitle: lastTopic?.title || lastSession.summary,
          lastStudiedText: `Last studied: ${lastDateStr} · ${lastSession.durationMinutes} mins`,
          durationMinutes: lastSession.durationMinutes,
          nextStep: lastSession.nextStep || lastTopic?.nextStep || undefined,
        };
      } else if (allTopics.length > 0) {
        continueLearning = {
          topicId: allTopics[0].id,
          topicTitle: allTopics[0].title,
          lastStudiedText: "Ready to start first session",
          nextStep: "Begin exploring fundamental concepts",
        };
      }

      return {
        ...subject,
        chapterCount,
        topicCount: topicsTrackedCount,
        metrics: {
          totalTimeStudiedMinutes,
          activeDaysCount: activeDaysSet.size,
          topicsTrackedCount,
          topicsStudiedCount,
          topicsNeedingRevisionCount,
        },
        continueLearning,
      };
    }, 300);
  }

  public static async updateSubject(userId: string, id: string, dto: UpdateSubjectDto) {
    const existing = await prisma.subject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError("Subject not found");
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
    await CacheService.invalidateUserSubjects(userId);
    return updated;
  }

  public static async deleteSubject(userId: string, id: string) {
    const existing = await prisma.subject.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError("Subject not found");
    }

    await prisma.subject.delete({
      where: { id },
    });
    await CacheService.invalidateUserSubjects(userId);

    return { success: true, message: "Subject deleted successfully" };
  }

  // =========================================================================
  // Study Session Operations
  // =========================================================================

  public static async createStudySession(userId: string, subjectId: string, dto: CreateStudySessionDto) {
    // Validate subject ownership
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundError("Subject not found");
    }

    if (dto.topicId) {
      const topic = await prisma.topic.findFirst({
        where: {
          id: dto.topicId,
          chapter: { subjectId },
        },
      });

      if (!topic) {
        throw new BadRequestError("Referenced topic does not belong to this subject");
      }
    }

    const session = await prisma.studySession.create({
      data: {
        subjectId,
        chapterId: dto.chapterId || null,
        topicId: dto.topicId || null,
        summary: dto.summary,
        durationMinutes: dto.durationMinutes,
        occurredAt: dto.occurredAt || new Date(),
        confidence: dto.confidence || null,
        outcome: dto.outcome || null,
        nextStep: dto.nextStep || null,
      },
      include: {
        topic: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    // Auto-update linked Topic's lastStudiedAt and status/confidence!
    if (dto.topicId) {
      const nextStatus =
        dto.confidence && dto.confidence >= 4
          ? "UNDERSTOOD"
          : dto.confidence && dto.confidence <= 2
          ? "NEEDS_REVISION"
          : "STUDIED";

      await prisma.topic.update({
        where: { id: dto.topicId },
        data: {
          lastStudiedAt: new Date(),
          status: nextStatus,
          ...(dto.confidence !== undefined && { confidence: dto.confidence }),
          ...(dto.nextStep && { nextStep: dto.nextStep }),
        },
      });
    }

    await CacheService.invalidateUserSubjects(userId);
    return session;
  }

  public static async deleteStudySession(userId: string, subjectId: string, sessionId: string) {
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundError("Subject not found");
    }

    const existing = await prisma.studySession.findFirst({
      where: { id: sessionId, subjectId },
    });

    if (!existing) {
      throw new NotFoundError("Study session not found");
    }

    await prisma.studySession.delete({
      where: { id: sessionId },
    });
    await CacheService.invalidateUserSubjects(userId);

    return { success: true };
  }
}
