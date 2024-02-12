

type AuthJsonResponse = {
    success: boolean,
    error: {
        message: string,
    } | null
    timeStamp: number, // can come in handy when tracking error
}


export type {AuthJsonResponse}