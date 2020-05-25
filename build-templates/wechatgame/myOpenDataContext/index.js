// cmd getfriendrank2显示3个  getfriendrank显示全部
// beg 重新请求数据 page -1前一页 0不改变或者第一页 1后一页
// mode 3456  openid 
// data 朋友排行榜  data2 群排行榜
var data;
var data2;
var page = 0;
var page2 = 0;
let sharedCanvas = wx.getSharedCanvas()
let context = sharedCanvas.getContext('2d')
var openid;
var cmd; //当前命令
var rankname;
wx.onMessage(req => {
  if (req.cmd == 'getdata') {
    openid = req.openid;
    rankname = req.rankname;
    //先获得数据
    getdata(req.rankname);
  }
  if (req.cmd == 'checkscore') {
    // 看bmob的数据和微信的数据进行对比
    // 每次retry2都申请查看一次数据
    openid = req.openid;
    rankname = req.rankname;
    wx.getFriendCloudStorage({
      keyList: [req.rankname],
      success: function (res) {
        var d = sortFriendList(res.data);
        data = cleardata(d);
        var score = getMyScore();
        console.log('wxscore:' + score);
        console.log('bscore:' + req.highscore);
        if (score == -1 || (req.highscore != score)) {
          wx.setUserCloudStorage({
            KVDataList: [{
              key: req.rankname,
              value: req.highscore + ''
            }],
            success: function (res) {
              console.log(res);
            }
          })
        }

      }
    });
  }
  if (req.cmd == 'checkupdate') {
    // 得分和数据域进行对比，高于数据域，就更新到排行榜
    openid = req.openid;
    rankname = req.rankname;
    wx.getFriendCloudStorage({
      keyList: [req.rankname],
      success: function (res) {
        var d = sortFriendList(res.data);
        data = cleardata(d);
        var score = getMyScore();
        console.log('wxscore:' + score);
        console.log('cur core:' + req.score);
        if (score == -1 || (req.score > score)) {
          wx.setUserCloudStorage({
            KVDataList: [{
              key: req.rankname,
              value: req.score + ''
            }],
            success: function (res) {
              console.log(res);
            }
          })
        }

      }
    });
  }
  if (req.cmd == 'getsurpass') {
    openid = req.openid;
    rankname = req.rankname;
    //检查即将超越的选手
    getdata(req.rankname, function () {
      getsurpass();
    })
  }




  if (req.cmd == 'getrankfriend2') {
    cmd = 'getrankfriend2';
    openid = req.openid;
    rankname = req.rankname;
    // context.fillStyle = "#2C2C2C";
    // context.fillRect(0, 0, 200, 240)
    // context.fillStyle = "#323232";
    // context.fillRect(200, 0, 200, 240)
    // context.fillStyle = "#2C2C2C";
    // context.fillRect(400, 0, 200, 240)
    // 得到数据然后画出自己左右3个人的数据到rank2，自己第一名就画到最左边，不是就画到中间
    if (!data || req.beg) {
      wx.getFriendCloudStorage({
        keyList: [req.rankname],
        success: function (res) {
          var d = sortFriendList(res.data);
          data = cleardata(d);

          drawFriendRank2(data);
        }
      });
    } else {
      drawFriendRank2(data);
    }
  } else if (req.cmd == 'getrankfriend') {
    cmd = 'getrankfriend'
    //画出全部
    openid = req.openid;
    rankname = req.rankname;
    // 画6个背景
    // for (var m = 0; m < 6; m++) {
    //   context.fillStyle = "#ffffff";
    //   context.fillRect(0, m * 100, 480, 100)
    // }
    if (req.page == 0) {
      if (page == 0) page = 1;
    } else {
      page += req.page;
      if (page <= 0) {
        page = 1;
      }
    }
    if (!data || req.beg) {
      wx.getFriendCloudStorage({
        keyList: [req.rankname],
        success: function (res) {
          var d = sortFriendList(res.data);
          data = cleardata(d);

          drawFriendRank();
        }
      });
    } else drawFriendRank();
  } else if (req.cmd == 'getrankgroup') {

    //画出群里排行榜
    openid = req.openid;
    rankname = req.rankname;
    // 画6个背景
    // for (var m = 0; m < 6; m++) {
    //   context.fillStyle = "#ffffff";
    //   context.fillRect(0, m * 100, 480, 100)
    // }
    if (req.page == 0) {
      if (page2 == 0) page2 = 1;
    } else {
      page2 += req.page;
      if (page2 <= 0) {
        page2 = 1;
      }
    }
    if (!data2 || req.beg) {
      wx.getGroupCloudStorage({
        shareTicket: req.shareTicket,
        keyList: [req.rankname],
        success: function (res) {
          var d = sortFriendList(res.data);
          data2 = cleardata(d);
          console.log(data2);
          drawRankGroup();
        }
      });
    } else drawRankGroup();

  }

})
var getsurpass = function () {
  var index = getMyIndex();
  var showindex;
  var bb = false; //霸榜
  if (index == 0) {
    //显示头像和成功霸榜
    showindex = 0;
    bb = true;
  } else {
    if (index == -1) {
      //没有排名，显示最后一名的头像
      showindex = data.length - 1;
    } else showindex = index - 1;
    //显示前一名
  }
  if (data[showindex] && data[showindex].avatarUrl) {
    let image = wx.createImage();
    image.onload = function () {
      context.drawImage(image, 10, 30, 80, 80)
    };
    image.src = data[showindex].avatarUrl;


    let imagetitle = wx.createImage();
    imagetitle.onload = function () {
      context.drawImage(imagetitle, 2, 0, 96, 25)
    };
    imagetitle.src = bb ? (rankname == 'hs2048' ? 'utils/cgbb2048.png' : 'utils/cgbb.png') : (rankname == 'hs2048' ? 'utils/jjcy2048.png' : 'utils/jjcy.png');
  }

}
var getdata = function (rankname, cb) {
  wx.getFriendCloudStorage({
    keyList: [rankname],
    success: function (res) {
      var d = sortFriendList(res.data);
      data = cleardata(d);
      typeof cb == "function" && cb();
    }
  });
}
var drawFriendRank2 = function () {
  if (cmd != 'getrankfriend2') return;
  // 画3个人的  如果自己的排名没有，则画出前三名
  // 画三个人 600 200
  var index = getMyIndex();
  if (index == 0 || index == -1) {
    //自己是第一名，那就画213 
    for (var n = 0; n < 3; n++) {
      (function (n) {
        if (data[n]) {
          // 名次
          if (index == n) {
            context.fillStyle = "red";
          } else context.fillStyle = "#747474";
          context.textAlign = "center";
          context.font = "oblique bold 40px Arial";
          context.fillText(n + 1, x213(n) * 160 + 80, 50);
          // 头像
          if (data[n].avatarUrl) {
            let image = wx.createImage();
            image.onload = function () {
              if (cmd != 'getrankfriend2') return;
              context.drawImage(image, 40 + x213(n) * 160, 60, 80, 80)
            };
            image.src = data[n].avatarUrl;
          }

          //  name
          context.fillStyle = "#747474";
          context.font = "24px Arial";
          context.textAlign = "center";
          // var s = data[n].nickname;
          // var w = context.measureText(s).width;
          context.fillText(data[n].nickname, x213(n) * 160 + 80, 170);
          // 时间
          context.fillStyle = "#747474";
          context.font = "24px Arial";
          context.textAlign = "center";
          var level1 = parseInt((data[n].KVDataList[0].value - 1) / 100) + 1;
          var level2 = data[n].KVDataList[0].value % 100;
          if (level2 == 0) level2 = 100;
          var s = getLevel1Str(level1) + ' ' + level2;

          // var w = context.measureText(s).width;
          context.fillText(s, x213(n) * 160 + 80, 230);

        }
      })(n)
    }
  } else {
    for (var n = index - 1; n < index + 2; n++) {
      (function (n) {
        if (data[n]) {
          // 名次
          if (index == n) {
            context.fillStyle = "red";
          } else context.fillStyle = "#747474";
          context.font = "oblique bold 40px Arial";
          context.textAlign = "center";
          context.fillText(n + 1, (n - index + 1) * 160 + 80, 50);
          // 头像
          if (data[n].avatarUrl) {
            let image = wx.createImage();
            image.onload = function () {
              if (cmd != 'getrankfriend2') return;
              context.drawImage(image, 40 + (n - index + 1) * 160, 60, 80, 80)
            };
            image.src = data[n].avatarUrl;
          }
          //  name
          context.fillStyle = "#747474";
          context.font = "24px Arial";
          context.textAlign = "center";
          // var s = data[n].nickname;
          // var w = context.measureText(s).width;

          context.fillText(data[n].nickname, (n - index + 1) * 160 + 80, 170);

          // 时间
          context.fillStyle = "#747474";
          context.font = "24px Arial";
          context.textAlign = "center";
          var level1 = parseInt((data[n].KVDataList[0].value - 1) / 100) + 1;
          var level2 = data[n].KVDataList[0].value % 100;
          if (level2 == 0) level2 = 100;
          var s = getLevel1Str(level1) + ' ' + level2;
          // var s = data[n].KVDataList[0].value + '';
          // var w = context.measureText(s).width;

          context.fillText(s, (n - index + 1) * 160 + 80, 230);
        }
      })(n)
    }
  }
}

