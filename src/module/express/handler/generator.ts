import {Handler} from "../../types/router.js";
import express from "express";

export default function (f: Handler | express.RequestHandler, h: (f: Handler) => express.RequestHandler = x => x): express.RequestHandler {
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