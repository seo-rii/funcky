import type {Request} from "../../types/router.js";
import type {Handler, SSEHandler} from "../../types/router.js";

export default function (handler: SSEHandler): Handler {
    return async (req: Request, res) => {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.status(200);
        res.flushHeaders();
        res.on('close', () => res.end());

        (async () => {
            const r = handler(req);
            while (true) {
                try {
                    const {value, done} = await r.next();
                    if (done) break;
                    res.write(`data: ${JSON.stringify(value)}\n\n`);
                } catch (e) {
                    res.write(`event: error\ndata: ${JSON.stringify(e.message)}\n\n`);
                    break;
                }
            }
            res.end();
        })().then().catch();

        return true;
    }
}