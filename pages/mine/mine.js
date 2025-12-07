const app = getApp();

Page({
  data: {
    userInfo: {},
    recordDays: 0,    // 记账天数
    billCount: 0,     // 总记账笔数
    monthExpense: 0,  // 当月消费
    monthIncome: 0,   // 当月收入
    monthBudget: 2000,// 当月预算（默认2000）
    budgetRate: 0     // 预算使用比例（%）
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
    const userInfo = app.globalData.userInfo || wx.getStorageSync("userInfo");
    this.setData({ userInfo });
  },


  calcAllStatData() {
    const billList = wx.getStorageSync("billList") || [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const billCount = billList.length;


    const firstLoginTime = wx.getStorageSync("firstLoginTime");
    const recordDays = Math.ceil((Date.now() - firstLoginTime) / (1000 * 60 * 60 * 24));


    let monthExpense = 0;
    let monthIncome = 0;
    billList.forEach(bill => {
      const billMonth = new Date(bill.createTime).getMonth() + 1;
      if (billMonth === currentMonth) {
        if (bill.type === "expense") { 
          monthExpense += Number(bill.amount);
        } else {
          monthIncome += Number(bill.amount);
        }
      }
    });

    monthExpense = monthExpense.toFixed(2);
    monthIncome = monthIncome.toFixed(2);


// 修复后
const budgetRate = Math.min(Math.floor((Number(monthExpense) / this.data.monthBudget) * 100), 100);

    this.setData({
      billCount,
      recordDays,
      monthExpense,
      monthIncome,
      budgetRate
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
          wx.removeStorageSync("userInfo");

          app.globalData.token = "";
          app.globalData.userInfo = null;

          wx.reLaunch({ url: "/pages/login/login" });
        }
      }
    });
  }
});