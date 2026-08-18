import { Request, Response, NextFunction } from "express";

import { repositories } from "../../db";

import { createFolderService } from "./fm.services";
import {
  CreateFolderJsonResponse,
  ReadFoldersJsonResponse,
  GenericFolderJsonResponse,
  FolderJson,
} from "./types";

const folderService = createFolderService(
  repositories.folders,
  repositories.notes
);

async function createFolderController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const jsonResponse: CreateFolderJsonResponse = {
    success: false,
    info: "",
    error: null,
    data: null,
    timeStamp: Date.now(),
  };

  if (req.body.folderName) {
    await folderService
      .createFolder({
        ownerId: res.locals.userId,
        folderName: req.body.folderName,
      })
      .then(
        (folderDoc) => {
          res.status(201);

          jsonResponse.success = true;
          jsonResponse.info = "Folder created successfully!";
          jsonResponse.data = { folderId: folderDoc.folderId };
        },
        (err) => {
          jsonResponse.error = { message: err.message };
          res.status(500);

          console.log(err);
        }
      );
  } else {
    jsonResponse.error = {
      message: "Bad Request! folderName field is missing",
    };
    res.status(400);
  }

  res.json(jsonResponse);
}

async function readFoldersController(req: Request, res: Response) {
  let jsonResponse: ReadFoldersJsonResponse = [];

  let folderDocs: FolderJson[] = [];

  await folderService.readFolders({ ownerId: res.locals.userId }).then(
    (foundFolderDocs) => {
      folderDocs = foundFolderDocs;
    },
    (err) => {
      res.status(500);
      console.log(err);
    }
  );

  await folderService.countNotesByFolderIds(folderDocs).then(
    (updatedFolderArr) => {
      jsonResponse = updatedFolderArr;
      console.log(updatedFolderArr);
    },
    (err) => {
      res.status(500);
      console.log(err);
    }
  );

  res.json(jsonResponse);
}

async function updateFolderController(req: Request, res: Response) {
  const jsonResponse: GenericFolderJsonResponse = {
    success: false,
    error: null,
    timeStamp: Date.now(),
  };

  if (req.body.folderObject) {
    await folderService
      .updateFolder(req.params.folderId, { ...req.body.folderObject })
      .then(
        () => {
          res.status(200);
          jsonResponse.success = true;
        },
        (err) => {
          console.log(err);

          res.status(500);
          jsonResponse.error = { message: err.message };
        }
      );
  } else {
    res.status(400);
    jsonResponse.error = { message: "Bad Request! folderObject missing" };
  }

  res.json(jsonResponse);
}

async function deleteFolderController(req: Request, res: Response) {
  const jsonResponse: GenericFolderJsonResponse = {
    success: false,
    error: null,
    timeStamp: Date.now(),
  };

  await folderService.deleteFolder(req.params.folderId).then(
    (deleted) => {
      res.status(200);
      jsonResponse.success = deleted;
    },
    (err) => {
      console.log(err);

      res.status(500);
      jsonResponse.error = { message: err.message };
    }
  );

  res.json(jsonResponse);
}

export {
  createFolderController,
  readFoldersController,
  updateFolderController,
  deleteFolderController,
};
