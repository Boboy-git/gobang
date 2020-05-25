
cc.Class({
    extends: cc.Component,

    properties: {

    },
    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        bkb.scLayerMenu = this;
    },

    start() {

    },
    bindMatch() {
        bkb.gamemgr.showLayer(bkb.gamemgr.preStageGameMatch);
        this.node.active = false;
    },
    bindAi() {
        bkb.gamemgr.showLayer(bkb.gamemgr.preStageGame);
        this.node.active = false;
    },

    // update (dt) {},
});