var x213 = function (n) {
  if (n == 0) return 1;
  if (n == 1) return 0;
  if (n == 2) return 2;
}

var drawFriendRank = function () {
  // if (cmd != 'getrankfriend') return;
  var l;
  if (data.length - (page - 1) * 6 > 6) {
    l = 6;
  } else {
    l = data.length - (page - 1) * 6;
  }
  if (l <= 0) {
    page--;
    drawFriendRank();
    return;

  }

  for (var m = (page - 1) * 6; m < l + (page - 1) * 6; m++) {

    (function (m) {
      var item = data[m];
      if (!item || !item.KVDataList || item.KVDataList.length == 0) return;
      // 名次
      context.fillStyle = "#747474";
      context.font = "italic bold 40px Arial";
      context.textAlign = "start";
      context.fillText(m + 1, 30, (m - (page - 1) * 6) * 120 + 80);
      // 头像
      if (item.avatarUrl) {
        let image = wx.createImage();
        image.onload = function () {
          context.drawImage(image, 100, (m - (page - 1) * 6) * 120 + 20, 80, 80)
        };
        image.src = item.avatarUrl;
      }
      // name
      context.fillStyle = "#747474";
      // context.font = "oblique bold 40px Arial";
      context.font = "24px Arial";
      context.textAlign = "start";
      context.fillText(item.nickname, 220, (m - (page - 1) * 6) * 120 + 75, 220);
      // time
      context.fillStyle = "#747474";
      context.font = "24px Arial";

      var level1 = parseInt((item.KVDataList[0].value - 1) / 100) + 1;
      var level2 = item.KVDataList[0].value % 100;
      if (level2 == 0) level2 = 100;
      var s = getLevel1Str(level1) + ' ' + level2;

      // var w = context.measureText(s).width;

      context.textAlign = "start";
      context.fillText(s, 480, (m - (page - 1) * 6) * 120 + 75, 110);
      // line
      // context.strokeStyle = "#747474";
      // context.moveTo(20, (m + 1) * 120);
      // context.lineTo(580, (m + 1) * 120);
      // context.stroke();
    })(m)
  }

}
var drawRankGroup = function () {
  var l;
  if (data2.length - (page2 - 1) * 6 > 6) {
    l = 6;
  } else {
    l = data2.length - (page2 - 1) * 6;
  }
  if (l <= 0) {
    page2--;
    drawRankGroup();
    return;

  }
  console.log(page2);
  console.log(l);

  for (var m = (page2 - 1) * 6; m < l + (page2 - 1) * 6; m++) {

    (function (m) {
      var item = data2[m];
      if (!item || !item.KVDataList || item.KVDataList.length == 0) return;
      // 名次
      context.fillStyle = "#747474";
      context.font = "italic bold 40px Arial";
      context.textAlign = "start";
      context.fillText(m + 1, 30, (m - (page2 - 1) * 6) * 120 + 80);
      // 头像
      if (item.avatarUrl) {
        let image = wx.createImage();
        image.onload = function () {
          context.drawImage(image, 100, (m - (page2 - 1) * 6) * 120 + 20, 80, 80)
        };
        image.src = item.avatarUrl;
      }
      // name
      context.fillStyle = "#747474";
      // context.font = "oblique bold 40px Arial";
      context.font = "24px Arial";
      context.textAlign = "start";
      context.fillText(item.nickname, 220, (m - (page2 - 1) * 6) * 120 + 75, 220);
      // time
      context.fillStyle = "#747474";
      context.font = "24px Arial";

      var level1 = parseInt((item.KVDataList[0].value - 1) / 100) + 1;
      var level2 = item.KVDataList[0].value % 100;
      if (level2 == 0) level2 = 100;
      var s = getLevel1Str(level1) + ' ' + level2;

      // var w = context.measureText(s).width;
      context.textAlign = "start";
      context.fillText(s, 480, (m - (page2 - 1) * 6) * 120 + 75, 110);
      // line
      // context.strokeStyle = "#747474";
      // context.moveTo(20, (m + 1) * 120);
      // context.lineTo(580, (m + 1) * 120);
      // context.stroke();
    })(m)
  }

}

