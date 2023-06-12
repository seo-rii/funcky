import {v4 as uuidv4} from 'uuid';
import short from 'short-uuid';

const min = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&'()*+-.:<=>?@[]^`{|}~/";
const sh = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_.";
const trm = short(min);
const trs = short(sh);

type Uuid = typeof uuidv4 & {
    short: () => string, encode: (string) => string, decode: (string) => string,
    mshort: () => string, mencode: (string) => string, mdecode: (string) => string,
};

const uuid: Uuid = <Uuid>uuidv4;
uuid.short = trs.generate;
uuid.encode = trs.fromUUID;
uuid.decode = trs.toUUID;
uuid.mshort = trm.generate;
uuid.mencode = trm.fromUUID;
uuid.mdecode = trm.toUUID;

export default uuid;