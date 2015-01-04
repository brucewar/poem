filepath=$(cd "$(dirname "$0")"; pwd)
cd $filepath/Main_Server
NODE_ENV=production nohup forever main_server.js &
cd $filepath/Proxy_Server
NODE_ENV=production nohup forever proxy_server.js &