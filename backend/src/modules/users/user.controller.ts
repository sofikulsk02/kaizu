import { Request, Response } from "express";
import { SuccessResponse } from "../../core/ApiResponse";
import { UserService } from "./user.service";
import { AuthService } from "./auth.service";
import { BadRequestError } from "../../core/ApiError";
import { frontendUrl } from "../../config";

export class UserController {
  public static async getMe(req: Request, res: Response): Promise<Response> {
    const user = req.user;
    return new SuccessResponse("Current authenticated user profile", user).send(res);
  }

  public static async getGoogleAuthUrl(_req: Request, res: Response): Promise<Response> {
    const url = AuthService.getGoogleAuthUrl();
    return new SuccessResponse("Google auth URL generated", { url }).send(res);
  }

  public static async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string;
    if (!code) {
      throw new BadRequestError("Authorization code missing from Google OAuth callback");
    }

    const { user, token } = await AuthService.handleGoogleCallback(code);
    const redirectTarget = `${frontendUrl}?token=${token}&userId=${user.id}`;
    res.redirect(redirectTarget);
  }

  public static async verifyGoogleIdToken(req: Request, res: Response): Promise<Response> {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== "string") {
      throw new BadRequestError("idToken is required");
    }

    const result = await AuthService.verifyGoogleIdToken(idToken);
    return new SuccessResponse("Google authentication successful", result).send(res);
  }

  public static async createDevUser(req: Request, res: Response): Promise<Response> {
    const { id, email, name, avatarUrl } = req.body;
    if (!id || !email || !name) {
      throw new BadRequestError("id, email, and name are required for dev user setup");
    }

    const user = await UserService.createOrUpdateDevUser({ id, email, name, avatarUrl });
    const token = AuthService.generateJwtToken(user);
    return new SuccessResponse("Dev user created/updated successfully", { user, token }).send(res);
  }
}
