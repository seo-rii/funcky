import './util/env'
import App from "./app.js";
import _log from "./util/log.js";
import _router from "./express/router.js";
import {auth as _auth} from "./util/jwt.js";
import _handler from "./express/handler.js";
import {v4 as uuidv4} from 'uuid';

export const log = _log;
export const router = _router;
export const auth = _auth;
export const handler = _handler;
export const uuid = uuidv4;

export default App;
