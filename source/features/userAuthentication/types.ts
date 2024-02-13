

type AuthJsonResponse = {
    success: boolean,
    info: string, // predominantly to inform the user
    error: {
        message: string,
    } | null
    timeStamp: number, // can come in handy when tracking error
}


export type {AuthJsonResponse}