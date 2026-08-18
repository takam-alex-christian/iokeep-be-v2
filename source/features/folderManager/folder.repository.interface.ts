// Domain types (decoupled from any ORM) and the persistence contract for Folders.

type Folder = {
  id: string;
  ownerId: string;
  folderName: string;
  creationDate: Date;
  lastOpenedDate: Date;
  lastModifiedDate: Date;
  isPublic: boolean;
};

type NewFolder = {
  ownerId: string;
  folderName: string;
};

type FolderUpdate = {
  folderName?: string;
  lastModifiedDate?: Date;
  lastOpenedDate?: Date;
  isPublic?: boolean;
};

interface IFolderRepository {
  findByOwnerAndName(ownerId: string, folderName: string): Promise<Folder | null>;
  create(data: NewFolder): Promise<Folder>;
  findByOwner(ownerId: string): Promise<Folder[]>;
  update(folderId: string, data: FolderUpdate): Promise<Folder | null>;
  delete(folderId: string): Promise<boolean>;
  findById(folderId: string): Promise<Folder | null>;
}

export type { Folder, NewFolder, FolderUpdate, IFolderRepository };
