#!/usr/bin/env bash
movieName="$1"
moviePath="/Users/giscafer/Movies/movies"
startTime=0
endTime=0
length=3697
i=0
while [ $endTime -le $length ]; do
	#statements
	i=$[$i+1]
	endTime=$[$startTime+280]
	ffmpeg -i $moviePath/$movieName  -ss $startTime -to $endTime -acodec copy -vcodec copy ./ffmpegOutput/$i.mp4
	startTime=$[endTime]
	
	
done
