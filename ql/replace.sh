#!/usr/bin/env bash

# 【使用方法】:
# 更新镜像后, 放到自定义脚本当中, 然后更新面板生效
# 建议: 生效后建议注释脚本, 若乙方爸爸更新幅度比较大可能无法启动
#

echo '开始下载龙猪猪仓库'
LONG_DIR=/tmp/longzhuzhu
rm -rf ${LONG_DIR} && mkdir -p ${LONG_DIR}
git clone -b main https://github.com/nianyuguai/longzhuzhu.git ${LONG_DIR}
echo '下载完成, 执行文件替换'
cp ${LONG_DIR}/ql/api/cookie.ts /ql/back/api
cp ${LONG_DIR}/ql/services/cookie.ts /ql/back/services
cp ${LONG_DIR}/ql/pages/index.tsx /ql/src/pages/cookie
echo '替换完成, 重启面板。。。'
rebuild >> ${QL_DIR}/log/rebuild.log 2>&1
echo '重启面板OK'

