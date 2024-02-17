


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
function deleteFolder(folderId: string): Promise<boolean> {
    return new Promise((deleteFolderResolve, deleteFolderReject) => {

        FolderModel.findById(folderId).then((folderDoc)=>{
            if (folderDoc){
                folderDoc.deleteOne().then((deleteResult)=>{
                    deleteFolderResolve(deleteResult.acknowledged)
                }, (err)=>{
                    deleteFolderReject(err)
                })
            }else {
                deleteFolderReject(new Error("folder_does_not_exist"))
            }
        }, (err)=>{
            deleteFolderReject(err)
        })
        FolderModel.findByIdAndDelete(folderId).then((folderDoc)=>{
            deleteFolderResolve(true)
        }, (err)=>{
            deleteFolderReject(err)
        })
    })
}

export { createFolder, readFolders, updateFolder, deleteFolder}