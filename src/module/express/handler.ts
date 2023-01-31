import express from "express";
import {error} from "../util/log";
import {ResponseError, ResponseSuccess} from "../types/response";
import {ACLHandler, Handler, PostHandler, Request} from "../types/router";
import bson from 'bson-ext';

export default function (config: any, ...f: Handler[]): express.RequestHandler {
    f = f.filter(x => x);
    return async (req, res, next) => {
        for (let i of f) {
            if (!i) continue;
            try {
                const data = await i(req as Request, res, next);
                if (data === false) continue;
                if (data === true) return;
                if ((data as ResponseError<any>).error) res.status((data as ResponseError<any>).code || 500);
                if (config.bson && req.accepts('application/bson')) {
                    res.set('Content-Type', 'application/bson');
                    await res.send(bson.serialize(data));
                } else await res.json(data);
                return;
            } catch (e) {
                error(e);
                res.status(500);
                if (config.bson && req.accepts('application/bson')) {
                    res.set('Content-Type', 'application/bson');
                    await res.send(bson.serialize({error: e.message, code: 500}));
                } else await res.json({error: e.message, code: 500});
                return;
            }
        }
    };
}

export function justRun(f: PostHandler, g: Handler): Handler {
    if (!f) f = async (ctx) => ctx;
    return async (req, res, next) => f(await g(req, res, next), req, res, next)
}

export function acl(aclChecker?: ACLHandler, handler?: Handler, checkDefault = true): Handler {
    if (aclChecker === false) return null;
    if (!aclChecker && !checkDefault) return null;
    return async (req, res, next) => {
        const data = await handler?.(req, res, next);
        if (data === true) return true;
        if ((<ResponseSuccess<any>>data)?.owner === req.auth?.id) return data;
        return aclChecker ? await aclChecker(req, data) : false;
    }
}

export function generator(f: Handler | express.RequestHandler, h: (f: Handler) => express.RequestHandler = x => x): express.RequestHandler {
    return (req, res, next) => {
        let data = undefined;
        const g = async (req, res, next) => {
            if (data !== undefined) return data;
            data = await f(req, res, next);
            return data;
        }
        g.refresh = async () => {
            data = undefined;
            return false;
        }

        h(g)(req, res, next);
    }
}
