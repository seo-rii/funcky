type Response<T> = Promise<ResponseSuccess<T> | ResponseError<T>>;

export type ResponseInternal<T> = Promise<ResponseSuccess<T> | ResponseError<T> | ResponseRedirect | boolean | null | undefined | void>;

export type ResponseSuccess<T> = {
    data: T
    owner?: number
}

export type ResponseError<T> = {
    error: string
    code: number
    owner?: number
    data?: T
}

export type ResponseRedirect = {
    redirect: string
    code?: number
}

export default Response;
