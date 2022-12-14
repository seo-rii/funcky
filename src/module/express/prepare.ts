import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import {logm} from "../util/log";

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
    app.use(express.json({limit: "200mb"}));
    app.use(express.urlencoded({extended: true}));
    app.use((error, req, res, next) => res.status(500).send({error: error.message, code: 500}));
    app.use(express.urlencoded({extended: true}));
    app.use(cookieParser());
    app.use(compression());
}
