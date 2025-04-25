import * as core from '@actions/core'
import * as p from 'path'
import * as fs from 'fs'

import {
    checkKey,
    checkPaths,
    getCacheBase,
    getCachePath
} from '../utils/cache'

async function run(): Promise<void> {
    try {
        /* 
          clean up caches
        */
        const cacheBase = core.getState('cache-base')
        const cleanKey = core.getInput('clean-key')
        const CLEAN_TIME = 7

        if (cleanKey) {
            core.info(`Checking for cache to clean`);
            const now = Date.now();
            const threshold = CLEAN_TIME * 24 * 60 * 60 * 1000; // days to ms

            const entries = fs.readdirSync(cacheBase, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.name.startsWith(cleanKey)) continue;
                if (!entry.isDirectory()) continue;

                const dirPath = p.join(cacheBase, entry.name);
                try {
                    const stats = fs.statSync(dirPath);
                    const atime = stats.atime.getTime();

                    if ((now - atime) > threshold) {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        console.log(`Deleted: ${dirPath}`);
                    }
                } catch (err) {
                    console.error(`Failed to handle ${dirPath}:`, err);
                }
            }
            core.info(`Checking for cache to clean: End`);

        }
    } catch (error) {
        if (error instanceof Error) core.warning(error.message)
    }

    try {
        const key = core.getInput('key')
        const base = core.getInput('base')
        const path = core.getInput('path')
        const cacheBase = getCacheBase(base)
        const cachePath = getCachePath(key, base)

        checkKey(key)
        checkPaths([path])

        core.saveState('key', key)
        core.saveState('path', path)
        core.saveState('cache-base', cacheBase)
        core.saveState('cache-path', cachePath)

        core.info(`Creating cache base`);
        fs.mkdirSync(cacheBase, { recursive: true });

        core.info(`Checking for a cache hit`);
        const cacheHit = fs.existsSync(cachePath);

        core.saveState('cache-hit', String(cacheHit))
        core.setOutput('cache-hit', String(cacheHit))

        if (cacheHit === true) {
            core.info(`Cache found for ${key}`)
            fs.mkdirSync(p.join("./", path), { recursive: true });
            fs.rmSync(p.join("./", path), { recursive: true });
            fs.symlinkSync(p.join(cachePath, path.split('/').slice(-1)[0]), p.join("./", path), 'dir');
            core.info(`Cache restored with key ${key}`)
        } else {
            core.info(`Cache not found for ${key}`)
        }
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
