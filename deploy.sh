#!/bin/bash
npm run build
scp -r ./build/* root@120.78.177.9:/usr/local/nginx/board
