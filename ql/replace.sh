#!/usr/bin/env bash

env=$1
if [ ! $1 ]; then
  echo "请输入输入容器名词, 例如: qinglong"
  exit
fi

docker cp api/cookie.ts ${env}:/ql/back/api
docker cp services/cookie.ts ${env}:/ql/back/services
docker cp pages/index.tsx ${env}:/ql/src/pages/cookie
echo "替换文件成功, 重启面板ing"
docker exec -it ${env} rebuild
echo "重启面板OK"

