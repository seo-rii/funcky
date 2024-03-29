import * as childProcess from 'child_process';
import * as fs from "fs";
import * as path from "path";
import * as esbuild from 'esbuild';
import * as dotenv from "dotenv";
import argParser from 'args-parser';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

const args = argParser(process.argv);
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

const runServerPlugin = {
    name: 'run-server',
    setup(build) {
        let server;
        build.onEnd(result => {
            if (result.errors.length) {
                console.error('⚠ Watch build failed. See errors above.');
                for (const error of result.errors) {
                    console.error(error.text);
                }
            } else {
                for (let i = 0; i < process.stdout.rows; i++) console.log('');
                process.stdout.cursorTo(0, 0);
                console.log('✔ Build successful.');
                if (server) {
                    server.kill();
                    console.log('⚡ Retarting server...');
                } else console.log('⚡ Starting server...');
                server = childProcess.spawn('node', [...(args['path-resolver'] ? ['--experimental-loader=extensionless'] : []), path.join(process.cwd(), args.dist || 'build/index.mjs')], {
                    stdio: 'inherit',
                    env: {...process.env, ['env-path']: args['env-path']}
                });
            }
        });
    },
}

const makeAllPackagesExternalPlugin = {
    name: 'make-all-packages-external',
    setup(build) {
        const internal = (args.internal || '').split(',').filter(i => i);
        if (internal.length) build.onResolve({filter: /(.*?)/}, args => internal.some(i => args.path.startsWith(i)) ? {external: false} : undefined);
        build.onResolve({filter: /[A-Z]:\/*/}, () => ({external: false}));
        build.onResolve({filter: /\$\/*/}, () => ({external: false}));
        build.onResolve({filter: /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/}, args => ({path: args.path, external: true}))
    },
}

const config = JSON.stringify({
    'version': packageJson.version,
    'commitHash': childProcess.execSync('git rev-parse HEAD', {cwd: process.cwd()}).toString().trim(),
    'commitCount': parseInt(childProcess.execSync('git rev-list --count HEAD', {cwd: process.cwd()}).toString().trim()),
    'buildDate': new Date().toISOString(),
    'port': args.port || (args.dev ? 3006 : 80),
    'dev': args.dev,
});

const tscOpt = args.tsc ? [esbuildPluginTsc({force: true})] : []
const opt: any = {
    entryPoints: [path.join(process.cwd(), args.entry || 'src/index.ts')],
    outfile: path.join(process.cwd(), args.dist || 'build/index.mjs'),
    bundle: true,
    plugins: args.dev ? [runServerPlugin, makeAllPackagesExternalPlugin, ...tscOpt] : [makeAllPackagesExternalPlugin, ...tscOpt],
    platform: 'node',
    define: {config},
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    format: 'esm',
};

if (args.config) {
    import('clipboardy').then(clipboardy => {
        const res = JSON.stringify(dotenv.config({
            path: process.env["env-path"],
            override: false
        }).parsed);
        console.log(res);
        clipboardy.default.writeSync(res);
    });
} else if (!args.dev) esbuild.build(opt).then(result => {
    if (result.errors.length) {
        console.error('⚠ Build failed. See errors above.');
        for (const error of result.errors) {
            console.error(error.text);
        }
    } else console.log('✔ Build successful.');
}); else esbuild.context(opt).then(async (ctx) => {
    if (!args.dev) {
        const result = await ctx.rebuild();
        if (result.errors.length > 0) {
            console.error('Build failed.');
            for (const error of result.errors) console.error(error.text);
            process.exit(1);
        }
    } else await ctx.watch();
});
