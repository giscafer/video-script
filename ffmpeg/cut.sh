#!/usr/bin/env bash

# https://ffmpeg.org/ffmpeg.html
# https://ottverse.com/change-resolution-resize-scale-video-using-ffmpeg/


movieName="$1"
moviePath="/Users/giscafer/Movies/movies"
ffmpegOutput="./ffmpegOutput"
startTime=0
endTime=0
# 电影总时长
length=7200
# 分割时长（10分钟）
interval=600
i=0
while [ $endTime -le $length ]; do
	#statements
	i=$[$i+1]
	endTime=$[$startTime+$interval]
	# ffmpeg -i $moviePath/$movieName -ss $startTime -to $endTime -acodec copy -vcodec copy $ffmpegOutput/$i.mp4 
	# 转换分辨率会慢些
	ffmpeg -i $moviePath/$movieName -vf scale=1280:720 -ss $startTime -to $endTime  $ffmpegOutput/$i.mp4 
	startTime=$[endTime]
done
