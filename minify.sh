cat js/start.js js/graphic.js js/point.js js/line.js js/circle.js js/arc.js js/sentence.js js/word.js js/char.js js/util.js js/intersect.js > js/gallifreyan-full.js
java -jar util/yuicompressor-2.4.8.jar -v -o js/gallifreyan-min.js js/gallifreyan-full.js
