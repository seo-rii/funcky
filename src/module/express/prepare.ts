import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import {logm} from "../util/log";
import bson from 'bson-ext';

export default function (app: express.Application, config: any) {
    app.use(cors({
        credentials: true,
        origin: config.cors,
    }));
    app.use(helmet());
    app.use(morgan("combined", {
        "stream": {
            write: (str) => {
                logm('[$M] ' + str);
            }
        }
    }))
    app.use(express.raw({type: 'application/bson', limit: '10mb'}))
    app.use(express.json({limit: "10mb"}));
    app.use(express.urlencoded({limit: "10mb", extended: true}));
    app.use((error, req, res, next) => res.status(500).send({error: error.message, code: 500}));
    app.use(cookieParser());
    app.use(compression(() => true));
    app.use((req, res, next) => {
        if (Buffer.isBuffer(req.body)) {
            req.body = bson.deserialize(req.body);
        }
        next();
    });
}
