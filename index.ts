import { cache } from "./cache";

type UserInfo = {
    age: number,
    address: string
}

// test set
const userCache = new cache<UserInfo>(1, 1000 * 60 * 60);
userCache.set("John", {
    age: 20,
    address: "here"
});

console.log("plain set")
console.log(userCache.get("John")) // should output hit: false

// test get unexisted
const user = userCache.get("Brandon");
console.log("user")
console.log(user)
if (!user.hit) {
    // get user from DB & update cache
    const user = {
        age: 28,
        address: "there",
    };
    userCache.set("Brandon", user)
}

// test update when there's expired data
const userCache2 = new cache<UserInfo>(1, 1000);
userCache2.set("John", {
    age: 20,
    address: "here"
});

setTimeout(() => {
    console.log("test update while some data expired")
    console.log(userCache2.set("David", {
        age: 18,
        address: "here"
    })) // should output updated:true
}, 2000)

// test update when data size exceed size limit
const userCache3 = new cache<UserInfo>(1, 1000 * 60 * 60);
userCache3.set("John", {
    age: 20,
    address: "here"
});

console.log("test update when existed meet size limit")
console.log(userCache3.set("David", {
    age: 18,
    address: "here"
}))// should output updated:true

console.log(userCache3.get("John")) // should output hit: false