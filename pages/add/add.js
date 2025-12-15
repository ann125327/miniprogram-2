const app = getApp()

Page({
  data: {
    type: 'expense',
    category: '餐饮',
    categories: {
      expense: ['餐饮', '交通', '娱乐', '生活', '购物', '其他'],
      income: ['工资', '生活费', '奖学金', '红包转账', '投资', '其他']
    },
    amount: '',
    note: '',
    date: '', //日期字段
    currentDate: '' //用于日期选择器的值
  },

  onLoad() {
    // 设置默认分类和默认日期（今天）
    const today = this.getCurrentDate()
    const currentDate = this.getCurrentDateForPicker()
    this.setData({
      category: this.data.categories.expense[0],
      date: today,
      currentDate: currentDate
    })
  },

  //设置类型
  setType(e) {
    const type = e.currentTarget.dataset.type
    const defaultCategory = this.data.categories[type][0]
    this.setData({ 
      type,
      category: defaultCategory
    })
  },

  //选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ category })
  },

  onAmountInput(e) {
    this.setData({ amount: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value })
  },

  //日期选择函数
onDateChange(e) {
  const selectedDate = e.detail.value
  //将日期格式从 YYYY-MM-DD 转换为 X年X月X日 格式
  const dateParts = selectedDate.split('-')
  const formattedDate = `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`
  this.setData({ 
    date: formattedDate,
    currentDate: selectedDate
  })
},

  submitRecord() {
    const { type, category, amount, note, date } = this.data

    //简单验证
    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      })
      return
    }

    //创建记录
    const record = {
      id: Date.now(),
      type: type,
      category: category,
      amount: parseFloat(amount).toFixed(2),
      note: note || '无备注',
      date: date //使用选择的日期
    }

    //保存到全局数据
    app.globalData.records.unshift(record)
    
    //保存到本地存储
    wx.setStorageSync('records', app.globalData.records)

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  getCurrentDate() {
    const now = new Date
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    return `${year}年${month}月${day}日`
  },

  //为日期选择器提供默认值
  getCurrentDateForPicker() {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})