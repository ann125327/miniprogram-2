import * as echarts from '../../ec-canvas/echarts';

let chart = null;

// 初始化
function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);
  return chart;
}

Component({
  properties: {
    actualExpense: {
      type: Number,
      value: 0
    }, // 实际支出
    budget: {
      type: Number,
      value: 2000
    } // 预算
  },
  data: {
    ec: {
      onInit: initChart
    },
    isLoaded: false
  },
  observers: {
    // 监听属性变化
    'actualExpense, budget': function(actualExpense, budget) {
      if (this.data.isLoaded && chart) {
        this.setOption(actualExpense, budget);
      }
    }
  },
  lifetimes: {
    ready() {
      // 延迟初始化确保节点已挂载
      const ecComponent = this.selectComponent('.ec-canvas');
      if (ecComponent) {
        ecComponent.init((canvas, width, height, dpr) => {
          initChart(canvas, width, height, dpr);
          this.setData({ isLoaded: true }, () => {
            this.setOption(this.data.actualExpense, this.data.budget);
          });
        });
      }
    }
  },
  methods: {
    setOption(actualExpense, budget) {
      if (!chart) return;

      // 计算百分比
      const percentage = budget > 0 ? (actualExpense / budget) * 100 : 0;
      // 仪表盘显示数值（四舍五入）
      const displayValue = Math.round(percentage);
      // 用于逻辑判断的真实值（判断是否超支）
      const isOverBudget = percentage > 100;
      
      const option = {
        series: [{
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '95%', 
          center: ['50%', '75%'], 
          splitNumber: 8,
          itemStyle: {
            color: '#FFD300', 
          },
          progress: {
            show: true,
            roundCap: true,
            width: 16, 
            itemStyle: {
             
              color: isOverBudget ? '#FF6B6B' : '#FFD300'
            }
          },
          pointer: { show: false },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 16,
              color: [[1, '#F0F0F0']] 
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            offsetCenter: [0, '-15%'], // 数字向上微调
            valueAnimation: true,
            formatter: function(val) {
              return val + '%';
            },
            // 超支时数字变色警示
            color: isOverBudget ? '#FF6B6B' : '#333333',
            fontSize: 34,
            fontWeight: 'bold',
            fontFamily: 'sans-serif'
          },
          data: [{
            // 仪表盘指针位置最高到100%，但数字会真实显示（如110%）
            value: Math.min(100, displayValue),
            name: '预算使用'
          }]
        }]
      };

      // 覆盖逻辑：如果需要数字显示超过100，利用 formatter 处理
      option.series[0].detail.formatter = () => displayValue + '%';

      chart.setOption(option, true);
    }
  }
});