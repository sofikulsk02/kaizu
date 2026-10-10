import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../../database/prisma";
import { googleClientId, googleClientSecret, googleCallbackUrl, jwtSecret } from "../../config";
import { AuthFailureError, BadRequestError } from "../../core/ApiError";
import { User } from "../../generated/prisma/client";
import { CacheService } from "../../core/cache.service";

const oauth2Client = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  googleCallbackUrl
);

export class AuthService {
  /**
   * Generates Google OAuth 2.0 Authorization URL
   */
  public static getGoogleAuthUrl(): string {
    if (!googleClientId) {
      throw new BadRequestError("GOOGLE_CLIENT_ID is not configured in backend .env");
    }

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  }

  /**
   * Generates a signed Kaizu JWT token for a user
   */
  public static generateJwtToken(user: User): string {
    return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "30d",
    });
  }

  /**
   * Verifies Kaizu JWT session token
   */
  public static verifyJwtToken(token: string): { userId: string; email: string } {
    try {
      return jwt.verify(token, jwtSecret) as { userId: string; email: string };
    } catch (err) {
      throw new AuthFailureError("Invalid or expired session token");
    }
  }

  /**
   * Handles OAuth Redirect Callback from Google
   */
  public static async handleGoogleCallback(code: string): Promise<{ user: User; token: string }> {
    if (!googleClientId || !googleClientSecret) {
      throw new BadRequestError("Google OAuth credentials missing in backend configuration");
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new AuthFailureError("Failed to obtain ID token from Google");
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AuthFailureError("Invalid profile data received from Google");
    }

    const email = payload.email;
    const name = payload.name || payload.email.split("@")[0];
    const avatarUrl = payload.picture || null;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
        },
      });
    } else if (user.name !== name || user.avatarUrl !== avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, avatarUrl },
      });
      await CacheService.invalidateUserProfile(user.id);
    }

    const token = this.generateJwtToken(user);
    return { user, token };
  }

  /**
   * Verifies Google ID token from frontend client
   */
  public static async verifyGoogleIdToken(idToken: string): Promise<{ user: User; token: string }> {
    if (!googleClientId) {
      throw new BadRequestError("GOOGLE_CLIENT_ID is not configured in backend .env");
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AuthFailureError("Invalid Google ID Token");
    }

    const email = payload.email;
    const name = payload.name || payload.email.split("@")[0];
    const avatarUrl = payload.picture || null;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
        },
      });
    } else if (user.name !== name || user.avatarUrl !== avatarUrl) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, avatarUrl },
      });
      await CacheService.invalidateUserProfile(user.id);
    }

    const token = this.generateJwtToken(user);
    return { user, token };
  }
}
