import express, {type RouterOptions} from "express";
import handler from "./handler/index.js";
import acl from "./handler/acl.js";
import generator from "./handler/generator.js";
import justRun from "./handler/justRun.js";
import ws from 'express-ws';
import type {
    ACLHandler,
    Handler,
    PostHandler,
    RouteCallback,
    Router,
    RouterConfig,
    SSEHandler
} from "../types/router.js";
import {auth} from "../util/jwt.js";
import sse from "./handler/sse.js";

export default function Router<T = {}>(cb?: (data: RouterConfig<T>) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler): Router {
    return async (wsInstance: ws.Instance, config: any) => {
        const router = express.Router({mergeParams: true, ...(options || {})})
        wsInstance?.applyTo?.(router)

        const defaultMethods = ['get', 'post', 'put', 'delete', 'patch', 'use'];
        const defaultRouter: RouteCallback = {
            ...(<RouteCallback>defaultMethods.reduce((r, method) => {
                return {
                    ...r, [method]: (path: string, f: Handler, {
                        auth: __auth,
                        acl: __acl,
                        post: __post
                    }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                        router[method](path, generator(f, g => handler(config, auth(!!(_auth || __auth)), acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), justRun(__post, g))));
                    }
                };
            }, {})),

            r: async (path: string, f: Router) => {
                router.use(path, await f(wsInstance, config));
            },

            ir: async <U = {}>(path: string, f: (data: RouterConfig<T & U>) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler) => {
                router.use(path, await (await Router(f, options, _auth, _acl))(wsInstance, config));
            },

            sse: (path: string, f: SSEHandler, {
                auth: __auth,
                acl: __acl
            }: { auth?: any, acl?: ACLHandler } = {}) => {
                router.get(path, generator(sse(f), g => handler(config, auth(!!(_auth || __auth)), acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth))));
            }
        }

        defaultRouter.del = defaultRouter.delete;
        defaultRouter.u = defaultRouter.use;

        if (cb) {
            if (!_auth) await cb({
                router,
                ...defaultRouter,
                use: router.use.bind(router),
                ws: router.ws?.bind?.(router)
            })
            else await cb({
                router,
                ...defaultRouter,
                use: (...args: any) => {
                    router.use(args[0], ...args.slice(1).map(r => generator(r, g => handler(config, auth(!!_auth), acl(_acl, g, false), auth(_auth), g))));
                },
                ws: router.ws?.bind?.(router)
            })
        }
        return router as express.Router;
    }
}
