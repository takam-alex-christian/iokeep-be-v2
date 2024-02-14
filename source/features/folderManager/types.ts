
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

type ReadFoldersJsonResponse = {
    error: null | { message: string },
    data: Array<any> //folderDocs
    timeStamp: number
}

type GenericFolderJsonResponse = {
    success: boolean,
    error: null | {message: string}
    timeStamp: number
}


export type { CreateFolderJsonResponse, ReadFoldersJsonResponse, GenericFolderJsonResponse}