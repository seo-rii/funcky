import express, {type RouterOptions} from "express";
import type {ResponseInternal} from "./response.js";
import ws from 'express-ws';

export type Request<T = {}> = express.Request & { auth: any, req_ip: string } & Partial<T>;
export type Handler<T = {}> = (req: Request<T>, res?: express.Response, next?: express.NextFunction) => (ResponseInternal<any>)
export type PostHandler = (ctx: any, req: Request, res?: express.Response, next?: express.NextFunction) => (ResponseInternal<any>)
export type HandlerRegistrator<T = {}> = (path: string, handler: Handler<T>, options?: {
    auth?: any,
    acl?: ACLHandler,
    post?: PostHandler
}) => any
export type ACLHandler = ((req: Request, data: any) => Promise<boolean>) | false
export type RouterHandler<T = {}> = (req: Request<T>, res?: express.Response, next?: express.NextFunction) => any
export type Router = (wsInstance: ws.Instance | null, config: any) => Promise<express.Router>

export interface RouteCallback<T = {}> {
    get: HandlerRegistrator<T>,
    post: HandlerRegistrator<T>,
    put: HandlerRegistrator<T>,
    del: HandlerRegistrator<T>,
    delete: HandlerRegistrator<T>,
    patch: HandlerRegistrator<T>,
    use: (path: string, f: RouterHandler<T>, ...any) => any,
    ws: ws.WebsocketMethod<any>,
    r: (path: string, f: Router) => Promise<any>,
    ir: <U = {}>(path: string, f: (data: RouterConfig<T & U>) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler) => Promise<any>,
}

export interface RouterConfig<T = {}> extends RouteCallback<T> {
    router: express.Router
}