App({
  // 1. 全局数据合并
  globalData: {
    //记账记录列表
    records: [],

    // ECharts 图表适配与预算 
    systemInfo: null,    
    userBudget: 3000.00  // 用于仪表盘显示预算
  },

  onLaunch() {
   
    // 1. 云开发初始化 
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        traceUser: true,
        // env: 'your-env-id', // 云开发环境ID（如果有
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
    
    // 4. 尝试加载本地缓存的预算
    // 这样用户修改预算后，下次打开小程序预算不会变回3000
    const storedBudget = wx.getStorageSync('userBudget');
    if (storedBudget) {
      this.globalData.userBudget = Number(storedBudget);
    }
  }
});