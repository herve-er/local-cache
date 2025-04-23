"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const p = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cache_1 = require("../utils/cache");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /*
              clean up caches
            */
            const cacheBase = core.getState('cache-base');
            const cleanKey = core.getInput('clean-key');
            const CLEAN_TIME = 7;
            if (cleanKey) {
                const now = Date.now();
                const threshold = CLEAN_TIME * 24 * 60 * 60 * 1000; // days to ms
                const entries = fs.readdirSync(cacheBase, { withFileTypes: true });
                for (const entry of entries) {
                    if (!entry.isDirectory())
                        continue;
                    if (!entry.name.startsWith(cleanKey))
                        continue;
                    const dirPath = p.join(cacheBase, entry.name);
                    try {
                        const stats = fs.statSync(dirPath);
                        const atime = stats.atime.getTime();
                        if ((now - atime) > threshold) {
                            fs.rmSync(dirPath, { recursive: true, force: true });
                            console.log(`Deleted: ${dirPath}`);
                        }
                    }
                    catch (err) {
                        console.error(`Failed to handle ${dirPath}:`, err);
                    }
                }
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.warning(error.message);
        }
        try {
            const key = core.getInput('key');
            const base = core.getInput('base');
            const path = core.getInput('path');
            const cacheBase = (0, cache_1.getCacheBase)(base);
            const cachePath = (0, cache_1.getCachePath)(key, base);
            (0, cache_1.checkKey)(key);
            (0, cache_1.checkPaths)([path]);
            core.saveState('key', key);
            core.saveState('path', path);
            core.saveState('cache-base', cacheBase);
            core.saveState('cache-path', cachePath);
            fs.mkdirSync(cacheBase, { recursive: true });
            const cacheHit = fs.existsSync(cachePath);
            core.saveState('cache-hit', String(cacheHit));
            core.setOutput('cache-hit', String(cacheHit));
            if (cacheHit === true) {
                fs.symlinkSync(p.join(cachePath, path.split('/').slice(-1)[0]), p.join("./", path), 'dir');
                core.info(`Cache restored with key ${key}`);
            }
            else {
                core.info(`Cache not found for ${key}`);
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
