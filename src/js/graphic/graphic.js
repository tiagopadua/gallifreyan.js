/* global PUBLIC */

/*************************** BASE DRAWING OBJECT *****************************/

PUBLIC.Graphic = function(targetCanvas) {
    this.name = "Graphic";
    this.canvas = typeof targetCanvas !== 'undefined' ? targetCanvas : null;
    //this.line_color = "#ffffff";
    this.line_color = "#f0cc05";
    //this.line_color = "#87b8e7";
    this.line_width = 2;
    this.visible = true;
};

PUBLIC.Graphic.prototype._draw = function(ctx) {
    // Intended to be inherited/overwritten
    ctx.strokeStyle = this.line_color;
    ctx.lineWidth = this.line_width;
    ctx.lineCap = "round";
};

PUBLIC.Graphic.prototype.draw = function(canvas) {
    if (!this.visible) {
        return;
    }
    if (typeof canvas !== 'undefined') {
        this.canvas = canvas;
    }
    if ((typeof this.canvas === 'undefined') || (this.canvas === null)) {
        return;
    }
    var context = this.canvas.getContext("2d");
    //context.shadowBlur = 5;
    //context.shadowColor = "rgba(255,255,0,.4)";
    //context.shadowColor = "rgba(60,180,220,.4)";
    //context.shadowColor = "rgba(0,0,0,.5)";
    //context.shadowOffsetX = 4;
    //context.shadowOffsetY = 4;
    context.beginPath();
    this._draw(context);
    context.stroke();
};
