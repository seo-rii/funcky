import {Handler, PostHandler} from "../../types/router.js";

export default function (f: PostHandler, g: Handler): Handler {
    if (!f) f = async (ctx) => ctx;
    return async (req, res, next) => f(await g(req, res, next), req, res, next)
}