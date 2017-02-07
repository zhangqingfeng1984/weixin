#!/bin/sh

nohup sudo node server.js &

PID=$!
echo $PID > pid.out
