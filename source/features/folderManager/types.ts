type FolderJson = {
  _id: string;
  ownerId: string;
  folderName: string;
  creationDate: Date;
  lastOpenedDate: Date;
  lastModifiedDate: Date;
  isPublic: boolean;
  size?: number;
};

type CreateFolderJsonResponse = {
  success: boolean;
  info: string;
  error: null | {
    message: string;
  };
  data: {
    folderId: string;
  } | null;
  timeStamp: number;
};

type ReadFoldersJsonResponse = FolderJson[];

type GenericFolderJsonResponse = {
  success: boolean;
  error: null | { message: string };
  timeStamp: number;
};

export type {
  CreateFolderJsonResponse,
  ReadFoldersJsonResponse,
  GenericFolderJsonResponse,
  FolderJson,
};
