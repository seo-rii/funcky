import express, {RouterOptions} from "express";
import handler, {acl, generator, justRun} from "./handler";
import ws from 'express-ws';
import {ACLHandler, Handler, PostHandler, RouteCallback, Router} from "../types/router";
import {auth} from "../util/jwt";

interface RouterConfig extends RouteCallback {
    router: express.Router
}

export default function (cb?: (data: RouterConfig) => any, options?: RouterOptions, _auth?: any, _acl?: ACLHandler): Router {
    return async (wsInstance: ws.Instance) => {
        const router = express.Router(options)
        wsInstance?.applyTo?.(router)

        const defaultRouter = {
            get: (path: string, f: Handler, {
                auth: __auth,
                acl: __acl,
                post: __post
            }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                let g = generator(f);
                let h = justRun(__post, g);
                router.get(path, handler(auth(!!(_auth || __auth)), g.refresh, acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), h));
            },
            post: (path: string, f: Handler, {
                auth: __auth,
                acl: __acl,
                post: __post
            }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                let g = generator(f);
                let h = justRun(__post, g);
                router.post(path, handler(auth(!!(_auth || __auth)), g.refresh, acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), h));
            },
            put: (path: string, f: Handler, {
                auth: __auth,
                acl: __acl,
                post: __post
            }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                let g = generator(f);
                let h = justRun(__post, g);
                router.put(path, handler(auth(!!(_auth || __auth)), g.refresh, acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), h));
            },
            delete: (path: string, f: Handler, {
                auth: __auth,
                acl: __acl,
                post: __post
            }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                let g = generator(f);
                let h = justRun(__post, g);
                router.delete(path, handler(auth(!!(_auth || __auth)), g.refresh, acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), h));
            },
            patch: (path: string, f: Handler, {
                auth: __auth,
                acl: __acl,
                post: __post
            }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                let g = generator(f);
                let h = justRun(__post, g);
                router.patch(path, handler(auth(!!(_auth || __auth)), g.refresh, acl(_acl, g), acl(__acl, g), auth(_auth), auth(__auth), h));
            },
            r: async (path: string, f: Router) => {
                router.use(path, await f(wsInstance));
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
                    router.use(args[0], ...args.slice(1).map(r => {
                        let g = generator(r);
                        return handler(auth(!!_auth), g.refresh, acl(_acl, g, false), auth(_auth), g)
                    }));
                },
                ws: router.ws?.bind?.(router)
            })
        }
        return router as express.Router;
    }
}
