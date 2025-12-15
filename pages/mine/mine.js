const app = getApp();

Page({
  data: {
    userInfo: {},
    recordDays: 0,    // 记账天数
    billCount: 0,     // 总记账笔数
    
  },


onLoad() {
  this.getUserInfo();
  // 先确保firstLoginTime存在
  if (!wx.getStorageSync("firstLoginTime")) {
    wx.setStorageSync("firstLoginTime", Date.now());
  }
  this.calcAllStatData(); // 再计算数据
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
    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    });
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