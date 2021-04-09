#!/usr/bin/env bash


# 【使用方法】:
# 容器启动之后
# 1、在容器所在主机,创建目录
# mkdir -p /ql/replace
# 2、上传三个文件到主机目录/ql/replace
# 3、修改脚本权限
# cd /ql/replace
# chmod +x replace.sh
# 4、执行替换并重启面板
# ./replace.sh qinglong
#
# 后续维护: 每次容器启动后, 执行最后一个命令替换
#

env=$1
if [ ! $1 ]; then
  echo "请输入输入容器名词, 例如: qinglong"
  exit
fi


docker cp cookie.ts ${env}:/ql/back/services
docker cp index.tsx ${env}:/ql/src/pages/cookie
echo "替换文件成功, 重启面板ing"
docker exec -it ${env} rebuild
echo "重启面板OK"

