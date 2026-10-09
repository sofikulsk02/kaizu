import { Request, Response, NextFunction } from "express";
import { prisma } from "../database/prisma";
import { AuthFailureError } from "../core/ApiError";
import { AuthService } from "../modules/users/auth.service";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers["x-user-id"] as string | undefined;

    let userId: string | null = null;

    // 1. Check Bearer JWT Token (Google Login Session)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token !== "null" && token !== "undefined") {
        try {
          const decoded = AuthService.verifyJwtToken(token);
          userId = decoded.userId;
        } catch (e) {
          throw new AuthFailureError("Invalid or expired session token");
        }
      }
    }

    // 2. Check x-user-id header (Dev / testing identity switcher)
    if (!userId && userIdHeader && userIdHeader !== "null" && userIdHeader !== "undefined") {
      userId = userIdHeader;
    }

    // Strictly require authentication if neither JWT nor x-user-id is provided
    if (!userId) {
      throw new AuthFailureError("Authentication required. Please sign in with Google.");
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Provision dev user if missing
    if (!user) {
      const email = `user_${userId.slice(0, 8)}@kaizu.app`;
      const name = `User (${userId.slice(0, 8)})`;

      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
        },
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    next(err instanceof AuthFailureError ? err : new AuthFailureError("Authentication failed"));
  }
}
