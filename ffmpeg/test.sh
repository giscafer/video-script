#!/usr/bin/env bash


movieName="$1"
moviePath="/Users/giscafer/Movies/movies"
ffmpegOutput="./ffmpegOutput1"
startTime=0
endTime=0
# 电影总时长
length=600
# 分割时长（10分钟）
interval=100
i=0
while [ $endTime -le $length ]; do
	#statements
	i=$[$i+1]
	endTime=$[$startTime+$interval]
	ffmpeg -i $moviePath/$movieName -ss $startTime -to $endTime -acodec copy -vcodec copy $ffmpegOutput/$i.mp4 
	startTime=$[endTime]
done
