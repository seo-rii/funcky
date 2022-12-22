import express from 'express';
import ws from 'express-ws';
import prepare from "./express/prepare";
import handler, {acl, generator, justRun} from "./express/handler";
import _funcky from './config'
import log from "$util/log";
import authRouter, {auth} from '$util/jwt'
import {ACLHandler, Handler, PostHandler, RouteCallback, Router} from "$types/router";

interface AppConfig extends RouteCallback {
    app: express.Application
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

        const instance = ws(express()), app = instance.app;

        prepare(app, config);
        app.use(authRouter);

        if (cb) {
            const defaultMethods = ['get', 'post', 'put', 'delete', 'patch'];

            await cb({
                app,
                config,
                ...(<RouteCallback>defaultMethods.reduce((r, method) => {
                    return {
                        ...r, [method]: (path: string, f: Handler, {
                            auth: _auth,
                            acl: _acl,
                            post: _post
                        }: { auth?: any, acl?: ACLHandler, post?: PostHandler } = {}) => {
                            app[method](path, generator(f, g => handler(auth(!!(_auth)), acl(_acl, g), auth(_auth), justRun(_post, g))));
                        }
                    };
                }, {})),

                r: async (path: string, f: Router) => {
                    app.use(path, await f(instance));
                },
                ws: app.ws?.bind?.(app) as typeof app.ws,
                use: app.use.bind(app)
            })
        }

        app.get('/', (req, res) => {
            res.send(`${name} v${config.version}.${config.commitCount} (${config.commitHash})
            <br/>
            By <a href="https://github.com/seo-rii/funcky">funcky</a> v${_funcky.version}.${_funcky.commitCount} (<a href="https://github.com/seo-rii/funcky/commit/${_funcky.commitHash}">${_funcky.commitHash}</a>)`);
        })

        app.use(handler(async () => {
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
