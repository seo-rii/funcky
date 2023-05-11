import express, {type Application} from 'express';
import ws, {type Instance} from 'express-ws';
import prepare from "./express/prepare";
import handler, {acl, generator, justRun} from "./express/handler";
import _funcky from './config'
import log from "./util/log";
import authRouter, {auth} from './util/jwt'
import {ACLHandler, Handler, PostHandler, RouteCallback, Router} from "./types/router";

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
                            app[method](path, generator(f, g => handler(config, auth(!!(_auth)), acl(_acl, g), auth(_auth), justRun(_post, g))));
                        }
                    };
                }, {})),

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
