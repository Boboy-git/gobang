cc.Class({
    extends: cc.Component,
    properties: {
        gridsNode: cc.Node,
        layerStart: cc.Node,
        layerGameOver: cc.Node,
        resultLabel: cc.Label,
        stepLabel: cc.Label,
        timeLabel: cc.Label,
        newChessTip: cc.Node,
        preChess: cc.Prefab,
        chessList: [cc.Node],
        whiteSpriteFrame: cc.SpriteFrame,
        blackSpriteFrame: cc.SpriteFrame,
        // 当前最新的落子，根据这个落子去判断输赢
        touchChess: cc.Node,

        fiveGroup: [],
        fiveGroupScore: [],
        steps: 0,
        time: 0,

        stepOrderIndex: [],
        tipsLabel: cc.Label,
    },
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        bkb.scStageGameMatch = this;
        this.layerGameOver.active = false;
        this.newChessTip.active = false;
        this.steps = 0;
        this.time = 0;
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchstart, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchcancel, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchend, this);
        this.State = cc.Enum({
            ready: 0,
            game: 1,
            pause: 2,
            gameover: 3,
        });
        this.poolChess = new bkb.Pool(this.preChess);

        // 添加五元数组,就是棋盘中能横竖撇捺能成五的个数，总共572个，找出他们相对于棋盘二维数组的位置索引
        //横向
        for (var y = 0; y < 15; y++) {
            for (var x = 0; x < 11; x++) {
                this.fiveGroup.push([y * 15 + x, y * 15 + x + 1, y * 15 + x + 2, y * 15 + x + 3, y * 15 + x + 4]);
            }
        }
        //纵向
        for (var x = 0; x < 15; x++) {
            for (var y = 0; y < 11; y++) {
                this.fiveGroup.push([y * 15 + x, (y + 1) * 15 + x, (y + 2) * 15 + x, (y + 3) * 15 + x, (y + 4) * 15 + x]);
            }
        }
        //右上斜向
        for (var b = -10; b <= 10; b++) {
            for (var x = 0; x < 11; x++) {
                if (b + x < 0 || b + x > 10) {
                    continue;
                } else {
                    this.fiveGroup.push([(b + x) * 15 + x, (b + x + 1) * 15 + x + 1, (b + x + 2) * 15 + x + 2, (b + x + 3) * 15 + x + 3, (b + x + 4) * 15 + x + 4]);
                }
            }
        }
        //右下斜向
        for (var b = 4; b <= 24; b++) {
            for (var y = 0; y < 11; y++) {
                if (b - y < 4 || b - y > 14) {
                    continue;
                } else {
                    this.fiveGroup.push([y * 15 + b - y, (y + 1) * 15 + b - y - 1, (y + 2) * 15 + b - y - 2, (y + 3) * 15 + b - y - 3, (y + 4) * 15 + b - y - 4]);
                }
            }
        }
    },
    start() {
        this.restart();
    },
    bindBack(){
        this.clear();
        this.poolChess.clear();
        this.node.destroy();
        bkb.scLayerMenu.node.active = true;
    },
    initSocket() {
        this.socket = io.connect('https://www.bkbgame.com:5001');
        // this.socket = io.connect('https://www.bkbgame.com/wzq');
        this.socket.on('waiting', function (number) {
            console.log('waiting:' + number);
            this.waiting = true;
            this.mefirst = false;
            this.tipsLabel.string = '等待玩家进入';

        }.bind(this));
        this.socket.on('first', function () {
            this.tipsLabel.string = '游戏开始,请落子';
            console.log('first');
            this.state = this.State.game;
            this.waiting = false;
            this.mefirst = true;
            this.myturn = true;


        }.bind(this));
        this.socket.on('second', function (number) {
            this.tipsLabel.string = '游戏开始,等待对方落子';
            console.log('second:' + number);
            this.state = this.State.game;
            this.waiting = false;
            this.mefirst = false;
            this.myturn = false;

        }.bind(this));
        this.socket.on('go', function (i, j) {
            this.tipsLabel.string = '请落子';
            console.log('对方落子' + i + ' ' + j);
            this.onStep(i, j);
            this.myturn = true;
        }.bind(this));
        this.socket.on('fail', function () {
            console.log('fail');
            this.state = this.State.gameover;
            this.resultLabel.string = "你输了";
            bkb.scAudioMgr.playLose();
            this.stepLabel.string = "走了".concat(this.steps).concat("步");
            bkb.scAudioMgr.pauseBgmMusic();
            this.layerGameOver.active = true;
        }.bind(this));
        this.socket.on('giveup', function () {
            console.log('giveup');
            this.state = this.State.gameover;
            this.resultLabel.string = "对方认输,你赢了";
            bkb.scAudioMgr.playWin();
            this.stepLabel.string = "走了".concat(this.steps).concat("步");
            bkb.scAudioMgr.pauseBgmMusic();
            this.layerGameOver.active = true;

        }.bind(this));
        this.socket.on('leave', function () {
            console.log('leave');
            if (this.state != this.State.gameover) {
                this.state = this.State.gameover;
                this.resultLabel.string = "对方已离开";
                // bkb.scAudioMgr.playWin();
                this.stepLabel.string = "走了".concat(this.steps).concat("步");
                bkb.scAudioMgr.pauseBgmMusic();
                this.layerGameOver.active = true;
            }
            // showDialog('对方离开，是否重新匹配？', function () {
            //     reset();
            //     personPlay();
            // });
        }.bind(this));
    },
    bindShare() {
        if (bkb.wxgame)
            wx.shareAppMessage({
                title: '一起来玩五子棋吧~',
                imageUrl: "utils/share.png",
                query: 'pk=true',
            })
    },
    onStep(i, j) {
        //对方落子
        var newChess = this.poolChess.pop();
        this.gridsNode.addChild(newChess);
        newChess.setPosition(this.getPos(i, j));
        newChess.getComponent(cc.Sprite).spriteFrame = this.mefirst ? this.whiteSpriteFrame : this.blackSpriteFrame;
        //1是黑的 2是白的
        newChess.frame = this.mefirst ? 2 : 1;
        this.chessList[j * 15 + i] = newChess;
        newChess.tag2 = j * 15 + i;
        this.stepOrderIndex.push(j * 15 + i);
    },
    // 落子
    emitGo(i, j, isFail) {
        this.socket.emit('go', i, j, isFail);
        // textContainer.innerText = '等待对方落子';
    },
    emitGiveup() {
        // 
        this.socket.emit('giveup');
        // textContainer.innerText = '等待对方落子';
    },

    restart() {
        this.clear();
        this.state = this.State.ready;
        this.mefirst = false;
        this.myturn = false;
        this.steps = 0;
        this.fiveGroupScore = [];
        this.stepOrderIndex = [];
        this.time = 0;
        this.timeLabel.string = "时间：".concat(parseInt(this.time)).concat("秒");
        bkb.scAudioMgr.playBgmMusic();
        this.timeLabel.node.active = true;
        if (this.socket)
            this.socket.disconnect();
        this.initSocket();
    },
    bindRetry() {
        this.layerGameOver.active = false;
        this.restart();
    },
    bindHome() {
        this.clear();
        this.poolChess.clear();
        this.node.destroy();
        bkb.scLayerMenu.node.active = true;
    },
    getPos(x, y) {
        return cc.v2(x * 40 - 280, y * 40 - 280);
    },
    checkGrid(p) {
        var x = parseInt((p.x + 280 + 20) / 40);
        var y = parseInt((p.y + 280 + 20) / 40);
        if (x >= 0 && x <= 14 && y >= 0 && y <= 14) {
            return cc.v2(x, y);
        } else return null;

    },
    clear() {
        if (this.chessList && this.chessList.length > 0) {
            for (m = 0; m < this.chessList.length; m++) {
                if (this.chessList[m])
                    this.poolChess.push(this.chessList[m]);

            }
        }
        this.chessList = [];
        for (var m = 0; m < 15 * 15; m++) {
            this.chessList[m] = null;

        }
    },
    onDestroy() {

        bkb.scStageGameMatch = null;
        if (this.socket)
        this.socket.disconnect();
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchstart, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchcancel, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchend, this);
    },
    touchstart(event) {
        if (this.state != this.State.game) return;
        // this.vStart = this.node.convertToNodeSpaceAR(event.getLocation());
        this.canMove = true;
    },
    touchcancel(event) {
        if (this.state != this.State.game) return;
        this.canMove = false;
    },
    touchend(event) {
        if (this.state != this.State.game || !this.canMove || !this.myturn) return;
        this.vEnd = this.gridsNode.convertToNodeSpaceAR(event.getLocation());
        var grid = this.checkGrid(this.vEnd);
        if (grid) {
            if (!this.chessList[grid.y * 15 + grid.x]) {
                // if ((this.mefirst && this.gameState === 'black') || (!this.mefirst && this.gameState === 'white')) {
                if (this.myturn) {
                    this.steps++;
                    this.stepOrderIndex.push(grid.y * 15 + grid.x);
                    var newChess = this.poolChess.pop();
                    this.gridsNode.addChild(newChess);
                    newChess.setPosition(this.getPos(grid.x, grid.y));
                    newChess.getComponent(cc.Sprite).spriteFrame = this.mefirst ? this.blackSpriteFrame : this.whiteSpriteFrame;
                    newChess.tag2 = grid.y * 15 + grid.x;
                    newChess.frame = this.mefirst ? 1 : 2;
                    this.chessList[grid.y * 15 + grid.x] = newChess;
                    this.touchChess = this.chessList[grid.y * 15 + grid.x];
                    bkb.scAudioMgr.playPlayerPlaceChess();
                    this.tipsLabel.string = '等待对方落子';
                    if (this.judgeOver()) {
                        console.log('success');
                        this.emitGo(grid.x, grid.y, true);
                    } else {
                        console.log('emitGo');
                        this.emitGo(grid.x, grid.y, false);
                    }
                } else {
                    // 不是你的turn
                }
            } else {
                // 已经有了
            }
        } else {
            //  放置错误
        }

    },

    judgeOver() {
     

        var touchX = this.touchChess.tag2 % 15;
        var touchY = parseInt(this.touchChess.tag2 / 15);
        var fiveCount = 0;
        // 横向判断
        for (var i = touchX - 4; i <= touchX + 4; i++) {
            if (i < 0 || i > 14) {
                continue;
            } else {
                // if (this.chessList[i + 15 * touchY] && (this.chessList[i + 15 * touchY].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                if (this.chessList[i + 15 * touchY] && (this.chessList[i + 15 * touchY].frame == this.touchChess.frame)) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult(true);
                        return true;
                    }
                } else {
                    fiveCount = 0;
                }
            }
        }
        // 竖向判断
        for (var i = touchY - 4; i <= touchY + 4; i++) {
            if (i < 0 || i > 14) {
                continue;
            } else {
                // if (this.chessList[i * 15 + touchX] && (this.chessList[i * 15 + touchX].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                if (this.chessList[i * 15 + touchX] && (this.chessList[i * 15 + touchX].frame == this.touchChess.frame)) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult(true);
                        return true;
                    }
                } else {
                    fiveCount = 0;
                }
            }
        }
        // 撇向判断
        for (var i = touchX - 4, j = touchY - 4; (i <= touchX + 4) && (j <= touchY + 4); i++ , j++) {
            if (i < 0 || j < 0 || i > 14 || j > 14) {
                continue;
            } else {
                // if (this.chessList[j * 15 + i] && (this.chessList[j * 15 + i].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                if (this.chessList[j * 15 + i] && (this.chessList[j * 15 + i].frame == this.touchChess.frame)) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult(true);
                        return true;
                    }
                } else {
                    fiveCount = 0;
                }
            }
        }
        // 捺向判断
        for (var i = touchX - 4, j = touchY + 4; (i <= touchX + 4) && (j >= touchY - 4); i++ , j--) {
            if (i < 0 || j < 0 || i > 14 || j > 14) {
                continue;
            } else {
                if (this.chessList[j * 15 + i] && (this.chessList[j * 15 + i].frame == this.touchChess.frame)) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult(true);
                        return true;
                    }
                } else {
                    fiveCount = 0;
                }
            }
        }


        this.myturn = !this.myturn;
        return false;
    },

    showResult(flag) {
        console.log('showResult');
        this.state = this.State.gameover;
        if (flag) {
            this.resultLabel.string = "你赢了";
            bkb.scAudioMgr.playWin();
        } else {
            this.resultLabel.string = "你输了";
            bkb.scAudioMgr.playLose();
        }
        this.stepLabel.string = "走了".concat(this.steps).concat("步");
        bkb.scAudioMgr.pauseBgmMusic();
        this.layerGameOver.active = true;

    },

    giveUp() {
        if (this.state == this.State.game) {
            this.showResult(false);
            this.emitGiveup();
        }

    },

    retract() {
        if (this.stepOrderIndex.length != 0) {
            this.steps--;
            var index = this.stepOrderIndex.pop();
            if (this.chessList[index]) {
                this.poolChess.push(this.chessList[index]);
                this.chessList[index] = null;
            }
            index = this.stepOrderIndex.pop();
            if (this.chessList[index]) {
                this.poolChess.push(this.chessList[index]);
                this.chessList[index] = null;
            }
            if (this.stepOrderIndex.length != 0) {
                // this.newChessTip.setPosition(this.chessList[this.stepOrderIndex[this.stepOrderIndex.length - 1]].x - 300,
                // this.chessList[this.stepOrderIndex[this.stepOrderIndex.length - 1]].y - 300);
            } else {
                // this.newChessTip.setPosition(0, 0);
            }
        }
    },



    update(dt) {
        if (this.state == this.State.game) {
            this.time += dt;
            this.timeLabel.string = "时间：".concat(parseInt(this.time)).concat("秒");
        }
    },
});
