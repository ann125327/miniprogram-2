import * as echarts from '../../ec-canvas/echarts';

let chart = null;

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
    // 必须定义为 Number，否则页面无法使用 .toFixed
    actualExpense: {
      type: Number,
      value: 0
    },
    budget: {
      type: Number,
      value: 2000
    }
  },
  data: {
    ec: {
      onInit: initChart
    },
    isLoaded: false
  },
  observers: {
    // 监听两个属性的变化
    'actualExpense, budget': function(actualExpense, budget) {
      if (this.data.isLoaded && chart) {
        this.setOption(actualExpense, budget);
      }
    }
  },
  lifetimes: {
    ready() {
      this.selectComponent('.ec-canvas').init((canvas, width, height, dpr) => {
        initChart(canvas, width, height, dpr);
        this.setData({ isLoaded: true }, () => {
          this.setOption(this.data.actualExpense, this.data.budget);
        });
      });
    }
  },
  methods: {
    setOption(actualExpense, budget) {
      if (!chart) return;

      const percentage = budget > 0 ? (actualExpense / budget) * 100 : 0;
      const value = Math.min(100, Math.round(percentage));

      const option = {
        series: [{
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: '90%', // 放大一点仪表盘
          center: ['50%', '70%'], // 调整位置
          splitNumber: 8,
          itemStyle: {
            color: '#58D9F9',
            shadowColor: 'rgba(0,0,0,0.2)',
            shadowBlur: 10
          },
          progress: {
            show: true,
            roundCap: true,
            width: 12,
            itemStyle: {
              color: value > 100 ? '#FF6347' : '#58D9F9'
            }
          },
          pointer: { show: false },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 12,
              color: [[1, '#E9E9E9']]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: { show: false },
          detail: {
            offsetCenter: [0, '-20%'], // 数字位置
            valueAnimation: true,
            formatter: function(val) {
              return val + '%';
            },
            color: value > 100 ? '#FF6347' : '#333',
            fontSize: 30,
            fontWeight: 'bold'
          },
          data: [{
            value: value,
            name: '预算使用'
          }]
        }]
      };

      chart.setOption(option, true);
    }
  }
});