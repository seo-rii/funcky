import * as dotenv from "dotenv";

dotenv.config({path: process.env['env-path']});
if (process.env._config) {
    const config = JSON.parse(process.env._config);
    for (const key in config) {
        process.env[key] = config[key];
    }
}