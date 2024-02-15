
type CreateNoteJsonResponse = {
    success: boolean,
    data: {
        _id: string
    },
    error: null | {message: string},
    timeStamp: number
}

type GenericNoteJsonResponse = { //patch & delete response
    success: boolean,
    info: string,
    error: null | {message: string},
    timeStamp: number
}

type SingleNoteJsonResponse = {//get one note
    data: null | {
        _id: string,
        editorState: string,
        creationDate: string,
        lastModified: string
    },
    error: null | {message: string},
    timeStamp: number

}

type MultiNoteJsonResponse = { //get many notes
    data: Array<{_id: string, editorState: string, creationDate: string, lastModified: string}>
    error: null | {message: string},
    timeStamp: number
}

export type {CreateNoteJsonResponse, GenericNoteJsonResponse, SingleNoteJsonResponse, MultiNoteJsonResponse}