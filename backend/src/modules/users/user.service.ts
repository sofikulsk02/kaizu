import { prisma } from "../../database/prisma";
import { User } from "../../generated/prisma/client";

export class UserService {
  public static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  public static async createOrUpdateDevUser(data: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      update: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
    });
  }
}
