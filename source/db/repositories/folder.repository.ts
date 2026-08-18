import { prisma } from "../client";

import type {
  Folder,
  FolderUpdate,
  IFolderRepository,
  NewFolder,
} from "../../features/folderManager/folder.repository.interface";

class PrismaFolderRepository implements IFolderRepository {
  async findByOwnerAndName(
    ownerId: string,
    folderName: string
  ): Promise<Folder | null> {
    return prisma.folder.findUnique({
      where: { ownerId_folderName: { ownerId, folderName } },
    });
  }

  async create(data: NewFolder): Promise<Folder> {
    return prisma.folder.create({ data });
  }

  async findByOwner(ownerId: string): Promise<Folder[]> {
    return prisma.folder.findMany({ where: { ownerId } });
  }

  async update(folderId: string, data: FolderUpdate): Promise<Folder | null> {
    const result = await prisma.folder.updateMany({
      where: { id: folderId },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.folder.findUnique({ where: { id: folderId } });
  }

  async delete(folderId: string): Promise<boolean> {
    const result = await prisma.folder.deleteMany({ where: { id: folderId } });
    return result.count > 0;
  }

  async findById(folderId: string): Promise<Folder | null> {
    return prisma.folder.findUnique({ where: { id: folderId } });
  }
}

export default PrismaFolderRepository;
