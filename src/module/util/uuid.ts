import {v4 as uuidv4} from 'uuid';
import short from 'short-uuid';

const base = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&'()*+-.:<=>?@[]^`{|}~";
const tr = short(base);

type Uuid = typeof uuidv4 & { short: () => string, encode: (string) => string, decode: (string) => string };

const uuid: Uuid = <Uuid>uuidv4;
uuid.short = tr.generate;
uuid.encode = tr.fromUUID;
uuid.decode = tr.toUUID;

export default uuid;