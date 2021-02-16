#### crazyJoy脚本说明

> 主要目的为了降低云函数的流量消耗, 参考脚本: https://gitee.com/lxk0301/jd_scripts/blob/master/jd_crazy_joy_coin.js

`关键点`

* 1、将挂机任务拆分为2个定时任务: 金币任务(jd_crazy_joy_collect.js)
和合成任务(jd_crazy_joy_compose.js)
* 2、多个账号通过promise.all并发+eval执行, 降低执行时间, 实现参见index.js

