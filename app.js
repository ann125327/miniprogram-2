// app.js
// 小程序全局实例
App({
  // 全局数据（合并双方：用户信息 + 队友的记账/预算/图表数据）
  globalData: {
    // 全局数据
    userInfo: null,  // 存储用户信息（头像、昵称）
    token: "",        // 存储登录态token
    records: [],      // 记账记录列表
    systemInfo: null, // ECharts 图表适配
    userBudget: 3000.00  // 用于仪表盘显示预算
  },

  // 小程序启动时执行（只执行一次）
  onLaunch() {
    // ========== 启动时检查本地登录态 ==========
    const token = wx.getStorageSync("token");
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = wx.getStorageSync("userInfo");
  
    }

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
        // env: 'your-env-id', // 云开发环境ID（如果有，后续补充）
      });
    }

    // 2. 获取设备信息 (保证ECharts图表不模糊)
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
    } catch (e) {
      console.error('获取设备信息失败', e);
    }

    // 3. 加载本地缓存的记账数据
    const records = wx.getStorageSync('records');
    if (records) {
      this.globalData.records = records;
    }
    
    // 4. 尝试加载本地缓存的预算（用户修改后不会变回3000）
    const storedBudget = wx.getStorageSync('userBudget');
    if (storedBudget) {
      this.globalData.userBudget = Number(storedBudget);
    }
  }
});