import * as echarts from '../../components/ec-canvas/echarts';

// 获取全局 App 实例
const app = getApp();

Page({
  data: {
    isLoading: false,
    periods: ['全部', '本月', '近 3 个月', '近 6 个月'],
    periodIndex: 1, // 默认选中“本月”
    currentPeriod: '本月',
    
    // 页面显示数据
    totalIncome: '0.00',
    totalExpense: '0.00',
    expenseValue: 0,
    currentBudget: 3000, 

    lineChartData: [],
    pieChartData: [],
    incomePieData: [],

    categories: [], // 分类数据暂时留空，直接用 records 里的分类名
    inputBudgetValue: '', // 用于清空输入框
    tempBudget: 0,        // 临时存储用户输入的数字

  },

  onLoad() {
    this.updateChartsData();
  },

  onShow() {
    this.updateChartsData();
  },

  handlePeriodChange(e) {
    const index = e.detail.value;
    this.setData({
      periodIndex: index,
      currentPeriod: this.data.periods[index]
    }, () => {
      this.updateChartsData();
    });
  },

  // 更新数据
  updateChartsData() {
    this.setData({ isLoading: true });

    // 1. 读取数据
    let allRecords = wx.getStorageSync('records') || [];
    let budget = app.globalData.userBudget || 3000;

    // 2. 数据清洗与标准化
    allRecords = allRecords.map(item => {
      // 2.1 确保金额是数字
      item.amountNum = parseFloat(item.amount); 
      
      // 2.2 标准化日期格式为 YYYY-MM-DD
      item.formattedDate = this.parseDate(item);

      // 2.3 标准化类型 (将 'expense' 转为 '支出', 'income' 转为 '收入')
      if (item.type === 'expense') item.typeCN = '支出';
      else if (item.type === 'income') item.typeCN = '收入';
      else item.typeCN = item.type; // 防止本来就是中文的情况

      return item;
    });

    // 3. 筛选数据
    const filteredRecords = this.filterRecordsByPeriod(this.data.currentPeriod, allRecords);
    
    // 4. 计算总收支
    let income = 0;
    let expense = 0;
    
    filteredRecords.forEach(r => {
      if (r.typeCN === '收入') income += r.amountNum;
      else if (r.typeCN === '支出') expense += r.amountNum;
    });

    // 5. 准备图表数据
    const expenseRecords = filteredRecords.filter(r => r.typeCN === '支出');
    const incomeRecords = filteredRecords.filter(r => r.typeCN === '收入');

    const lineData = this.getLineChartData(expenseRecords);
    const expensePieData = this.getPieChartData(expenseRecords);
    const incomePieData = this.getPieChartData(incomeRecords);

    // 6. 更新页面
    setTimeout(() => {
      this.setData({
        isLoading: false,
        totalIncome: income.toFixed(2),
        totalExpense: expense.toFixed(2),
        expenseValue: expense,
        currentBudget: budget,
        lineChartData: lineData,
        pieChartData: expensePieData,
        incomePieData: incomePieData
      });
    }, 200);
  },
// 1. 监听输入框变化
handleBudgetInput(e) {
  this.setData({
    tempBudget: Number(e.detail.value)
  });
},

// 2. 点击设置按钮
handleSaveBudget() {
  const newBudget = this.data.tempBudget;
  
  // 预算必须大于0
  if (!newBudget || newBudget <= 0) {
    wx.showToast({ title: '请输入有效金额', icon: 'none' });
    return;
  }

  // A. 更新全局变量 (app.js)
  const app = getApp();
  app.globalData.userBudget = newBudget;

  // B. 永久保存到本地缓存 (下次打开还在)
  wx.setStorageSync('userBudget', newBudget);

  // C. 更新当前页面显示
  this.setData({
    currentBudget: newBudget,
    inputBudgetValue: '' // 清空输入框，体验更好
  });

  // D. 刷新仪表盘
  this.updateChartsData();

  wx.showToast({ title: '设置成功', icon: 'success' });
},
  //日期解析 
  parseDate(record) {
    // 如果已经有 fullDate (如 2025-12-01)，直接用
    if (record.fullDate) return record.fullDate;

    let dateStr = record.date;
    if (!dateStr) return '';

    // 处理 "2025年12月1日" 格式
    if (dateStr.includes('年')) {
      const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (match) {
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }
    // 处理 "12月1日" (不带年份，默认为当年)
    else if (dateStr.includes('月')) {
      const now = new Date();
      const match = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
      if (match) {
        return `${now.getFullYear()}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      }
    }
    
    return dateStr; // 兜底返回
  },

  //日期筛选
  filterRecordsByPeriod(period, records) {
    if (period === '全部') return records;

    const now = new Date();
    let startDate = new Date();

    if (period === '本月') {
      startDate.setDate(1); 
    } else if (period === '近 3 个月') {
      startDate.setMonth(now.getMonth() - 2); 
      startDate.setDate(1);
    } else if (period === '近 6 个月') {
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1);
    } 
    
    const startStr = this.formatDateStr(startDate);
    
    return records.filter(r => {

      if(!r.formattedDate) return false;
      return r.formattedDate >= startStr;
    });
  },

  formatDateStr(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 图表数据处理
  getLineChartData(records) {
    const dailyData = {};
    records.forEach(r => {
      const d = r.formattedDate;
      dailyData[d] = (dailyData[d] || 0) + r.amountNum;
    });
    return Object.keys(dailyData).sort().map(date => ({
      date: date.slice(5), // 只有月-日，如 "12-01"，节省空间
      amount: dailyData[date]
    }));
  },

  getPieChartData(records) {
    const map = {};
    records.forEach(r => {
      // 优先取分类名，没有则归为"其他"
      const catName = r.category || '其他'; 
      if (map[catName]) {
        map[catName].value += r.amountNum;
      } else {
        map[catName] = { name: catName, value: r.amountNum };
      }
    });
    
    return Object.keys(map)
      .map(key => map[key])
      .sort((a, b) => b.value - a.value);
  },

  goToDetail(e) {
    console.log('点击详情:', e.detail);
  }
});