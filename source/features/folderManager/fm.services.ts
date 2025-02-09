import { ObjectId } from "mongoose";
import { NoteModel } from "../noteManager/nm.model";
import { FolderModel } from "./fm.model";

// create folder
// read folders
// update folder
// delete folder

function createFolder({
  ownerId,
  folderName,
}: {
  ownerId: string;
  folderName: string;
}): Promise<{ folderId: string }> {
  return new Promise((createFolderResolve, createFolderReject) => {
    // ensure no folder with this foldername is owned by a user of this userid

    FolderModel.findOne({ folderName, ownerId }).then(
      (folderDoc) => {
        if (!folderDoc) {
          // create folder

          new FolderModel({ ownerId, folderName }).save().then(
            (folderDoc) => {
              createFolderResolve({ folderId: folderDoc._id.toString() });
              // console.log("got here though ?")
            },
            (err) => {
              // mongoose error
              createFolderReject(err);
            }
          );
        } else {
          createFolderReject(
            new Error("A folder Already exists with this folder name")
          );
        }
      },
      (err) => {
        createFolderReject(err);
      }
    );
  });
}

//get folders by ownerId
function readFolders({ ownerId }: { ownerId: string }): Promise<any> {
  return new Promise((readFoldersResolve, readFoldersReject) => {
    FolderModel.find({ ownerId }).then(
      (folderDocs) => {
        if (folderDocs.length == 0) {
          new FolderModel({ ownerId, folderName: "Default" })
            .save()
            .then((onlyFolderDoc) => {
              readFoldersResolve([onlyFolderDoc]);
            });
        } else {
          readFoldersResolve(folderDocs);
        }
      },
      (err) => {
        readFoldersReject(err);
      }
    );
  });
}

// partially tested and seams to work fine.
//this services gets an array of folder Docs and loop through each calculating each folder's number of child notes.
// it returns the original array plus a new key>value of size: number of notes counted
async function countNotesByFolderIds(folderDocs: Array<any>) {
  const output: Array<any> = [];

  for (let i = 0; i < folderDocs.length; i++) {
    await NoteModel.countDocuments({ folderId: folderDocs[i]._id }).then(
      (noteCount) => {
        output.push({ ...folderDocs[i].toObject(), size: noteCount });
      }
    );
  }

  return output;
}

//update folder
function updateFolder(
  folderId: string,
  folderUpdateOptions: {
    folderName?: string;
    lastModifiedDate?: Date;
    lastOpenedDate?: Date;
    isPublic?: boolean;
  }
): Promise<boolean> {
  return new Promise((updateFolderResolve, updateFolderReject) => {
    //
    FolderModel.findByIdAndUpdate(folderId, { ...folderUpdateOptions }).then(
      (folderDoc) => {
        if (folderDoc) {
          updateFolderResolve(true);
        } else
          updateFolderReject(
            new Error("Folder with provided id doesn't exist ")
          );
      },
      (err) => {
        updateFolderReject(err);
      }
    );
  });
}

//delete folderById
function deleteFolder(folderId: string): Promise<boolean> {
  return new Promise((deleteFolderResolve, deleteFolderReject) => {
    FolderModel.findById(folderId).then(
      (folderDoc) => {
        if (folderDoc) {
          folderDoc.deleteOne().then(
            (deleteResult) => {
              deleteFolderResolve(deleteResult.acknowledged);
            },
            (err) => {
              deleteFolderReject(err);
            }
          );
        } else {
          deleteFolderReject(new Error("folder_does_not_exist"));
        }
      },
      (err) => {
        deleteFolderReject(err);
      }
    );
    FolderModel.findByIdAndDelete(folderId).then(
      (folderDoc) => {
        deleteFolderResolve(true);
      },
      (err) => {
        deleteFolderReject(err);
      }
    );
  });
}

function isFolderPublic(folderId: string): Promise<boolean> {
  return new Promise((resolveFolderIsPublic, rejectFolderIsPublic) => {
    FolderModel.findById(folderId).then((foundFolderDoc) => {
      if (foundFolderDoc) {
        resolveFolderIsPublic(foundFolderDoc.isPublic);
      } else {
        rejectFolderIsPublic(new Error("folder inexistent."));
      }
    });
  });
}

export {
  createFolder,
  readFolders,
  countNotesByFolderIds,
  updateFolder,
  deleteFolder,
  isFolderPublic,
};
