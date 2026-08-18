import type {
  Request,
  Response
} from "express";

import {
  loginSchema,
  registerSchema,
  refreshTokenSchema
} from "./auth.validation.js";

import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";

const authService =
  new AuthService(
    new AuthRepository()
  );

export async function register(
  req: Request,
  res: Response
) {
  try {
    const input =
      registerSchema.parse(req.body);

    const user =
      await authService.register(input);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Registration failed"
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const input =
      loginSchema.parse(req.body);

    const result =
      await authService.login(input);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed"
    });
  }

  
}

export async function refresh(
  req: Request,
  res: Response
) {
  try {
    const input =
      refreshTokenSchema.parse(
        req.body
      );

    const result =
      await authService.refresh(
        input.refreshToken
      );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Token refresh failed"
    });
  }
}

export async function logout(
  req: Request,
  res: Response
) {
  try {
    const input = refreshTokenSchema.parse(
      req.body
    );

    await authService.logout(
      input.refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error(error);

    return res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Logout failed"
    });
  }
}

export async function me(
  req: Request,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const user =
      await authService.getCurrentUser(
        req.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "User not found"
    });
  }
}