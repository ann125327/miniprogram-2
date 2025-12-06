const app = getApp()

Page({
  data: {
    records: [],
    filteredRecords: [],
    totalExpense: '0.00',
    totalIncome: '0.00',
    selectedMonth: '',
    currentMonth: '',
    activeFilter: null // 当前激活的筛选类型，null/'expense'/'income'
  },

  onLoad() {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    
    this.setData({
      selectedMonth: currentMonth,
      currentMonth: currentMonth
    })
    
    this.loadRecords()
  },

  onShow() {
    this.loadRecords()
  },

  loadRecords() {
    const records = app.globalData.records || []
    this.filterRecordsByMonth(records)
  },

  //按月份和类型筛选记录
  filterRecordsByMonth(records) {
    const { selectedMonth, activeFilter } = this.data
    let filteredRecords = []
    let expense = 0
    let income = 0

    //筛选指定月份的记录
    records.forEach(record => {
      let recordMonth = ''
      
      //处理日期格式
      if (record.fullDate) {
        recordMonth = record.fullDate.substring(0, 7)
      } else if (record.date) {
        if (record.date.includes('年')) {
          const match = record.date.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
          if (match) {
            const year = match[1]
            const month = match[2].padStart(2, '0')
            recordMonth = `${year}-${month}`
          }
        } else if (record.date.includes('-')) {
          recordMonth = record.date.substring(0, 7)
        } else if (record.date.includes('月')) {
          const now = new Date()
          const match = record.date.match(/(\d{1,2})月(\d{1,2})日/)
          if (match) {
            const year = now.getFullYear()
            const month = match[1].padStart(2, '0')
            recordMonth = `${year}-${month}`
          }
        }
      }

      //先按月份筛选
      if (recordMonth === selectedMonth) {
        //再按类型筛选（如果有激活的筛选）
        if (!activeFilter || record.type === activeFilter) {
          filteredRecords.push(record)
        }
        
        //统计总数（不受筛选影响）
        const amount = parseFloat(record.amount)
        if (record.type === 'expense') {
          expense += amount
        } else {
          income += amount
        }
      }
    })

    //按日期倒序排列
    filteredRecords.sort((a, b) => {
      const dateA = this.getSortableDate(a)
      const dateB = this.getSortableDate(b)
      return dateB - dateA
    })

    this.setData({
      filteredRecords,
      totalExpense: expense.toFixed(2),
      totalIncome: income.toFixed(2)
    })
  },

  //获取可排序的日期
  getSortableDate(record) {
    if (record.fullDate) {
      return new Date(record.fullDate)
    } else if (record.date) {
      if (record.date.includes('年')) {
        const match = record.date.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
        if (match) {
          return new Date(match[1], match[2] - 1, match[3])
        }
      } else if (record.date.includes('-')) {
        return new Date(record.date)
      } else if (record.date.includes('月')) {
        const now = new Date()
        const match = record.date.match(/(\d{1,2})月(\d{1,2})日/)
        if (match) {
          return new Date(now.getFullYear(), match[1] - 1, match[2])
        }
      }
    }
    return new Date(0)
  },

  //月份选择变化
  onMonthChange(e) {
    const selectedMonth = e.detail.value
    this.setData({
      selectedMonth,
      activeFilter: null //切换月份时重置筛选
    })
    this.loadRecords()
  },

  //点击支出按钮
  onExpenseTap() {
    const { activeFilter } = this.data
    
    //如果当前已经是支出筛选，则取消筛选
    //否则设置为支出筛选
    const newFilter = activeFilter === 'expense' ? null : 'expense'
    
    this.setData({
      activeFilter: newFilter
    })
    
    this.loadRecords()
  },

  //点击收入按钮
  onIncomeTap() {
    const { activeFilter } = this.data
    
    //如果当前已经是收入筛选，则取消筛选
    //否则设置为收入筛选
    const newFilter = activeFilter === 'income' ? null : 'income'
    
    this.setData({
      activeFilter: newFilter
    })
    
    this.loadRecords()
  },

  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  }
})