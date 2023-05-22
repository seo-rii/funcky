import express, {RouterOptions} from "express";
import {ResponseInternal} from "./response.js";
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
export type Router = (wsInstance: ws.Instance | null, config: any) => Promise<express.Router>

export interface RouteCallback<T = {}> {
    get: HandlerRegistrator<T>,
    post: HandlerRegistrator<T>,
    put: HandlerRegistrator<T>,
    delete: HandlerRegistrator<T>,
    patch: HandlerRegistrator<T>,
    use: express.IRouterHandler<any> & express.IRouterMatcher<any>,
    ws: ws.WebsocketMethod<any>,
    r: (path: string, f: Router) => Promise<any>,
    ir: (path: string, f: (data: RouterConfig<T>) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler) => Promise<any>,
}

export interface RouterConfig<T = {}> extends RouteCallback<T> {
    router: express.Router
}