import * as echarts from '../../ec-canvas/echarts';

let chart = null;
let startX = 0; // 用于长按判断
let timer = null; // 用于长按计时
let isZooming = false; // 用于双指缩放判断
let lastDistance = 0; // 上次双指距离

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
    // 包含 { date: 'yyyy-MM-dd', amount: 123.45 } 的数据数组
    chartData: {
      type: Array,
      value: []
    }
  },
  data: {
    ec: {
      onInit: initChart
    },
    isLoaded: false,
    dataZoom: [0, 100] // 当前数据窗口比例
  },
  observers: {
    'chartData': function(chartData) {
      if (this.data.isLoaded && chart) {
        this.setOption(chartData);
      }
    }
  },
  lifetimes: {
    ready() {
      this.selectComponent('.ec-canvas').init((canvas, width, height, dpr) => {
        initChart(canvas, width, height, dpr);
        this.setData({ isLoaded: true }, () => {
          this.setOption(this.data.chartData);
          chart.on('datazoom', (params) => {
            const start = chart.getOption().dataZoom[0].start;
            const end = chart.getOption().dataZoom[0].end;
            this.setData({ dataZoom: [start, end] });
          });
        });
      });
    }
  },
  methods: {
    setOption(data) {
      if (!chart) return;

      const dates = data.map(item => item.date.slice(5)); // 显示月-日
      const amounts = data.map(item => item.amount);

      const option = {
        grid: {
          left: '3%',
          right: '4%',
          bottom: 40,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          boundaryGap: false,
          axisLabel: {
            interval: Math.floor(dates.length / 5), // 自动稀疏刻度
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        series: [{
          name: '支出',
          type: 'line',
          smooth: true,
          data: amounts,
          lineStyle: {
            color: '#4990E2',
            width: 2
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(73, 144, 226, 0.4)'
            }, {
              offset: 1,
              color: 'rgba(73, 144, 226, 0)'
            }])
          },
          markPoint: {
            data: [{
              type: 'max',
              name: '最大值'
            }]
          }
        }],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            const item = params[0];
            const date = data[item.dataIndex].date; // 格式化为完整日期
            return `${date}<br/>${item.marker}${item.seriesName}: ${item.value.toFixed(2)}元`;
          }
        },
        dataZoom: [{
          type: 'inside',
          xAxisIndex: [0],
          start: this.data.dataZoom[0],
          end: this.data.dataZoom[1]
        }]
      };

      chart.setOption(option, true);
    },

    // --- 长按显示 tooltip 逻辑 ---
    touchStart(e) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        timer = setTimeout(() => {
          this.showLongPressTooltip(e.touches[0].clientX, e.touches[0].clientY);
          timer = null;
        }, 500); // 长按 500ms
      } else if (e.touches.length === 2) {
        isZooming = true;
        lastDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    },
    touchMove(e) {
      if (timer && Math.abs(e.touches[0].clientX - startX) > 10) {
        clearTimeout(timer); // 移动超过阈值，取消长按
        timer = null;
      }
      if (isZooming && e.touches.length === 2) {
        this.handleZoom(e.touches);
      }
    },
    touchEnd(e) {
      if (timer) {
        clearTimeout(timer); // 释放时如果计时器还在，取消
        timer = null;
      }
      isZooming = false;
    },

    showLongPressTooltip(x, y) {
      if (!chart) return;
      // 核心：调用 ECharts 实例的 dispatchAction 触发 tooltip
      chart.dispatchAction({
        type: 'showTip',
        x: x,
        y: y
      });
      // 保持 tooltip 5秒
      setTimeout(() => {
        chart.dispatchAction({
          type: 'hideTip'
        });
      }, 5000);
    },

    // --- 双指缩放逻辑（DataZoom 控制） ---
    getDistance(t1, t2) {
      return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
    },
    handleZoom(touches) {
      const currentDistance = this.getDistance(touches[0], touches[1]);
      const diff = currentDistance - lastDistance;
      lastDistance = currentDistance;

      // 缩放灵敏度
      const sensitivity = 0.5;
      const zoomFactor = diff * sensitivity;

      let [start, end] = this.data.dataZoom;
      const len = end - start;
      const center = start + len / 2;

      // 调整窗口大小，以中心点为基准缩放
      let newLen = len - zoomFactor;
      newLen = Math.min(100, Math.max(5, newLen)); // 最小5%，最大100%

      let newStart = center - newLen / 2;
      let newEnd = center + newLen / 2;

      // 边界处理
      if (newStart < 0) {
        newStart = 0;
        newEnd = newLen;
      } else if (newEnd > 100) {
        newEnd = 100;
        newStart = 100 - newLen;
      }

      this.setData({ dataZoom: [newStart, newEnd] });

      chart.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        start: newStart,
        end: newEnd
      });
    }
  }
});