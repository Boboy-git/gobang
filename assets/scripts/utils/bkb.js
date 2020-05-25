var Pool = require('./Pool');
var Animation = require('./Animation');



function getRGB(hex) {
    var rgb = [0, 0, 0];
    if (/#(..)(..)(..)/g.test(hex)) {
        rgb = [parseInt(RegExp.$1, 16), parseInt(RegExp.$2, 16), parseInt(RegExp.$3, 16)];
    };
    return "rgb(" + rgb.join(",") + ")";
}
var math = {

}
math.randomI = function (min, max) {
    //    [from,to]
    return min + Math.ceil((max - min + 1) * Math.random()) - 1;

}
var arr = {}
arr.removeKey = function (arr, key) {
    var newarr = [];
    for (var i = 0; i < arr.length; i++) {
        if (i != key)
            newarr.push(arr[i]);
    }
    return newarr;
}

arr.removeValue = function (arr, value) {
    var newarr = [];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] != value) {
            newarr.push(arr[i]);
        }
    }
    return newarr;
}

var globalData = {}
var shop = {}
// var wx={}

window.bkb = {
    Pool,
    Animation,

    getRGB,
    math,
    arr,
    globalData,
    shop,
    wxgame: cc.sys.platform == cc.sys.WECHAT_GAME ? true : false,
    vivogame: cc.sys.platform == cc.sys.VIVO_GAME ? true : false,

}

// VIVO_GAME  OPPO_GAME BAIDU_GAME FB_PLAYABLE_ADS QQ_PLAY WECHAT_GAME
