import * as core from '@actions/core'
import * as p from 'path'
import * as fs from 'fs'

async function run(): Promise<void> {
    try {
        const cacheHit = core.getState('cache-hit')
        const key = core.getState('key')

        if (cacheHit === 'false') {
            const cachePath = core.getState('cache-path')
            const path = core.getState('path')

            fs.mkdirSync(cachePath, { recursive: true })
            fs.renameSync(p.join("./", path), p.join(cachePath, path.split('/').slice(-1)[0]))

            core.info(`Cache saved with key ${key}`)
        } else {
            core.info(`Cache hit on the key ${key}`)
            core.info(`,not saving cache`)
        }

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()