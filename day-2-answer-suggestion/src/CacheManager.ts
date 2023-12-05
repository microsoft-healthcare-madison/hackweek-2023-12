import { writeFileSync, readFileSync, existsSync } from "fs";
import crypto from "crypto";

export class CacheManager {
    private cache: Record<string, any>;
    private cacheFile: string;

    constructor(cacheFile: string) {
        this.cacheFile = cacheFile;
        if (existsSync(cacheFile)) {
            const data = readFileSync(cacheFile, "utf-8");
            this.cache = JSON.parse(data);
        } else {
            this.cache = {};
        }
    }

    get(key: string): any {
        const hashedKey = this.hashKey(key);
        return this.cache[hashedKey] || null;
    }

    set(key: string, value: any): void {
        const hashedKey = this.hashKey(key);
        this.cache[hashedKey] = value;
        this.saveCache();
    }

    private saveCache(): void {
        writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    }

    private hashKey(key: string): string {
        return crypto.createHash("sha256").update(key).digest("hex");
    }
}
