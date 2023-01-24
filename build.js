import * as childProcess from 'child_process';
import * as fs from "fs";
import * as path from "path";
import * as esbuild from 'esbuild';
import argParser from 'args-parser';

const args = argParser(process.argv);
const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

const getOutput = (command, options) => {
    try {
        return childProcess.execSync(command, options).toString().trim()
    } catch (e) {
        return '';
    }
}

const makeAllPackagesExternalPlugin = {
    name: 'make-all-packages-external',
    setup(build) {
        build.onResolve({filter: /[A-Z]:\/*/}, async () => ({external: false}));
        build.onResolve({filter: /\$\/*/}, async () => ({external: false}));
        build.onResolve({filter: /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/}, args => ({path: args.path, external: true}))
    },
}

const config = JSON.stringify({
    'version': packageJson.version,
    'commitHash': getOutput('git rev-parse HEAD', {cwd: process.cwd()}) || '',
    'commitCount': parseInt(getOutput('git rev-list --count HEAD', {cwd: process.cwd()}) || '0'),
    'buildDate': new Date().toISOString(),
    'port': args.port || (args.dev ? 3006 : 80),
    'dev': args.dev,
})

const typePlugin = {
    name: 'TypeScriptDeclarationsPlugin',
    setup(build) {
        build.onEnd((result) => {
            if (result.errors.length > 0) return
            fs.writeSync('src/module/config.ts', `export default ${config}`)
            childProcess.execSync('tsc')
        })
    }
}

let builded;

function copyFolderSync(from, to) {
    fs.mkdirSync(to);
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            fs.copyFileSync(path.join(from, element), path.join(to, element));
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

fs.writeFileSync('src/module/config.ts', `export default ${config}`)
childProcess.execSync('tsc --module es2015')

esbuild.build({
    entryPoints: ['./src/runner.ts'],
    outfile: 'build/runner.js',
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
    platform: 'node',
    format: 'esm',
}).then(() => {
    console.log('✔ Build successful.')
})
