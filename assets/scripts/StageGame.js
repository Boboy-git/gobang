

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
        gameState: 'white',
        fiveGroup: [],
        fiveGroupScore: [],
        steps: 0,
        time: 0,

        stepOrderIndex: []
    },
    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        bkb.scStageGame = this;
        this.layerGameOver.active = false;
        this.newChessTip.active = false;

        this.steps = 0;
        this.time = 0;


        var self = this;
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


        return;
        // 初始化棋盘
        // 棋盘anchor在左下角，为 0，0  x往右加大  y往上加大
        for (var y = 0; y < 15; y++) {
            for (var x = 0; x < 15; x++) {
                var newChess = cc.instantiate(this.chessPrefab);
                this.node.addChild(newChess);
                newChess.setPosition(cc.v2(x * 40 + 20, y * 40 + 20));
                newChess._tag = y * 15 + x;
                // newChess.on(cc.Node.EventType.TOUCH_END, function (event) {
                //     self.touchChess = this;
                //     if (self.gameState === 'black' && this.getComponent(cc.Sprite).spriteFrame === null) {
                //         self.stepOrderIndex.push(this.tag);
                //         this.getComponent(cc.Sprite).spriteFrame = self.blackSpriteFrame;
                //         // self.newChessTip.node.setPosition(this.getPositionX() - 300, this.getPositionY() - 300);
                //         bkb.scAudioMgr.playPlayerPlaceChess();
                //         self.judgeOver();
                //         if (self.gameState === 'white') {
                //             self.scheduleOnce(function () {
                //                 self.ai();
                //             }, 0.3);
                //         }
                //     }
                // });
                this.chessList.push(newChess);
            }
        }
    },
    start() {
        this.restart();
    },
    bindStartMe() {
        // 黑子先行
        this.state = this.State.game;
        this.mefirst = true;
        this.layerStart.active = false;
        this.gameState = 'black';
    },
    bindStartAi() {
        this.state = this.State.game;
        this.mefirst = false;
        this.layerStart.active = false;
        var newChess = this.poolChess.pop();
        this.gridsNode.addChild(newChess);
        newChess.setPosition(this.getPos(7, 7));
        newChess.getComponent(cc.Sprite).spriteFrame = this.blackSpriteFrame;
        this.chessList[7 * 15 + 7] = newChess;
        newChess.tag2 = 7 * 15 + 7;
        this.stepOrderIndex.push(7 * 15 + 7);
        bkb.scAudioMgr.playComputePlaceChess();
        this.gameState = 'white';
    },
    restart() {
        this.clear();
        this.state = this.State.ready;
        this.fiveGroupScore = [];
        this.stepOrderIndex = [];
        this.time = 0;
        this.timeLabel.string = "时间：".concat(parseInt(this.time)).concat("秒");
        bkb.scAudioMgr.playBgmMusic();
        this.timeLabel.node.active = true;

        this.layerStart.active = true;
        // 白棋先在棋盘正中下一子
        // var newChess = this.poolChess.pop();
        // this.gridsNode.addChild(newChess);
        // newChess.setPosition(this.getPos(7, 7));
        // newChess.getComponent(cc.Sprite).spriteFrame = this.whiteSpriteFrame;
        // this.chessList[7 * 15 + 7] = newChess;
        // newChess.tag2 = 7 * 15 + 7;
        // this.stepOrderIndex.push(7 * 15 + 7);
        // bkb.scAudioMgr.playComputePlaceChess();
        // 下一步应该下黑棋
        // this.gameState = 'black';
    },
    bindRetry() {
        this.layerGameOver.active = false;
        this.restart();
    },
    bindBack(){
        this.clear();
        this.poolChess.clear();
        this.node.destroy();
        bkb.scLayerMenu.node.active = true;
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

        bkb.scStageGame = null;
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
        if (this.state != this.State.game || !this.canMove) return;
        this.vEnd = this.gridsNode.convertToNodeSpaceAR(event.getLocation());
        var grid = this.checkGrid(this.vEnd);
        if (grid) {
            if (!this.chessList[grid.y * 15 + grid.x]) {
                if ((this.mefirst && this.gameState === 'black') || (!this.mefirst && this.gameState === 'white')) {
                    this.stepOrderIndex.push(grid.y * 15 + grid.x);
                    var newChess = this.poolChess.pop();
                    this.gridsNode.addChild(newChess);
                    newChess.setPosition(this.getPos(grid.x, grid.y));
                    newChess.getComponent(cc.Sprite).spriteFrame = this.mefirst ? this.blackSpriteFrame : this.whiteSpriteFrame;
                    newChess.tag2 = grid.y * 15 + grid.x;
                    this.chessList[grid.y * 15 + grid.x] = newChess;
                    this.touchChess = this.chessList[grid.y * 15 + grid.x];
                    // self.newChessTip.node.setPosition(this.getPositionX() - 300, this.getPositionY() - 300);
                    bkb.scAudioMgr.playPlayerPlaceChess();
                    this.judgeOver();
                    if ((this.mefirst && this.gameState === 'white') || (!this.mefirst && this.gameState === 'black')) {
                        this.scheduleOnce(function () {
                            this.ai();
                        }, 0.3);
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
    ai() {
        this.steps++;
        this.fiveGroupScore = [];
        // 评分，根据五元组里的黑白棋子的不同个数去计算每个点的可能得分
        for (var i = 0; i < this.fiveGroup.length; i++) {
            var blackCount = 0; // 五元组中黑棋的个数
            var whiteCount = 0; // 五元组中白棋的个数
            for (var index = 0; index < 5; index++) {
                if (this.chessList[this.fiveGroup[i][index]]) {
                    if ((this.chessList[this.fiveGroup[i][index]].getComponent(cc.Sprite)).spriteFrame == this.blackSpriteFrame) {
                        if (this.mefirst) blackCount++;
                        else whiteCount++;
                    } else if ((this.chessList[this.fiveGroup[i][index]].getComponent(cc.Sprite)).spriteFrame == this.whiteSpriteFrame) {
                        if (this.mefirst)
                            whiteCount++;
                        else blackCount++;
                    }
                }
            }
            //whiteCount 是电脑的
            if (blackCount + whiteCount == 0) {
                this.fiveGroupScore[i] = 7;
            } else if (blackCount > 0 && whiteCount > 0) {
                this.fiveGroupScore[i] = 0;
            } else if (blackCount == 0 && whiteCount == 1) {
                this.fiveGroupScore[i] = 35;
            } else if (blackCount == 0 && whiteCount == 2) {
                this.fiveGroupScore[i] = 800;
            } else if (blackCount == 0 && whiteCount == 3) {
                this.fiveGroupScore[i] = 15000;
            } else if (blackCount == 0 && whiteCount == 4) {
                this.fiveGroupScore[i] = 800000;
            } else if (whiteCount == 0 && blackCount == 1) {
                this.fiveGroupScore[i] = 15;
            } else if (whiteCount == 0 && blackCount == 2) {
                this.fiveGroupScore[i] = 400;
            } else if (whiteCount == 0 && blackCount == 3) {
                this.fiveGroupScore[i] = 1800;
            } else if (whiteCount == 0 && blackCount == 4) {
                this.fiveGroupScore[i] = 100000;
            }
        }
        // 找出最高分的五元组
        var highScore = 0;
        var position = 0;
        for (var i = 0; i < this.fiveGroupScore.length; i++) {
            if (this.fiveGroupScore[i] > highScore) {
                highScore = this.fiveGroupScore[i];
                position = i;
            }
        }
        // 在最高分的五元组里的可以下子的位置找到最优的下子位置
        // 每次找能下子的最后一个位置
        var spaceFlag = false;
        var index = 0;
        for (var i = 0; i < 5; i++) {
            if (!spaceFlag) {
                if (!this.chessList[this.fiveGroup[position][i]]) {
                    index = i;
                } else {
                    spaceFlag = true;
                }
            }
            if (spaceFlag && !this.chessList[this.fiveGroup[position][i]]) {
                index = i;
                break;
            }
        }
        // 在最优位置下子

        var newChess = this.poolChess.pop();
        this.gridsNode.addChild(newChess);
        var num = this.fiveGroup[position][index];
        var x = num % 15;
        var y = parseInt(num / 15);
        this.chessList[this.fiveGroup[position][index]] = newChess;
        newChess.tag2 = num;
        newChess.setPosition(this.getPos(x, y));
        newChess.getComponent(cc.Sprite).spriteFrame = this.mefirst ? this.whiteSpriteFrame : this.blackSpriteFrame;

        this.stepOrderIndex.push(this.fiveGroup[position][index]);
        // this.newChessTip.setPosition(this.chessList[this.fiveGroup[position][index]].x - 300, this.chessList[this.fiveGroup[position][index]].y - 300);
        // this.newChessTip.active = true;
        bkb.scAudioMgr.playComputePlaceChess();
        this.touchChess = this.chessList[this.fiveGroup[position][index]];
        this.judgeOver();
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
                if (this.chessList[i + 15 * touchY] && (this.chessList[i + 15 * touchY].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult();
                        return;
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
                if (this.chessList[i * 15 + touchX] && (this.chessList[i * 15 + touchX].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult();
                        return;
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
                if (this.chessList[j * 15 + i] && (this.chessList[j * 15 + i].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult();
                        return;
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
                if (this.chessList[j * 15 + i] && (this.chessList[j * 15 + i].getComponent(cc.Sprite)).spriteFrame === this.touchChess.getComponent(cc.Sprite).spriteFrame) {
                    fiveCount++;
                    if (fiveCount == 5) {
                        this.showResult();
                        return;
                    }
                } else {
                    fiveCount = 0;
                }
            }
        }

        // 没有输赢则交换下子顺序
        if (this.gameState === 'black') {
            this.gameState = 'white';
        } else {
            this.gameState = 'black';
        }
    },

    showResult() {
        this.state = this.State.gameover;
        if ((this.mefirst && this.gameState === 'black') || (!this.mefirst && this.gameState === 'white')) {
            this.resultLabel.string = "你赢了";
            bkb.scAudioMgr.playWin();
        } else {
            this.resultLabel.string = "你输了";
            bkb.scAudioMgr.playLose();
        }
        this.stepLabel.string = "走了".concat(this.steps).concat("步");
        bkb.scAudioMgr.pauseBgmMusic();
        this.layerGameOver.active = true;
        this.gameState = 'over';
    },

    giveUp() {
        if (this.mefirst)
            this.gameState = 'white';
        else this.gameState = 'black';
        this.showResult();
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
