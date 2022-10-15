import * as childProcess from 'child_process';
import * as path from "path";

const packageJson = require(path.join(process.cwd(), 'package.json'));

const makeAllPackagesExternalPlugin = {
    name: 'make-all-packages-external',
    setup(build) {
        build.onResolve({ filter: /[A-Z]:\/*/ }, async () => ({ external: false }));
        build.onResolve({ filter: /\$\/*/ }, async () => ({ external: false }));
        build.onResolve({filter: /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/}, args => ({path: args.path, external: true}))
    },
}

const args = require('args-parser')(process.argv);

let builded;

const config = JSON.stringify({
    'version': packageJson.version,
    'commitHash': childProcess.execSync('git rev-parse HEAD', {cwd: process.cwd()}).toString().trim(),
    'commitCount': parseInt(childProcess.execSync('git rev-list --count HEAD', {cwd: process.cwd()}).toString().trim()),
    'buildDate': new Date().toISOString(),
    'port': args.port || (args.dev ? 3006 : 80),
    'dev': args.dev,
})

require('esbuild').build({
    entryPoints: [path.join(process.cwd(), args.entry)],
    outfile: path.join(process.cwd(), args.dist),
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
    platform: 'node',
    define: {config},
    tsconfig: path.join(process.cwd(), 'tsconfig.json'),
    ...(args.dev ? {
        watch: {
            onRebuild(error) {
                if (error) console.error('⚠ watch build failed:', error)
                else {
                    for (let i = 0; i < process.stdout.rows; i++) console.log('');
                    process.stdout.cursorTo(0, 0);
                    console.log('✔ Build successful.')
                    console.log('⚡ Restarting server...')
                    if (builded) builded.kill();
                    builded = childProcess.spawn('node', [path.join(process.cwd(), args.dist)], {stdio: 'inherit'});
                }
            },
        }
    } : {}),
}).then(() => {
    if (args.dev) {
        for (let i = 0; i < process.stdout.rows; i++) console.log('');
        process.stdout.cursorTo(0, 0);
        console.log('⚡ Starting server...')
        builded = childProcess.spawn('node', [path.join(process.cwd(), args.dist)], {stdio: 'inherit'});
    } else {
        console.log('✔ Build successful.')
    }
})
