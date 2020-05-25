class Animation {
    constructor(params) {
        // sprite, frames, interval, delay, cb
        this.sprite = params.sprite;
        this.frames = params.frames;
        this.interval = params.interval;
        this.loop = params.loop ;

        this.delay = params.delay;
        this.cb = params.cb;
        this.curTime = 0;
        this.curIndex = -1;
        this.stop = false;
    }
    update(dt) {
        if (this.stop) return;
        this.curTime += dt;
        var n = Math.floor(this.curTime / this.interval);
        if (n != this.curIndex) {
            this.curIndex = n;
           
            if (this.curIndex >= this.frames.length) {
                if (this.cb && typeof (this.cb) == "function") {
                   
                    this.cb();
                    this.stop = true;
                    return;
                } else if (!this.loop) {
                    this.stop = true;
                    return;
                } else {
                    this.curTime = 0;
                    this.curIndex = 0;
                }
            }
            this.curIndex = this.curIndex % this.frames.length;
            this.sprite.spriteFrame = this.frames[this.curIndex];
        }
    }
    reset() {
        this.curTime = 0;
        this.curIndex = -1;
        this.stop = false;
    }
}

module.exports = Animation;