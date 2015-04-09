cat js/start.js js/graphic.js js/point.js js/line.js js/circle.js js/arc.js js/sentence.js js/word.js js/char.js js/intersect.js js/util.js js/end.js > /tmp/gallifreyan.js
java -jar ~/dev/yuicompressor-2.4.8.jar -v -o js/gallifreyan-min.js /tmp/gallifreyan.js
