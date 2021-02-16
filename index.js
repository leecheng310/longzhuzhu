// 云函数入口文件
const fs = require('fs')

// 云函数入口函数
exports.main = async(event, context) => {
    console.log('comming trigger -> ', event.TriggerName)
    let trigger = event.TriggerName

    try {
        const jdCookieNode = require('./jdCookie.js')
        let cookiesArr = []
        Object.keys(jdCookieNode).forEach((item) => {
            cookiesArr.push(jdCookieNode[item])
        })
        
        await asyncPool(100, cookiesArr, cookie => new Promise(async(resolve) => {
            try {
                let js = fs.readFileSync(`${trigger}.js`, 'utf8')
                js = js.replace(/const jdCookieNode = .*/, `const jdCookieNode = ['${cookie}'];`);
                eval(js)
            } finally {
                resolve()
            }
        }))
    } catch (err) {
        console.log(err)
        // 可发送告警
        return {
            code: '001',
            msg: err
        }
    }

    return {
        code: '000',
        msg: 'ok'
    }
}

/**
 * 并发工具类
 *
 * @param poolLimit
 * @param array
 * @param iteratorFn
 * @returns {Promise.<*>}
 */
function asyncPool(poolLimit, array, iteratorFn) {
    let i = 0;
    const ret = [];
    const executing = [];
    const enqueue = function() {
        if (i === array.length) {
            return Promise.resolve();
        }
        const item = array[i++];
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p);

        let r = Promise.resolve();

        if (poolLimit <= array.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= poolLimit) {
                r = Promise.race(executing);
            }
        }

        return r.then(() => enqueue());
    };
    return enqueue().then(() => Promise.all(ret));
}
