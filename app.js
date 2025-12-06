App({
  globalData: {
    records: []
  },
  onLaunch() {
    //加载本地数据
    const records = wx.getStorageSync('records')
    if (records) {
      this.globalData.records = records
    }
  }
})