var getLevel1Str = function (level1) {
  switch (level1) {
    case 1:
      return '青铜';
      break;
    case 2:
      return '白银';
      break;
    case 3:
      return '黄金';
      break;
    case 4:
      return '铂金';
      break;
    case 5:
      return '钻石';
      break;
    case 6:
      return '星耀';
      break;
    case 7:
      return '王者';
      break;
  }
}
var sortFriendList = function (data) {
  // 给朋友数据排序
  if (data && data.length > 1) {
    data = data.sort(function (ob1, ob2) {
      // -1 在前面 1在后面
      if (!ob1.KVDataList || ob1.KVDataList.length == 0) {
        return 1;
      }
      if (!ob2.KVDataList || ob2.KVDataList.length == 0) {
        return -1;
      }
      if (parseFloat(ob1.KVDataList[0].value) - parseFloat(ob2.KVDataList[0].value) > 0) {

        return -1;
      } else if (parseFloat(ob1.KVDataList[0].value) - parseFloat(ob2.KVDataList[0].value) < 0) {

        return 1;
      } else {

        return 0;
      }
    })
  }
  return data;

}
var cleardata = function (data) {
  //    把没有数据的清掉
  var temp = []
  for (var m = 0; m < data.length; m++) {
    if (!data[m].KVDataList || data[m].KVDataList.length == 0) {
      continue;
    } else temp.push(data[m])
  }
  return temp;
}

var getMyIndex = function () {
  // 返回自己的排名 -1 说明没有
  if (!data || !openid) return -1;
  for (var m = 0; m < data.length; m++) {
    var item = data[m];
    if (item.openid == openid) {
      if (!item.KVDataList || item.KVDataList.length == 0) return -1;
      return m;
    }
  }
  return -1;
}

var getMyScore = function () {
  // 返回自己的排名 -1 说明没有
  if (!data || !openid) return -1;
  for (var m = 0; m < data.length; m++) {
    var item = data[m];
    if (item.openid == openid) {
      if (!item.KVDataList || item.KVDataList.length == 0) return -1;
      return item.KVDataList[0].value;
    }
  }
  return -1;
}