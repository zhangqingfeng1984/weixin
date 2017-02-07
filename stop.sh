#!/bin/sh
pid=`cat pid.out`
sudo pkill -9 $pid
echo "process $pid is killed"
