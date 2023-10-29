type CachedData<T> = {
    value: T,
    hitCount: number,  // What does "consecutive cache hits" mean?
    expireTime: number,
}
// use Generic to create Cache instance for different data structures
interface ICache<T> {
    // cached data. If data is not being used inside expire time then delete
    cached: Record<string, CachedData<T>>
    // Cache size is limited to N entries. Replace the closest expired & not hitted one if exceed the limit 
    size: number,
    // milliseconds used to count the expire time of each cached data 
    timeUntilExpire: number,
    // input key of cache data return value if hit. 
    get: (key: string) => {
        hit: true,
        value: T
    } | {
        hit: false,
    },
    // input key and value, return is cache data created or updated;
    set: (key: string, value: T) => {
        created?: boolean,
        updated?: boolean
    }
}

export class cache<T> implements ICache<T> {
    cached: Record<string, CachedData<T>> = {}
    constructor(
        public size: number,
        public timeUntilExpire: number,
    ) { }
    get: (key: string) => { hit: false } | { hit: true; value: T } = (key) => {
        // return value if hit & not expired
        if (this.cached[key] && new Date().getTime() < this.cached[key].expireTime) {
            this.cached[key].hitCount++;
            return {
                hit: true,
                value: this.cached[key].value
            }
        }
        // didn't hit, return hit: false
        return { hit: false }
    }
    set: (key: string, value: T) => { created?: boolean; updated?: boolean } = (key, value) => {
        const expireTime = new Date().getTime() + this.timeUntilExpire;
        if (this.cached[key]) {
            this.#updateExisted(key, this.cached[key], key, value, expireTime)
            return {
                updated: true
            }
        }
        // if there's expired cache, reuse the object;
        const expired = this.#findExpired();
        if (expired) {
            this.#updateExisted(expired[0], expired[1], key, value, expireTime)
            return {
                created: true
            }
        }
        // if size get exceeded, reuse the "most unused & closest to expire one"
        if (Object.keys(this.cached).length >= this.size) {
            const dataToExpire = this.#findClosestToExpired();
            if (dataToExpire) {
                this.#updateExisted(dataToExpire[0], dataToExpire[1], key, value, expireTime)
                return {
                    created: true
                }
            }
        }
        this.cached[key] = {
            expireTime,
            value,
            hitCount: 0
        }
        return {
            created: true
        }
    }

    // find expired cached object that can be used for other data to prevent too much memory operation
    #findExpired = (): [string, CachedData<T>] | undefined => {
        let now = new Date().getTime();
        const cachedEntries = Object.entries(this.cached)
        if (cachedEntries.length === 0) return
        return cachedEntries.find(([_, value]) => now > value.expireTime);
    }
    // find expired cached object that can be used for other data to prevent too much memory operation
    #findClosestToExpired = (): [string, CachedData<T>] | undefined => {
        const cachedEntries = Object.entries(this.cached);
        if (cachedEntries.length === 0) return
        // the first is the oldest
        cachedEntries.sort((a, b) => a[1].expireTime - b[1].expireTime);
        // remove used
        const unused = cachedEntries.filter(([_, value]) => value.hitCount < 2);
        //  maybe all cached data are used, then just return oldest
        return unused[0] ?? cachedEntries[0]
    }
    #updateExisted = (existedKey: string, existedData: CachedData<T>, key: string, value: T, expireTime: number) => {
        existedData.expireTime = expireTime;
        existedData.value = value;
        // reset hitcount
        existedData.hitCount = 0;
        if (existedKey !== key) {
            this.cached[key] = existedData;
            delete this.cached[existedKey];
        }
    }
}
