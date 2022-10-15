declare global {
    namespace Express {
        interface Request {
            auth?: any;
            req_ip: string;
        }
    }
}

export {};
