import jwt from 'jsonwebtoken';
import express from "express";
import {Handler} from "$types/router";

const secretKey = process.env.jwt || 'secretKey';

export function sign(data, expire) {
    return jwt.sign(data, secretKey, {
        ...(expire ? {expiresIn: expire} : {})
    });
}

export function verify(token) {
    try {
        return jwt.verify(token, secretKey);
    } catch (e) {
        return null;
    }
}

export function save(res: express.Response, data: any, expire?: number, domain?: string) {
    res.cookie('auth', sign(data, expire), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain
    });
}

export function revoke(res: express.Response) {
    res.clearCookie('auth');
}

export default function (req: express.Request, res: express.Response, next: express.NextFunction) {
    req.auth = verify(req.cookies?.auth);
    req.req_ip = req.headers['x-forwarded-for'] as any as string || req.socket.remoteAddress;
    next();
}

export const auth = (permission?: Object): Handler => {
    if (!permission) return null;
    return async (req) => {
        if (!req.auth) return {error: 'Authorization required', code: 401};
        if (typeof permission === 'object') {
            for (let key in permission) {
                if (req.auth.permission[key] !== permission[key]) return {error: 'Permission denied', code: 403};
            }
        }
        return false;
    }
}

auth.sign = sign;
auth.verify = verify;
auth.save = save;
auth.revoke = revoke;
