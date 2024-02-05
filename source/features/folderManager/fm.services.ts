


import { FolderModel } from "./fm.model";



// create folder
// read folders
// update folder
// delete folder

function createFolder({ ownerId, folderName }: { ownerId: string, folderName: string }): Promise<{ folderId: string }> {
    return new Promise((createFolderResolve, createFolderReject) => {

        // ensure no folder with this foldername is owned by a user of this userid

        FolderModel.findOne({ folderName, ownerId }).then((folderDoc) => {

            if (!folderDoc) {

                // create folder

                new FolderModel({ ownerId, folderName }).save().then((folderDoc) => {

                    createFolderResolve({ folderId: folderDoc._id.toString() })
                    // console.log("got here though ?")

                }, (err) => { // mongoose error
                    createFolderReject(err)
                })

            } else {
                createFolderReject(new Error("A folder Already exists with this folder name"))
            }

        }, (err) => {
            createFolderReject(err)
        })

        console.log("got here expectedly")
    })
}

//get folders by ownerId
function readFolders({ ownerId }: { ownerId: string }): Promise<any> {
    return new Promise((readFoldersResolve, readFoldersReject) => {

        FolderModel.find({ ownerId }).then((folderDocs) => {
            readFoldersResolve(folderDocs)
        }, (err) => {
            readFoldersReject(err)
        })

    })
}

//update folder 
function updateFolder(folderId: string, folderUpdateOptions: { folderName?: string, lastModifiedDate?: Date, lastOpenedDate?: Date }): Promise<boolean> {
    return new Promise((updateFolderResolve, updateFolderReject) => {
        //
        FolderModel.findByIdAndUpdate(folderId, { ...folderUpdateOptions }).then((folderDoc) => {
            if (folderDoc) {

                updateFolderResolve(true)

            } else updateFolderReject(new Error("Folder with provided id doesn\'t exist "))
        }, (err) => {
            updateFolderReject(err)
        })
    })
}

//delete folderById
function deleteFolder({ folderId }: { folderId: string }): Promise<any> {
    return new Promise((deleteFolderResolve, deleteFolderReject) => {
        //
    })
}

export { createFolder, readFolders, updateFolder}