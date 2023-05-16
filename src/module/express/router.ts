import express, {RouterOptions} from "express";
import handler, {acl, generator, justRun} from "./handler.js";
import ws from 'express-ws';
import {ACLHandler, Handler, PostHandler, RouteCallback, Router} from "../types/router.js";
import {auth} from "../util/jwt.js";

interface RouterConfig extends RouteCallback {
    router: express.Router
}

export default function (cb?: (data: RouterConfig) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler): Router {
    return async (wsInstance: ws.Instance, config: any) => {
        const router = express.Router(options)
        wsInstance?.applyTo?.(router)

        const defaultMethods = ['get', 'post', 'put', 'delete', 'patch'];
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
        }

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
                use: (...args) => {
                    router.use(args[0], ...args.slice(1).map(r => generator(r, g => handler(config, auth(!!_auth), acl(_acl, g, false), auth(_auth), g))));
                },
                ws: router.ws?.bind?.(router)
            })
        }
        return router as express.Router;
    }
}
