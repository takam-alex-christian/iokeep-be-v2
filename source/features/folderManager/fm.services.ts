import type {
  Folder,
  FolderUpdate,
  IFolderRepository,
} from "./folder.repository.interface";
import type { INoteRepository } from "../noteManager/note.repository.interface";
import type { FolderJson } from "./types";

function toFolderJson(folder: Folder): FolderJson {
  return {
    _id: folder.id,
    ownerId: folder.ownerId,
    folderName: folder.folderName,
    creationDate: folder.creationDate,
    lastOpenedDate: folder.lastOpenedDate,
    lastModifiedDate: folder.lastModifiedDate,
    isPublic: folder.isPublic,
  };
}

function createFolderService(
  folderRepo: IFolderRepository,
  noteRepo: INoteRepository
) {
  async function createFolder({
    ownerId,
    folderName,
  }: {
    ownerId: string;
    folderName: string;
  }): Promise<{ folderId: string }> {
    const existing = await folderRepo.findByOwnerAndName(ownerId, folderName);

    if (existing) {
      throw new Error("A folder Already exists with this folder name");
    }

    const folder = await folderRepo.create({ ownerId, folderName });

    return { folderId: folder.id };
  }

  async function readFolders({
    ownerId,
  }: {
    ownerId: string;
  }): Promise<FolderJson[]> {
    const folders = await folderRepo.findByOwner(ownerId);

    if (folders.length === 0) {
      const defaultFolder = await folderRepo.create({
        ownerId,
        folderName: "Default",
      });
      return [toFolderJson(defaultFolder)];
    }

    return folders.map(toFolderJson);
  }

  async function countNotesByFolderIds(
    folderDocs: FolderJson[]
  ): Promise<FolderJson[]> {
    const folderIds = folderDocs.map((folder) => folder._id);
    const counts = await noteRepo.countByFolderIds(folderIds);

    return folderDocs.map((folder) => ({
      ...folder,
      size: counts.get(folder._id) ?? 0,
    }));
  }

  async function updateFolder(
    folderId: string,
    folderUpdateOptions: FolderUpdate
  ): Promise<boolean> {
    const updated = await folderRepo.update(folderId, folderUpdateOptions);

    if (!updated) {
      throw new Error("Folder with provided id doesn't exist ");
    }

    return true;
  }

  async function deleteFolder(folderId: string): Promise<boolean> {
    const deleted = await folderRepo.delete(folderId);

    if (!deleted) {
      throw new Error("folder_does_not_exist");
    }

    return true;
  }

  return {
    createFolder,
    readFolders,
    countNotesByFolderIds,
    updateFolder,
    deleteFolder,
  };
}

export { createFolderService };
