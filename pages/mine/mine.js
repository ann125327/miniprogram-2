const app = getApp();

Page({
  data: {
    userInfo: {},
    recordDays: 0,    // 记账天数
    billCount: 0,     // 总记账笔数
   
    shareConfig: {
      defaultImg: '/images/猫咪.png', // 好友分享默认图
      timelineImg: '/images/cat.png'  // 朋友圈分享图
    }
  },

  onLoad() {
    this.getUserInfo();
    // 先确保firstLoginTime存在
    if (!wx.getStorageSync("firstLoginTime")) {
      wx.setStorageSync("firstLoginTime", Date.now());
    }
    this.calcAllStatData(); 
    
    wx.showShareMenu({
      withShareTicket: true, // 可获取群聊信息
      menus: ["shareAppMessage", "shareTimeline"] // 显示“好友”+“朋友圈”分享选项
    });
  },

  onShow() {
    this.getUserInfo();
    this.calcAllStatData();
  },

  getUserInfo() {
    const latestUserInfo = app.globalData.userInfo || wx.getStorageSync("userInfo") || {};
    this.setData({ userInfo: latestUserInfo });
  },

  calcAllStatData() {
    const billList = app.globalData.records || wx.getStorageSync("records") || [];
    const billCount = billList.length;
    const firstLoginTime = wx.getStorageSync("firstLoginTime");
    const recordDays = Math.ceil((Date.now() - firstLoginTime) / (1000 * 60 * 60 * 24));

    this.setData({
      billCount,
      recordDays
    });
  },

  toEditUserInfo() {
    wx.navigateTo({ url: "/pages/mine/edit-user/edit-user" });
  },

  toBillAnalysis() {
    wx.navigateTo({ url: "/pages/mine/bill-analysis/bill-analysis" });
  },

  toAbout() {
    wx.navigateTo({ url: "/pages/mine/about/about" });
  },

toShare() {
  const { userInfo } = this.data;
  // 唤起分享选项弹窗，引导用户分享
  wx.showActionSheet({ 
      itemList: ['分享小程序'],
    itemColor: '#333',
    success: (res) => {
      wx.showModal({
        title: "分享提示",
        content: "请点击页面右上角「···」，选择「分享给朋友」或「分享到朋友圈」即可",
        confirmText: "知道了",
        showCancel: false,
      });
    },
    fail: (err) => {
      console.log("分享取消：", err);
      wx.showToast({ title: "分享已取消", icon: "none" });
    }
  });
},

// 分享给好友/群聊
onShareAppMessage(res) {
  const { userInfo, shareConfig } = this.data;
  return {
    title: `${userInfo.nickName || '记账喵'}邀你用超好用的记账小程序！`, // 分享标题
    path: `/pages/index/index?shareFrom=${userInfo.nickName || 'unknown'}`, // 分享路径
    imageUrl: shareConfig.defaultImg // 分享图片
  };
},

// 分享到朋友圈
onShareTimeline() {
  const { shareConfig } = this.data;
  return {
    title: "记账不纠结！喵帮你轻松管账～", // 朋友圈标题
    path: "/pages/index/index", // 朋友圈分享路径（仅支持首页）
    imageUrl: shareConfig.timelineImg // 朋友圈分享图
  };
},

  logout() {
    wx.showModal({
      title: "确认退出",
      content: "退出后需重新登录才能使用记账功能",
      confirmText: "退出",
      cancelText: "取消",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync("token");
          wx.removeStorageSync("tempUserInfo");
          app.globalData.token = "";
          app.globalData.userInfo = null;
          wx.reLaunch({ url: "/pages/login/login" });
        }
      }
    });
  }
});