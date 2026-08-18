import { prisma } from "../client";

import type {
  IUserRepository,
  NewUser,
  User,
} from "../../features/userAuthentication/user.repository.interface";

class PrismaUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: NewUser): Promise<User> {
    return prisma.user.create({ data });
  }

  async addRefreshToken(userId: string, token: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokens: { push: token } },
    });
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error("no_matching_user");
    }

    const refreshTokens = user.refreshTokens.filter((each) => each !== token);

    await prisma.user.update({
      where: { id: userId },
      data: { refreshTokens: { set: refreshTokens } },
    });
  }
}

export default PrismaUserRepository;
