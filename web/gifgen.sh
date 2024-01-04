#!/bin/bash

# startrange=1
# intervalsize=3333
# endrange=$(($startrange + $intervalsize))

# for (( i=$startrange; i<$endrange; i+=1 ))
# do
#     ffmpeg -y -i output/$i.mkv -vf "fps=10,scale=480:-1:flags=lanczos,eq=contrast=1.20" -c:v gif -f gif output/$i.gif
#     gifsicle -O3 output/$i.gif -o upload/$i.gif
# done

# zip -vrj upload.zip upload/ -x "*.DS_Store"

# Start of the loop
for i in {2..3333}
do
    cp 1.html "${i}.html"
done
