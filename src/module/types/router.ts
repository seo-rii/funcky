import express from "express";
import {ResponseInternal} from "./response.js";
import ws from 'express-ws';

export type Request = express.Request & { auth: any, req_ip: string };
export type Handler = (req: Request, res?: express.Response, next?: express.NextFunction) => (ResponseInternal<any>)
export type PostHandler = (ctx: any, req: Request, res?: express.Response, next?: express.NextFunction) => (ResponseInternal<any>)
export type HandlerRegistrator = (path: string, handler: Handler, options?: {
    auth?: any,
    acl?: ACLHandler,
    post?: PostHandler
}) => any
export type ACLHandler = ((req: Request, data: any) => Promise<boolean>) | false
export type Router = (wsInstance: ws.Instance | null, config: any) => Promise<express.Router>

export interface RouteCallback {
    get: HandlerRegistrator,
    post: HandlerRegistrator,
    put: HandlerRegistrator,
    delete: HandlerRegistrator,
    patch: HandlerRegistrator,
    use: express.IRouterHandler<any> & express.IRouterMatcher<any>,
    ws: ws.WebsocketMethod<any>,
    r: (path: string, f: Router) => Promise<any>,
}
