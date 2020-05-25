
cc.Class({
    extends: cc.Component,

    properties: {
        preStageGameMatch: cc.Prefab,
        preStageGame: cc.Prefab,

    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        bkb.gamemgr = this;
        this.canvas = cc.find("Canvas");
        this.layerMenu = cc.find("Canvas/LayerMenu");

        if (bkb.wxgame) {
            wx.onShareAppMessage(
                function () {
                    var s = bkb.gamemgr.getShareInfo();
                    return {
                        title: s.title,
                        imageUrl: s.imageUrl,
                    }
                })
            var res = wx.getLaunchOptionsSync();
            console.log(res);
            if (res && res.query) {
                if (res.query.pk) {
                    bkb.gamemgr.showLayerMatch();
                }
            }
            wx.onShow(function (res) {
                console.log("onShow");
                console.log(res);
                if (res && res.query) {
                    if (res.query.pk) {
                        bkb.gamemgr.showLayerMatch();
                    }
                }
            })
        }
    },
    showLayerMatch() {
        if (!bkb.scStageGameMatch) {
            this.showLayer(this.preStageGameMatch);
            this.layerMenu.active = false;
        }
    },
    showLayer(prefab) {
        var layer = cc.instantiate(prefab);
        layer.setPosition(cc.v2());
        this.canvas.addChild(layer);
        return layer;
    },
    getShareInfo() {
        // 返回分享的 title img
        var title;
        var imageUrl;
        title = '一起来玩五子棋吧~';
        imageUrl = "utils/share.png";
        return {
            title: title,
            imageUrl: imageUrl
        }
    },
    start() {

    },
    showLayer(prefab) {
        var layer = cc.instantiate(prefab);
        layer.setPosition(cc.v2());
        this.canvas.addChild(layer);
        return layer;
    },
    // update (dt) {},
});
