// app.js
// 小程序全局实例
App({
  // 全局数据（所有页面可通过 getApp() 获取）
  globalData: {
    userInfo: null,  // 存储用户信息（头像、昵称）
    token: ""        // 存储登录态token
  },

  // 小程序启动时执行（只执行一次）
  onLaunch() {
    // 启动时检查本地是否有登录态，有则直接跳首页（后续和小组项目合并时用）
    const token = wx.getStorageSync("token");
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = wx.getStorageSync("userInfo");
      // 这里暂时注释，测试时先停在登录页；后续合并时打开
      // wx.switchTab({ url: '/pages/index/index' });
    }
  }
});