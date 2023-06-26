import {ACLHandler, Handler} from "../../types/router.js";
import {ResponseSuccess} from "../../types/response.js";

export default function (aclChecker?: ACLHandler, handler?: Handler, checkDefault = true): Handler {
    if (aclChecker === false) return null;
    if (!aclChecker && !checkDefault) return null;
    return async (req, res, next) => {
        const data = await handler?.(req, res, next);
        if (data === true) return true;
        if ((<ResponseSuccess<any>>data)?.owner === req.auth?.id) return data;
        return aclChecker ? await aclChecker(req, data) : false;
    }
}
