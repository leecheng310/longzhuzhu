const conetxt = require('./index.js')

!(async() => {
    let res = await conetxt.main({"TriggerName":"jd_crazy_joy_compose"
    },{})
    console.log(res)
})()