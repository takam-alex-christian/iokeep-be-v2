
type CreateFolderJsonResponse = {
    success: boolean,
    info: string,
    error: null | {
        message: string
    },
    data: {
        folderId: string
    } | null,
    timeStamp: number
}

type ReadFoldersJsonResponse = Array<any> //folderDocs

type GenericFolderJsonResponse = {
    success: boolean,
    error: null | {message: string}
    timeStamp: number
}


export type { CreateFolderJsonResponse, ReadFoldersJsonResponse, GenericFolderJsonResponse}