import { hash, compare } from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

import { user_auth_key, user_refresh_auth_key } from "../../config/config";

import type { IUserRepository } from "./user.repository.interface";

type TokenPayload = { userId: string };

function signToken(
  payload: TokenPayload,
  secret: string,
  options: SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(err);
        return;
      }

      if (typeof token !== "string") {
        reject(new Error("Failed to sign token"));
        return;
      }

      resolve(token);
    });
  });
}

function verifyToken(token: string, secret: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }

      if (!decoded || typeof decoded === "string") {
        reject(new Error("Invalid token payload"));
        return;
      }

      const userId = decoded.userId;

      if (typeof userId !== "string") {
        reject(new Error("Invalid token payload"));
        return;
      }

      resolve({ userId });
    });
  });
}

function createAuthService(userRepo: IUserRepository) {
  async function doesUsernameExist({
    username,
  }: {
    username: string;
  }): Promise<boolean> {
    const user = await userRepo.findByUsername(username);
    return user !== null;
  }

  async function authUser({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{
    userData: { username: string };
    authed: boolean;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await userRepo.findByUsername(username);

    if (!user) {
      throw new Error("user_not_found");
    }

    if (!user.password) {
      throw new Error("My Bad ;)");
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      throw new Error("Password incorrect");
    }

    const refreshToken = await signToken(
      { userId: user.id },
      user_refresh_auth_key,
      { algorithm: "HS256" }
    );

    await userRepo.addRefreshToken(user.id, refreshToken);

    const accessToken = await signToken({ userId: user.id }, user_auth_key, {
      algorithm: "HS256",
    });

    if (process.env.NODE_ENV === "development") {
      console.log({ user, passwordMatch, accessToken, refreshToken });
    }

    return {
      userData: { username: user.username },
      authed: true,
      accessToken,
      refreshToken,
    };
  }

  async function getAccessToken({
    refreshToken,
  }: {
    refreshToken: string;
  }): Promise<{ accessToken: string }> {
    const decoded = await verifyToken(refreshToken, user_refresh_auth_key);

    const user = await userRepo.findById(decoded.userId);

    if (!user) {
      throw new Error("No user with this _id");
    }

    if (!user.refreshTokens.includes(refreshToken)) {
      throw new Error("invalidated");
    }

    const accessToken = await signToken({ userId: user.id }, user_auth_key, {
      algorithm: "HS256",
      expiresIn: "10m",
    });

    return { accessToken };
  }

  async function createUser({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<{ username: string }> {
    const userExists = await doesUsernameExist({ username });

    if (userExists) {
      throw new Error("username_unavailable");
    }

    const generatedHash = await hash(password, 10);

    const user = await userRepo.create({ username, password: generatedHash });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `createUser called time: ${new Date(Date.now()).toISOString()}`
      );
    }

    return { username: user.username };
  }

  function verifyRefreshToken(
    refreshToken: string
  ): Promise<{ isVerified: boolean; isValid: boolean }> {
    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, user_refresh_auth_key, (err, decoded) => {
        if (err) {
          resolve({ isVerified: false, isValid: false });
          return;
        }

        if (!decoded || typeof decoded === "string") {
          resolve({ isVerified: true, isValid: false });
          return;
        }

        const userId = decoded.userId;

        userRepo.findById(userId).then(
          (user) => {
            const isValid = !!user?.refreshTokens.includes(refreshToken);
            resolve({ isVerified: true, isValid });
          },
          (dbErr) => reject(dbErr)
        );
      });
    });
  }

  async function logoutService(
    userId: string,
    refreshToken: string
  ): Promise<boolean> {
    await userRepo.removeRefreshToken(userId, refreshToken);
    return true;
  }

  return {
    createUser,
    authUser,
    getAccessToken,
    logoutService,
    verifyRefreshToken,
  };
}

export { createAuthService };
