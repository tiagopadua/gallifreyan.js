window.gallifreyan=window.gallifreyan||{};Math.TWOPI=2*Math.PI;Math.HALFPI=Math.PI/2;Math.THREEQUARTERSPI=Math.PI+Math.HALFPI;window.gallifreyan.draw_guidelines=false;window.gallifreyan.guideline_color="#000000";window.gallifreyan.Graphic=function(a){this.name="Graphic";this.canvas=typeof a!=="undefined"?a:null;this.line_color="#f0cc05";this.line_width=2;this.visible=true};window.gallifreyan.Graphic.prototype._draw=function(a){a.strokeStyle=this.line_color;a.lineWidth=this.line_width;a.lineCap="round"};window.gallifreyan.Graphic.prototype.draw=function(a){if(!this.visible){return}if(typeof a!=="undefined"){this.canvas=a}if((typeof this.canvas==="undefined")||(this.canvas===null)){return}context=this.canvas.getContext("2d");context.beginPath();this._draw(context);context.stroke()};window.gallifreyan.Point=function(a,c,b){this.name="Point";this.x=typeof a!=="undefined"?a:0;this.y=typeof c!=="undefined"?c:0;if(typeof b==="number"){this.line_width=b}};window.gallifreyan.Point.prototype=new gallifreyan.Graphic();window.gallifreyan.Point.prototype._pre_draw=window.gallifreyan.Point.prototype._draw;window.gallifreyan.Point.prototype._draw=function(b){this._pre_draw(b);var a=this.line_width/2.01;b.arc(this.x,this.y,a,0,Math.TWOPI)};window.gallifreyan.Point.prototype.moveXY=function(b,a){this.x+=b;this.y+=a;return this};window.gallifreyan.Point.prototype.move=function(b,a){this.moveXY(Math.cos(b)*a,Math.sin(b)*a);return this};window.gallifreyan.Point.prototype.isMouseOver=function(c,b){var a=Math.max(5,this.line_width);if((c<(this.x-a))||(c>(this.x+a))||(b<(this.y-a))||(b>(this.y+a))){return false}var f=c-this.x;var d=b-this.y;var e=Math.sqrt(f*f+d*d);return((e<=a)&&(e>=-a))};window.gallifreyan.Line=function(b,a,d,c){this.name="Line";this.begin=new window.gallifreyan.Point(b,a);this.end=new window.gallifreyan.Point(d,c)};window.gallifreyan.Line.prototype=new gallifreyan.Graphic();window.gallifreyan.Line.prototype._pre_draw=window.gallifreyan.Line.prototype._draw;window.gallifreyan.Line.prototype._draw=function(a){this._pre_draw(a);a.moveTo(this.begin.x,this.begin.y);a.lineTo(this.end.x,this.end.y)};window.gallifreyan.Line.prototype.boxContains=function(b){if(typeof b==="undefined"){return false}var c=0;var e=0;var a=0;var d=0;if(this.begin.x<this.end.x){c=this.begin.x;e=this.end.x}else{c=this.end.x;e=this.begin.x}if(this.begin.y<this.end.y){a=this.begin.y;d=this.end.y}else{a=this.end.y;d=this.begin.y}return((b.x>=c&&b.x<=e)&&(b.y>=a&&b.y<=d))};window.gallifreyan.Line.prototype.intersectPoints=function(f){var d=[];if(typeof f==="undefined"||f==null){return d}if(typeof f.name==="undefined"||f.name==null){return d}if(f.name=="Circle"){var a=[];var c=window.gallifreyan.util.isect_line_circle(this,f);for(var b in c){var e=c[b];if(this.boxContains(e)){a.push(e)}}return a}return d};window.gallifreyan.Line.prototype.perpendicularMove=function(b){if(this.begin.x==this.end.x){this.begin.y+=b}else{if(this.begin.y==this.end.y){this.begin.x+=b}else{var a=Math.atan2(this.end.y-this.begin.y,this.end.x-this.begin.x);this.begin.move(a+Math.HALFPI,b);this.end.move(a+Math.HALFPI,b)}}return this};window.gallifreyan.Line.prototype.isMouseOver=function(h,g){var f=Math.max(5,this.line_width/2);var m=Math.min(this.begin.x,this.end.x)-f;var j=Math.min(this.begin.y,this.end.y)-f;var c=Math.max(this.begin.x,this.end.x)+f;var p=Math.max(this.begin.y,this.end.y)+f;if((h<m)||(g<j)||(h>c)||(g>p)){return false}var q=this.end.x-this.begin.x;var o=this.end.y-this.begin.y;if(Math.abs(q)>0.001){var l=o/q;var i=this.begin.y-l*this.begin.x;var n=0;var k=0;var e=0;var d=0;if(l>0.001){n=Math.tan(Math.atan(l)+Math.HALFPI);k=g-(n*h);e=(k-i)/(l-n);d=l*e+i}else{n=l;k=h-(n*g);e=(n*i+k)/(1-l*n);d=l*e+i}return(window.gallifreyan.util.points_distance(h,g,e,d)<=f)}else{var l=q/o;var i=this.begin.x-l*this.begin.y;var n=0;var k=0;var e=0;var d=0;if(l>0.001){n=Math.tan(Math.atan(l)+Math.HALFPI);k=h-(n*g);d=(k-i)/(l-n);e=l*d+i}else{n=l;k=g-(n*h);d=(n*i+k)/(1-l*n);e=l*d+i}return(window.gallifreyan.util.points_distance(h,g,e,d)<=f)}return false};window.gallifreyan.Circle=function(a,c,b){this.name="Circle";this.center=new window.gallifreyan.Point(a,c);this.radius=typeof b!=="undefined"?b:1};window.gallifreyan.Circle.prototype=new gallifreyan.Graphic();window.gallifreyan.Circle.prototype._pre_draw=window.gallifreyan.Circle.prototype._draw;window.gallifreyan.Circle.prototype._draw=function(a){this._pre_draw(a);a.arc(this.center.x,this.center.y,this.radius,0,Math.TWOPI)};window.gallifreyan.Circle.prototype.intersectPoints=function(b){var a=[];if(typeof b==="undefined"||b==null){return a}if(typeof b.name==="undefined"||b.name==null){return a}if(b.name=="Circle"){return window.gallifreyan.util.isect_circle_circle(this,b)}else{if(b.name=="Line"){return window.gallifreyan.util.isect_line_circle(b,this)}}return a};window.gallifreyan.Circle.prototype.isMouseOver=function(c,a){var f=c-this.center.x;var d=a-this.center.y;var e=Math.sqrt(f*f+d*d);var b=Math.max(5,this.line_width/2);return((e<=(this.radius+b))&&(e>=(this.radius-b)))};window.gallifreyan.Arc=function(a,e,d,c,b){this.name="Arc";this.circle=new window.gallifreyan.Circle(a,e,d);this.begin_angle=typeof c!=="undefined"?c:0;this.end_angle=typeof b!=="undefined"?b:Math.TWOPI};window.gallifreyan.Arc.prototype=new gallifreyan.Graphic();window.gallifreyan.Arc.prototype._pre_draw=window.gallifreyan.Arc.prototype._draw;window.gallifreyan.Arc.prototype._draw=function(a){this._pre_draw(a);a.arc(this.circle.center.x,this.circle.center.y,this.circle.radius,this.begin_angle,this.end_angle)};window.gallifreyan.Arc.prototype.intersectPoints=function(d){var c=null;var a=null;var b=[];if(typeof d==="undefined"){return b}if(typeof d.name==="undefined"){return b}if(d.name=="Line"){isect_points=window.gallifreyan.util.isect_line_circle(d,this.circle);result=[];for(c in isect_points){a=isect_points[c];if(this.containsPoint(a)&&d.boxContains(a)){result.push(a)}}return result}else{if(d.name=="Circle"){isect_points=window.gallifreyan.util.isect_circle_circle(this.circle,d);result=[];for(c in isect_points){a=isect_points[c];if(this.containsPoint(a)){result.push(a)}}return result}else{if(d.name=="Arc"){isect_points=window.gallifreyan.util.isect_circle_circle(this.circle,d.circle);result=[];for(c in isect_points){a=isect_points[c];if(this.containsPoint(a)&&d.containsPoint(a)){result.push(a)}}return result}}}return b};window.gallifreyan.Arc.prototype.containsPoint=function(a){if(typeof a==="undefined"){return false}angle=Math.atan2(a.y-this.circle.center.y,a.x-this.circle.center.x);if((angle>=this.begin_angle)&&(angle<=this.end_angle)){return true}return false};window.gallifreyan.Arc.prototype.isMouseOver=function(b,a){if(!this.circle.isMouseOver(b,a)){return false}var c=Math.atan2(a-this.circle.center.y,b-this.circle.center.x);var e=this.begin_angle;var f=this.end_angle;while(e>f){e-=Math.TWOPI}if((f>Math.PI)&&(c<(f-Math.TWOPI))){c+=Math.TWOPI}if((e<-Math.PI)&&(c>(e+Math.TWOPI))){c-=Math.TWOPI}var d=(c>=e)&&(c<=f);return d};window.gallifreyan.Sentence=function(d,c,b,a){this.text=typeof d!=="undefined"?d:"";this.size=typeof a!=="undefined"?a:300;this.left=typeof c!=="undefined"?c:0;this.top=typeof b!=="undefined"?b:0;this.center_x=this.left+this.size/2;this.center_y=this.top+this.size/2;this.outside_circle=new window.gallifreyan.Circle(this.center_x,this.center_y,this.size/2);this.outside_circle.line_width*=1.4;this.inside_circle=new window.gallifreyan.Circle(this.center_x,this.center_y,this.size/2-6);this.words=[];this.setText(d)};window.gallifreyan.Sentence.prototype.draw=function(a){var e=a.getContext("2d");e.clearRect(0,0,a.width,a.height);var d=e.createLinearGradient(0,0,a.width,a.height);d.addColorStop(0,"#00345c");d.addColorStop(1,"#00112b");e.fillStyle=d;e.fillRect(0,0,a.width,a.height);var c=null;var b=null;var f=null;this.outside_circle.draw(a);this.inside_circle.draw(a);for(c in this.words){this.words[c].draw(a)}};window.gallifreyan.Sentence.prototype.setText=function(o){var d=null;var m=null;var j=null;this.words=[];this.text=this.preprocessText(o.trim());var a=this.inside_circle.radius*0.95;var c=this.text.split(" ");if(c&&c.length==1){j=new window.gallifreyan.Word(c[0],this.center_x,this.center_y,a*2,this.inside_circle);this.words.push(j)}else{var e=-Math.TWOPI/c.length;var k=Math.PI/2;var l=Math.abs(Math.sin(e/2));var p=a*l/(1+l);var n=a-p;for(d in c){m=c[d];var b=Math.sin(k);var g=Math.cos(k);var h=this.center_x+n*g;var f=this.center_y+n*b;j=new window.gallifreyan.Word(m,h,f,p*2,this.inside_circle);this.words.push(j);k+=e}}};window.gallifreyan.Sentence.prototype.preprocessText=function(g){var d=/[a-z ]/i;var f=/[ei]/i;var a="";for(var b=0;b<g.length;++b){var h=g[b];if(!d.test(h)){continue}if(h=="c"){if(g.length>(b+1)){var e=g[b+1];if(f.test(e)){a+="s"}else{a+="k"}}else{a+="k"}}else{if(h=="q"){if(g.length>(b+1)){var e=g[b+1];if(e=="u"){a+="q"}else{a+="k"}}else{a+="k"}}else{a+=h}}}return a};window.gallifreyan.Sentence.prototype.mouseOverObjects=function(c,a){var g=[];if(this.outside_circle.isMouseOver(c,a)){g.push(this.outside_circle)}if(this.inside_circle.isMouseOver(c,a)){g.push(this.inside_circle)}for(var f in this.words){var d=this.words[f].mouseOverObjects(c,a);for(var e in d){var b=d[e];g.push(b)}}return g};window.gallifreyan.Sentence.prototype.setLineColor=function(b){this.inside_circle.line_color=b;this.outside_circle.line_color=b;for(var a in this.words){this.words[a].setLineColor(b)}};window.gallifreyan.Word=function(e,c,b,d,a){this.max_diameter=typeof d!=="undefined"?d:250;this.radius=this.max_diameter/2;this.x=typeof c!=="undefined"?c:this.radius;this.y=typeof b!=="undefined"?b:this.radius;this.circle=new window.gallifreyan.Circle(this.x,this.y,this.radius);this.circle.line_color=window.gallifreyan.guideline_color;this.circle.line_width=1;this.sentence_circle=typeof a!=="undefined"?a:this.circle;this.arcs_circle=new window.gallifreyan.Circle(this.x,this.y,this.radius);this.arcs_circle.line_color=window.gallifreyan.guideline_color;this.arcs_circle.line_width=1;this.arcs=[new window.gallifreyan.Arc(this.x,this.y,this.radius,0,Math.TWOPI)];this.text="";this.chars=[];this.setText(e)};window.gallifreyan.Word.prototype.draw=function(a){var c=null;var b=null;for(c in this.arcs){b=this.arcs[c];b.draw(a)}for(c in this.chars){this.chars[c].draw(a)}if(window.gallifreyan.draw_guidelines){this.circle.draw(a);this.arcs_circle.draw(a)}};window.gallifreyan.Word.prototype.setText=function(b){this.text=b=b.trim().split(" ")[0];this.chars=[];var a=0;var d=null;while((b.length>0)&&(a!=b.length)){d=new window.gallifreyan.Char(b);this.chars.push(d);a=b.length;b=b.substr(d.main.length*d.main_count+d.secondary.length*d.secondary_count)}this.setDimensions()};window.gallifreyan.Word.prototype.setDimensions=function(){if(!this.chars||this.chars.length<=0){return}var a=20;if(this.chars.length>0){if(this.chars.length==1){this.arcs_circle.center.y=this.y-this.radius*0.15;this.arcs_circle.radius=this.radius*0.7;a=this.max_diameter}else{this.arcs_circle.center.y=this.y;var b=(Math.TWOPI/this.chars.length)/2;var d=Math.sin(b);a=2*this.arcs_circle.radius*Math.sin(b);var c=this.positionChars(a,true);this.arcs_circle.radius=c.radius;this.arcs_circle.center.x=c.center.x;this.arcs_circle.center.y=c.center.y;a=2*this.arcs_circle.radius*Math.sin(b);if(this.chars.length==2){a*=0.93}}this.positionChars(a)}};window.gallifreyan.Word.prototype.positionChars=function(f,e){e=typeof e!=="boolean"?false:e;var y=null;var x=null;var r=Math.PI/2;var E=-Math.TWOPI/this.chars.length;var q=[];var B=true;var v=true;var l=null;var k=new window.gallifreyan.Point(this.arcs_circle.center.x,this.arcs_circle.center.y);for(y in this.chars){var C=this.chars[y];C.sentence_circle=this.sentence_circle;C.up_angle=r+Math.PI;C.up_vector=new window.gallifreyan.Point(Math.cos(C.up_angle),Math.sin(C.up_angle));C.word_circle=this.arcs_circle;C.x=this.arcs_circle.center.x+this.arcs_circle.radius*Math.cos(r);C.y=this.arcs_circle.center.y+this.arcs_circle.radius*Math.sin(r);C.setMaxDiameter(f);var s=C.word_intersect_points;if(s.length==2){var d=s[0];var b=s[1];var F=Math.atan2(d.y-this.arcs_circle.center.y,d.x-this.arcs_circle.center.x);var D=Math.atan2(b.y-this.arcs_circle.center.y,b.x-this.arcs_circle.center.x);var a=false;if((F>Math.HALFPI&&D<Math.HALFPI)||(D>Math.HALFPI&&F<Math.HALFPI)){a=true}F=window.gallifreyan.util.normalize_angle(F,-Math.THREEQUARTERSPI);D=window.gallifreyan.util.normalize_angle(D,-Math.THREEQUARTERSPI);if((D>F)||(B&&(F>-Math.PI)&&(D<-Math.PI))){var m=F;F=D;D=m}if(B){B=false;if(!a){l=F-Math.TWOPI;q.push(D)}else{l=D;q.push(F)}}else{q.push(F);q.push(D)}}if(e){k.x+=C.max_used_word_radius*Math.cos(C.up_angle)/this.chars.length;k.y+=C.max_used_word_radius*Math.sin(C.up_angle)/this.chars.length}r+=E}if(l){q.push(l)}if(q.length>0){this.arcs=[];for(y=0;y<q.length-1;y+=2){this.addArc(q[y+1],q[y])}}else{this.arcs=[new window.gallifreyan.Arc(this.arcs_circle.center.x,this.arcs_circle.center.y,this.arcs_circle.radius,0,Math.TWOPI)]}var A=this.arcs_circle;if(e){var t=this.radius;for(y in this.chars){C=this.chars[y];var h=k.x-C.up_vector.x*this.max_diameter;var g=k.y-C.up_vector.y*this.max_diameter;var w=new window.gallifreyan.Line(k.x,k.y,h,g);var s=w.intersectPoints(this.circle);if(s.length>0){var u=s[0];var o=u.x-k.x;var n=u.y-k.y;var z=Math.sqrt(o*o+n*n)*0.94;z-=C.max_used_word_radius-this.arcs_circle.radius;t=Math.min(t,z)}}A=new window.gallifreyan.Circle(k.x,k.y,t)}return A};window.gallifreyan.Word.prototype.shareCharModLines=function(){var d=0;var a=0;var b=null;for(d in this.chars){var e=this.chars[d];if(e.mod_lines&&e.mod_lines.length<=0){continue}if(b){e.shareModifierLine(b.mod_lines);b=null;continue}b=e}};window.gallifreyan.Word.prototype.addArc=function(a,b){this.arcs.push(new window.gallifreyan.Arc(this.arcs_circle.center.x,this.arcs_circle.center.y,this.arcs_circle.radius,a,b))};window.gallifreyan.Word.prototype.mouseOverObjects=function(b,a){var g=[];for(var f in this.arcs){var e=this.arcs[f];if(e.isMouseOver(b,a)){g.push(e)}}for(var f in this.chars){var d=this.chars[f].mouseOverObjects(b,a);if(d.length>0){for(var c in d){g.push(d[c])}}}return g};window.gallifreyan.Word.prototype.setLineColor=function(b){for(var a in this.arcs){this.arcs[a].line_color=b}for(var a in this.chars){this.chars[a].setLineColor(b)}};window.gallifreyan.Char=function(f,c,b,e,d,g,a){this.draw_objects=[];this.max_circle=null;this.owner_intersect_object=null;this.x=typeof c!=="undefined"?c:this.radius;this.y=typeof b!=="undefined"?b:this.radius;this.up_angle=-Math.HALFPI;this.up_vector=typeof d!=="undefined"?d:new window.gallifreyan.Point(0,-1);this.word_circle=typeof g!=="undefined"?g:new window.gallifreyan.Circle(0,0,1);this.sentence_circle=typeof a!=="undefined"?a:this.word_circle;this.word_intersect_points=[];this.main="";this.main_count=0;this.secondary="";this.secondary_count=0;this.text="";this.getFirstChar(f);this.max_used_word_radius=this.word_circle.radius+this.radius;this.setMaxDiameter(e);this.dots=[];this.main_mod=null;this.secondary_mod=null;this.mod_lines=[];this.mod_line_secondary=null};window.gallifreyan.Char.prototype.setX=function(a){this.x=typeof a!=="undefined"?a:this.radius;this.loadObjects()};window.gallifreyan.Char.prototype.setY=function(a){this.y=typeof a!=="undefined"?a:this.radius;this.loadObjects()};window.gallifreyan.Char.prototype.setMaxDiameter=function(a){this.max_diameter=typeof a!=="undefined"?a:50;this.radius=this.max_diameter/2;this.consonant_radius=this.radius*0.45;this.vowel_radius=this.consonant_radius*0.3;if(!this.max_circle){this.max_circle=new window.gallifreyan.Circle()}this.max_circle.center.x=this.x;this.max_circle.center.y=this.y;this.max_circle.radius=this.max_diameter/2;this.max_circle.line_color=window.gallifreyan.guideline_color;this.max_circle.line_width=1;this.loadObjects()};window.gallifreyan.Char.prototype.draw=function(a){var b=null;for(b in this.draw_objects){this.draw_objects[b].draw(a)}if(window.gallifreyan.draw_guidelines&&this.max_circle){this.max_circle.draw(a)}};window.gallifreyan.Char.prototype.loadObjects=function(){this.draw_objects=[];if(!this.main||this.main.length<=0||this.main_count<=0){return}if(/^([bdfgh]|ch)$/i.test(this.main)){var a=null;if(this.main=="ch"){a="2dots"}else{if(this.main=="d"){a="3dots"}else{if(this.main=="f"){a="3lines"}else{if(this.main=="g"){a="1line"}else{if(this.main=="h"){a="2lines"}}}}}this.loadB(a)}else{if(/^[jklmnp]$/i.test(this.main)){var a=null;if(this.main=="k"){a="2dots"}else{if(this.main=="l"){a="3dots"}else{if(this.main=="m"){a="3lines"}else{if(this.main=="n"){a="1line"}else{if(this.main=="p"){a="2lines"}}}}}this.loadJ(a)}else{if(/^([trsvw]|sh)$/i.test(this.main)){var a=null;if(this.main=="sh"){a="2dots"}else{if(this.main=="r"){a="3dots"}else{if(this.main=="s"){a="3lines"}else{if(this.main=="v"){a="1line"}else{if(this.main=="w"){a="2lines"}}}}}this.loadT(a)}else{if(/^([yzx]|th|ng|qu)$/i.test(this.main)){var a=null;if(this.main=="y"){a="2dots"}else{if(this.main=="z"){a="3dots"}else{if(this.main=="ng"){a="3lines"}else{if(this.main=="qu"){a="1line"}else{if(this.main=="x"){a="2lines"}}}}}this.loadTH(a)}else{if(/^a$/i.test(this.main)){this.loadA(this.word_circle)}else{if(/^e$/i.test(this.main)){this.loadE(this.word_circle)}else{if(/^i$/i.test(this.main)){this.loadI(this.word_circle)}else{if(/^o$/i.test(this.main)){this.loadO(this.word_circle)}else{if(/^u$/i.test(this.main)){this.loadU(this.word_circle)}else{this.loadOther()}}}}}}}}}};window.gallifreyan.Char.prototype.loadModifier=function(e,c,h,d){var b=1;var o=this.consonant_radius*0.07;var g=this.consonant_radius*0.1;var i=c.radius/Math.PI;this.dots=[];this.mod_lines=[];switch(e){case"3dots":var a=(this.up_angle*i-g)/i;var k=new window.gallifreyan.Point(c.center.x+Math.cos(a)*(c.radius-g*1.8),c.center.y+Math.sin(a)*(c.radius-g*1.8),o);this.dots.push(k);this.draw_objects.push(k);var n=new window.gallifreyan.Point(c.center.x+this.up_vector.x*(c.radius-g*1.8),c.center.y+this.up_vector.y*(c.radius-g*1.8),g);this.dots.push(n);this.draw_objects.push(n);var f=(this.up_angle*i+g)/i;var l=new window.gallifreyan.Point(c.center.x+Math.cos(f)*(c.radius-g*1.8),c.center.y+Math.sin(f)*(c.radius-g*1.8),o);this.dots.push(l);this.draw_objects.push(l);break;case"2dots":var m=(this.up_angle*i-o/1.8)/i;var n=new window.gallifreyan.Point(c.center.x+Math.cos(m)*(c.radius-g*1.5),c.center.y+Math.sin(m)*(c.radius-g*1.5),o);this.draw_objects.push(n);var f=(this.up_angle*i+o/1.8)/i;var l=new window.gallifreyan.Point(c.center.x+Math.cos(f)*(c.radius-g*1.5),c.center.y+Math.sin(f)*(c.radius-g*1.5),o);this.draw_objects.push(l);break;case"2lines":var j=window.gallifreyan.util.randomize_angles(2,h,d);this.loadModifierLine(c,j[0]);this.loadModifierLine(c,j[1]);break;case"3lines":var j=window.gallifreyan.util.randomize_angles(3,h,d);this.loadModifierLine(c,j[0]);this.loadModifierLine(c,j[1]);this.loadModifierLine(c,j[2]);break;case"1line":var j=window.gallifreyan.util.randomize_angles(1,h,d);this.loadModifierLine(c,j[0]);break}};window.gallifreyan.Char.prototype.loadModifierLine=function(d,e,b){if(typeof(b)==="undefined"){b=false}var a=new window.gallifreyan.Line(d.center.x+Math.cos(e)*(d.radius+d.line_width/2),d.center.y+Math.sin(e)*(d.radius+d.line_width/2),d.center.x+Math.cos(e)*this.sentence_circle.radius*2,d.center.y+Math.sin(e)*this.sentence_circle.radius*2);var c=a.intersectPoints(this.sentence_circle);if(c.length>0){a.end=c[0]}a.holder_circle=d;if(b){this.mod_line_secondary=a}else{this.mod_lines.push(a)}this.draw_objects.push(a)};window.gallifreyan.Char.prototype.shareModifierLine=function(l){if(this.mod_lines&&this.mod_lines.length<=0){return}var d=0;var f=0;var e=this.mod_lines.length-1;for(f in l){var a=l[f];if(!a||(e<0)){continue}this_line=this.mod_lines[e];var b=new window.gallifreyan.Line(this_line.holder_circle.center.x,this_line.holder_circle.center.y,a.holder_circle.center.x,a.holder_circle.center.y);var k=Math.min(this_line.holder_circle.radius,a.holder_circle.radius)*0.7;var c=(e/(this.mod_lines.length-1))*k-(k/2);b.perpendicularMove(c);var h=b.intersectPoints(this_line.holder_circle);if(h.length<=0){return}var g=b.intersectPoints(a.holder_circle);if(g.length<=0){return}this_line.begin.x=h[0].x;this_line.begin.y=h[0].y;this_line.end.x=g[0].x;this_line.end.y=g[0].y;a.visible=false;--e}};window.gallifreyan.Char.prototype.loadArc=function(e,c,d){var i=0;var g=Math.TWOPI;var h=d?false:true;var b=c.intersectPoints(this.word_circle);if(b.length==2){var f=Math.atan2(b[0].y-c.center.y,b[0].x-c.center.x);var l=Math.atan2(b[1].y-c.center.y,b[1].x-c.center.x);i=f;g=l;if(h){this.word_intersect_points=[b[0],b[1]]}}else{if(h){this.word_intersect_points=[]}}var k=new window.gallifreyan.Arc();k.circle=c;k.begin_angle=i;k.end_angle=g;this.draw_objects.push(k);while(g<i){g+=Math.TWOPI}var j=Math.min(Math.PI/4,(g-i)/2.5);this.loadModifier(e,c,this.up_angle-j,this.up_angle+j)};window.gallifreyan.Char.prototype.loadB=function(a){var f=this.consonant_radius*0.9;var g=new window.gallifreyan.Circle(this.x+f*this.up_vector.x,this.y+f*this.up_vector.y,this.consonant_radius);this.owner_intersect_object=g;this.loadArc(a,g);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var e=g.radius;for(var d=1;d<this.main_count;++d){e+=g.line_width*2;var b=new window.gallifreyan.Circle(g.center.x,g.center.y,e);this.loadArc(null,b,true)}}this.loadSecondaryVowel(g,true)};window.gallifreyan.Char.prototype.loadJ=function(a){var g=this.radius*0.55;var h=new window.gallifreyan.Circle(this.x+g*this.up_vector.x,this.y+g*this.up_vector.y,this.consonant_radius);this.owner_intersect_object=h;this.draw_objects.push(h);var f=Math.PI/4;this.loadModifier(a,h,this.up_angle-f,this.up_angle+f);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var e=h.radius;for(var d=1;d<this.main_count;++d){e+=h.line_width*2;var b=new window.gallifreyan.Circle(h.center.x,h.center.y,e);this.draw_objects.push(b)}}this.loadSecondaryVowel(h)};window.gallifreyan.Char.prototype.loadT=function(a){var f=-this.consonant_radius*2.3;var g=new window.gallifreyan.Circle(this.x+f*this.up_vector.x,this.y+f*this.up_vector.y,this.consonant_radius*3.2);this.loadArc(a,g);this.max_used_word_radius=this.word_circle.radius;if(this.main_count>1){var e=g.radius;for(var d=1;d<this.main_count;++d){e+=g.line_width*2;var b=new window.gallifreyan.Circle(g.center.x,g.center.y,e);this.loadArc(null,b,true)}}this.loadSecondaryVowel(g)};window.gallifreyan.Char.prototype.loadTH=function(a){var d=new window.gallifreyan.Circle(this.x,this.y,this.consonant_radius);this.draw_objects.push(d);var b=Math.PI/3;this.loadModifier(a,d,this.up_angle-b,this.up_angle+b);this.max_used_word_radius=this.word_circle.radius+this.consonant_radius;this.loadSecondaryVowel(d)};window.gallifreyan.Char.prototype.repeatVowel=function(c,b){function a(j,f,h){if(f>1){var g=j.radius;for(var e=1;e<f;++e){g-=j.line_width*2;if(g>0){var d=new window.gallifreyan.Circle(j.center.x,j.center.y,g);h.push(d)}}}}if(b){a(c,this.secondary_count,this.draw_objects)}else{a(c,this.main_count,this.draw_objects)}};window.gallifreyan.Char.prototype.loadA=function(d,b){b=typeof b==="boolean"?b:false;var a=1.6;var e=new window.gallifreyan.Circle(this.x-this.up_vector.x*this.vowel_radius*a,this.y-this.up_vector.y*this.vowel_radius*a,this.vowel_radius);if(!(b&&/^([yzx]|th|ng|qu)$/i.test(this.main))){this.max_used_word_radius=this.word_circle.radius+this.vowel_radius*a}this.draw_objects.push(e);this.repeatVowel(e,b);return e};window.gallifreyan.Char.prototype.loadE=function(e,d){d=typeof d==="boolean"?d:false;var b=this.x;var a=this.y;if(d){if(/^([trsvw]|sh)$/i.test(this.main)){b=this.x+this.up_vector.x*this.vowel_radius;a=this.y+this.up_vector.y*this.vowel_radius}else{b=e.center.x;a=e.center.y}}var f=new window.gallifreyan.Circle(b,a,this.vowel_radius);if(!d){this.max_used_word_radius=this.word_circle.radius+this.vowel_radius}this.draw_objects.push(f);this.repeatVowel(f,d);return f};window.gallifreyan.Char.prototype.loadI=function(d,a){a=typeof a==="boolean"?a:false;var f=this.loadE(d,a);this.dots=[];this.mod_lines=[];var b=Math.PI/12;var e=window.gallifreyan.util.randomize_angles(1,this.up_angle-b,this.up_angle+b);this.loadModifierLine(f,e[0],true)};window.gallifreyan.Char.prototype.loadO=function(f,e){e=typeof e==="boolean"?e:false;var b=1.5;var d=0;var a=0;if(e){d=f.center.x+this.up_vector.x*f.radius;a=f.center.y+this.up_vector.y*f.radius}else{d=this.x+this.up_vector.x*this.vowel_radius*b;a=this.y+this.up_vector.y*this.vowel_radius*b}var g=new window.gallifreyan.Circle(d,a,this.vowel_radius);if(!(e&&/^([yzx]|th|ng|qu)$/i.test(this.main))){this.max_used_word_radius=this.word_circle.radius}this.draw_objects.push(g);this.repeatVowel(g,e);return g};window.gallifreyan.Char.prototype.loadU=function(d,a){var f=this.loadE(d,a);this.dots=[];this.mod_lines=[];var b=Math.PI/12;var e=window.gallifreyan.util.randomize_angles(1,this.up_angle+Math.PI-b,this.up_angle+Math.PI+b);this.loadModifierLine(f,e[0],true)};window.gallifreyan.Char.prototype.loadSecondaryVowel=function(a){if(/^a$/i.test(this.secondary)){this.loadA(this.word_circle,true)}else{if(/^e$/i.test(this.secondary)){this.loadE(a,true)}else{if(/^i$/i.test(this.secondary)){this.loadI(a,true)}else{if(/^o$/i.test(this.secondary)){this.loadO(a,true)}else{if(/^u$/i.test(this.secondary)){this.loadU(a,true)}}}}}};window.gallifreyan.Char.prototype.loadOther=function(){var a=new window.gallifreyan.Point(this.x,this.y);a.line_color="#ff0000";a.line_width=8;this.draw_objects.push(a)};window.gallifreyan.Char.prototype.getFirstChar=function(f){this.main="";this.main_count=0;this.secondary="";this.secondary_count=0;if(f==null||f.length<=0){return}var i=/^[aeiou]/i;var a=/^[bcdfghjklmnprstvwxyz]/i;var h=/^(th|ch|sh|ng|qu)/i;var g=f[0];if(i.test(g)){this.main=g;this.main_count=this.countCharRepeat(f)}else{var e=f.substr(0,2);if(h.test(e)){this.main=e;this.main_count=1}else{this.main=g;this.main_count=this.countCharRepeat(f)}var b=this.main.length*this.main_count;if(f.length>b){g=f[b];if(i.test(g)){this.secondary=g;this.secondary_count=this.countCharRepeat(f,b)}}}};window.gallifreyan.Char.prototype.countCharRepeat=function(e,a){a=typeof a!=="undefined"?a:0;var b=0;var d=0;var f=null;if(a>=e.length){return 0}for(b=a;b<e.length;b++){if(b==a){f=e[b];d=1}else{if(f==e[b]){d+=1}else{break}}}return d};window.gallifreyan.Char.prototype.mouseOverObjects=function(b,a){var d=[];for(var c in this.draw_objects){var e=this.draw_objects[c];if(e.isMouseOver(b,a)){d.push(e)}}for(var c in this.mod_lines){var e=this.mod_lines[c];if(e.isMouseOver(b,a)){d.push(e)}}if(this.mod_line_secondary){if(this.mod_line_secondary.isMouseOver(b,a)){d.push(this.mod_line_secondary)}}return d};window.gallifreyan.Char.prototype.setLineColor=function(b){for(var a in this.draw_objects){this.draw_objects[a].line_color=b}for(var a in this.mod_lines){this.mod_lines[a].line_color=b}if(this.mod_line_secondary){this.mod_line_secondary.line_color=b}};window.gallifreyan.util={};window.gallifreyan.util.bhaskara=function(a,d,b){if(a!=0){var c=d*d-4*a*b;if(c<0){return[]}sqrt_delta=Math.sqrt(c);r1=(-d+sqrt_delta)/(2*a);r2=(-d-sqrt_delta)/(2*a);return[r1,r2]}else{if(d!=0){return[-b/d]}}return[]};window.gallifreyan.util.normalize_angle=function(b,a){while(b<a){b+=Math.TWOPI}end_angle=a+Math.TWOPI;while(b>end_angle){b-=Math.TWOPI}return b};window.gallifreyan.util.points_distance=function(d,f,c,e){var b=c-d;var a=e-f;return Math.sqrt(b*b+a*a)};window.gallifreyan.util.randomize_angles=function(h,e,b){var k=[];if(typeof(h)==="undefined"||h<=0){return k}var e=typeof(e)==="undefined"?0:e;var b=typeof(b)==="undefined"?Math.TWOPI:b;if(e>b){e-=Math.TWOPI}var f=b-e;var d=0;var c=h*3;var j=[];var a=f/(c-1);for(d=e;d<=b;d+=a){j.push(d)}for(d=0;d<h;++d){var g=Math.floor(Math.random()*j.length);k.push(j[g]);j.splice(g,1)}return k};window.gallifreyan.util.isect_line_circle=function(q,d){default_result=[];var k=new window.gallifreyan.Point();var i=new window.gallifreyan.Point();var g=0;var e=0;var c=0;var h=d.center.y*d.center.y;var o=d.center.x*d.center.x;var f=d.radius*d.radius;if(Math.abs(q.begin.x-q.end.x)<0.000001){var m=q.begin.x;g=1;e=-2*d.center.y;c=m*m-2*m*d.center.x+o+h-f;var n=window.gallifreyan.util.bhaskara(g,e,c);if(n.length!=2){return default_result}k.x=m;k.y=n[0];i.x=m;i.y=n[1]}else{var l=(q.end.y-q.begin.y)/(q.end.x-q.begin.x);var j=q.begin.y-(l*q.begin.x);g=l*l+1;e=2*(l*j-l*d.center.y-d.center.x);c=(o+h-f-(2*j*d.center.y)+j*j);var p=window.gallifreyan.util.bhaskara(g,e,c);if(p.length!=2){return default_result}k.x=p[0];k.y=l*k.x+j;i.x=p[1];i.y=l*i.x+j}return[k,i]};window.gallifreyan.util.isect_circle_circle=function(f,e){default_result=[];if(!f||!e){return default_result}var m=f.center.x-e.center.x;var k=f.center.y-e.center.y;var o=Math.sqrt(m*m+k*k);if((o<0.000001)||(o>(f.radius+e.radius))||(o<Math.abs(f.radius-e.radius))){return default_result}var s=f.radius*f.radius;var j=e.radius*e.radius;var q=(s-j+o*o)/(o+o);var g=Math.sqrt(s-q*q);var r=new window.gallifreyan.Point();var l=new window.gallifreyan.Point();var i=new window.gallifreyan.Point();var p=q/o;var c=e.center.x-f.center.x;var n=e.center.y-f.center.y;r.x=f.center.x+(p*c);r.y=f.center.y+(p*n);var b=g/o;l.x=r.x+(b*n);i.x=r.x-(b*n);l.y=r.y-(b*c);i.y=r.y+(b*c);return[l,i]};