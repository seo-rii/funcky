import express, {type Application} from 'express';
import ws, {type Instance} from 'express-ws';
import prepare from "./express/prepare.js";
import handler from "./express/handler/index.js";
import generator from "./express/handler/generator.js";
import acl from "./express/handler/acl.js";
import justRun from "./express/handler/justRun.js";
import _funcky from './config.js'
import log from "./util/log.js";
import authRouter, {auth} from './util/jwt.js'
import {ACLHandler, Handler, PostHandler, RouteCallback, Router, SSEHandler} from "./types/router.js";
import sse from "./express/handler/sse.js";

interface AppConfig extends RouteCallback {
    app: Application
    config: any
}

export default function ({port, name, cb, config}: {
    port?: number, name: string, config: any, cb?: (data: AppConfig) => any
}) {
    return new Promise<void>(async (resolve) => {
        if (!name) name = 'funcky'
        if (!port) {
            if (config.port) port = config.port;
            else port = 80
        }
        if (!config) config = {} as any

        const useWs = config.ws !== false;
        const instance = useWs ? ws(express()) : {app: express()}, app = instance.app;

        prepare(app, config);
        app.use(authRouter);
        express().use('', () => null);

        if (cb) {
            const defaultMethods = ['get', 'post', 'put', 'delete', 'patch', 'use'];
            const defaultRouter = (<RouteCallback>defaultMethods.reduce((r, method) => {
                return {
                    ...r, [method]: (path: string, f: Handler, {
                        auth: _auth,
                        acl: _acl,
                        post: _post
                    }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                        app[method](path, generator(f, g => handler(config, auth(!!(_auth)), acl(_acl, g), auth(_auth), justRun(_post, g))));
                    },
                    sse: (path: string, f: SSEHandler, {
                        auth: _auth,
                        acl: _acl
                    }: { auth?: any, acl?: ACLHandler } = {}) => {
                        app.get(path, <any>generator(sse(f), g => handler(config, auth(!!(_auth)), acl(_acl, g), auth(_auth))));
                    }
                };
            }, {}));
            defaultRouter.del = defaultRouter.delete;
            defaultRouter.u = defaultRouter.use;

            await cb({
                app,
                config,
                ...defaultRouter,

                r: async (path: string, f: Router) => {
                    (<Application>app).use(path, await f(useWs ? (<Instance>instance) : null, config));
                },
                ws: useWs ? (<Instance['app']>app).ws?.bind?.(app) as Instance['app']['ws'] : null,
                use: app.use.bind(app)
            })
        }

        (<Application>app).get('/', (req, res) => {
            res.send(`${name} v${config.version}.${config.commitCount} (${config.commitHash})
            <br/>
            By <a href="https://github.com/seo-rii/funcky">funcky</a> v${_funcky.version}.${_funcky.commitCount} (<a href="https://github.com/seo-rii/funcky/commit/${_funcky.commitHash}">${_funcky.commitHash}</a>)`);
        })

        app.use(handler(config, async () => {
            return {
                error: 'Not Found',
                code: 404
            }
        }))

        return app.listen(port, resolve);
    }).then(() => {
        log(`${name} v${config.version}.${config.commitCount} (${config.commitHash}) is running on port ${port}.`);
    })
}
