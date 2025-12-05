import * as echarts from '../../components/ec-canvas/echarts';

// --- 动态生成模拟数据 ---
const today = new Date();
const y = today.getFullYear();
const m = today.getMonth() + 1;
const d = today.getDate();
const fmt = (y, m, d) => `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

//预设数据
const MOCK_RECORDS = [
  
  { date: fmt(y, m, d), type: '支出', category: '餐饮', amount: 35.5, categoryId: 201 },
  { date: fmt(y, m, d), type: '支出', category: '购物', amount: 128.0, categoryId: 205 },
  { date: fmt(y, m, Math.max(1, d - 1)), type: '收入', category: '工资', amount: 8000.0, categoryId: 101 },
  { date: fmt(y, m, Math.max(1, d - 2)), type: '支出', category: '交通', amount: 22.0, categoryId: 202 },
  { date: fmt(y, m, Math.max(1, d - 5)), type: '收入', category: '红包转账', amount: 200.0, categoryId: 104 },
  
  
  { date: fmt(y, m - 1 === 0 ? 12 : m - 1, 15), type: '支出', category: '娱乐', amount: 300.0, categoryId: 203 },
  { date: fmt(y, m - 1 === 0 ? 12 : m - 1, 20), type: '支出', category: '生活', amount: 150.0, categoryId: 204 },
  
  
  { date: fmt(y, m - 2 === 0 ? 12 : m - 2, 10), type: '收入', category: '奖学金', amount: 2000.0, categoryId: 103 },
];

// --- 页面 ---
Page({
  data: {
    periods: ['本月', '近 3 个月', '近 6 个月', '全部'],
    periodIndex: 0,
    currentPeriod: '本月',
    isLoading: true,
    
    // 预算
    currentBudget: 3000.00, 
    newBudgetValue: '',    
    
    // 总收支
    totalIncome: '0.00',
    totalExpense: '0.00',
    expenseValue: 0, //总支出的数值形式（用于预算进度条等）
    
    // 图表数据
    lineChartData: [],
    pieChartData: [],
    incomePieData: [], 
  },

  onLoad() {
    this.updateChartsData();
  },

  // 预算输入框输入
  handleBudgetInput(e) {
    let value = e.detail.value.replace(/[^\d.]/g, '');
    this.setData({ newBudgetValue: value });
  },

  // 输入新预算
  setNewBudget() {
    const newBudget = parseFloat(this.data.newBudgetValue);

    if (isNaN(newBudget) || newBudget <= 0) {
      wx.showToast({
        title: '请输入有效的预算金额',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      currentBudget: parseFloat(newBudget.toFixed(2)),
      newBudgetValue: '' 
    }, () => {
      this.updateChartsData(); 
      wx.showToast({
        title: `预算已设置为 ¥${newBudget.toFixed(2)}`,
        icon: 'success'
      });
    });
  },

  // 时间筛选器(本月、三个月、全部)
  handlePeriodChange(e) {
    const periodIndex = e.detail.value;
    const currentPeriod = this.data.periods[periodIndex];
    
    this.setData({
      periodIndex: periodIndex,
      currentPeriod: currentPeriod,
      isLoading: true
    }, () => {
      this.updateChartsData();
    });
  },

  // --- 数据计算和图表更新 ---
  updateChartsData() {
    const { currentPeriod } = this.data;
    const filteredRecords = this.filterRecordsByPeriod(currentPeriod);
    //获取经过时间筛选后的所有账单记录
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 1. 账单记录按收入支出分类，并计算总收支
    const expenseRecords = [];
    const incomeRecords = [];
    
    filteredRecords.forEach(r => {
      if (r.type === '收入') {
        totalIncome += r.amount;
        incomeRecords.push(r);
      } else if (r.type === '支出') {
        totalExpense += r.amount;
        expenseRecords.push(r);
      }
    });

    // 2. 计算饼图数据
    const pieChartData = this.getPieChartData(expenseRecords);
    const incomePieData = this.getPieChartData(incomeRecords); 

    // 3. 更新data
    this.setData({
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      expenseValue: totalExpense, 
      pieChartData: pieChartData,
      incomePieData: incomePieData, 
      lineChartData: this.getLineChartData(expenseRecords), 
      isLoading: false
    });
  },

  // --- 辅助函数 ---

  //完成时间筛选
  filterRecordsByPeriod(period) {
    if (period === '全部') return MOCK_RECORDS;

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
    
    return MOCK_RECORDS.filter(r => {
      return r.date >= startStr;
    });
  },

//将日期转化为字符串，便于比较筛选
  formatDateStr(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 计算饼图中各个收支类别的数据
  getPieChartData(records) {
    const map = {};
    records.forEach(r => {
      if (map[r.category]) {
        map[r.category].value += r.amount;
      } else {
        map[r.category] = { name: r.category, value: r.amount, categoryId: r.categoryId };
      }
    });
    
    // 转换为ECharts格式
    return Object.keys(map)
      .map(key => ({
          name: key,
          value: parseFloat(map[key].value.toFixed(2)),
          categoryId: map[key].categoryId
      }))
      .sort((a, b) => b.value - a.value);
  },

  //计算折线图中各日期的数据
  getLineChartData(records) {
    const dailyData = {};
    records.forEach(r => {
      dailyData[r.date] = (dailyData[r.date] || 0) + r.amount;
    });
    
    return Object.keys(dailyData).sort().map(date => ({
        date: date,
        amount: parseFloat(dailyData[date].toFixed(2))
    }));
  },

  //响应用户的点击
  goToDetail(e) {
    console.log('Category tapped:', e.detail.categoryName);
  }
});