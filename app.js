// app.js
App({
  onLaunch: function () {
    // 1. 云开发环境初始化 (如果您们使用了微信云开发)
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env: 'your-env-id-xxxx', // 这里填入你们小组云开发环境的 ID
        traceUser: true,
      });
    }

    // 2. 获取设备信息 (ECharts 有时需要用到屏幕宽度进行适配)
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;

    // 3. 登录逻辑 (通常在这里静默登录获取 openid)
    // this.doLogin(); 
  },

  // 全局共享数据
  globalData: {
    userInfo: null,
    systemInfo: null,
    
    // 重点：这里存储用户的月度预算
    // 仪表盘组件 (Gauge Chart) 需要读取这个数值
    userBudget: 3000.00 

  }
});