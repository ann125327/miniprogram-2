import * as echarts from '../../ec-canvas/echarts';

let chart = null;
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
    dataZoom: [0, 100] // 用于记录和恢复缩放状态
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
          
          // 监听 ECharts 内部的datazoom事件，同步状态到dataZoom属性
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

      // 提取X轴数据（只显示月-日）和Y轴数据
      const dates = data.map(item => item.date.slice(5)); 
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
            // 自动稀疏刻度，防止标签重叠
            interval: Math.floor(dates.length / 5), 
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
          // 渐变填充
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(73, 144, 226, 0.4)'
            }, {
              offset: 1,
              color: 'rgba(73, 144, 226, 0)'
            }])
          },
          // 标记最大值点
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
          // 自定义 tooltip 格式，显示完整日期
          formatter: function(params) {
            const item = params[0];
            const date = data[item.dataIndex].date; 
            return `${date}<br/>${item.marker}${item.seriesName}: ${item.value.toFixed(2)}元`;
          }
        },
        // 双指缩放配置
        dataZoom: [{
          type: 'inside',
          xAxisIndex: [0],
          start: this.data.dataZoom[0],
          end: this.data.dataZoom[1]
        }]
      };

      chart.setOption(option, true);
    },

    touchStart(e) {
      // 处理双指触控，用于启动缩放
      if (e.touches.length === 2) { 
        isZooming = true;
        lastDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    },
    touchMove(e) {
      // 检查是否处于双指缩放状态
      if (isZooming && e.touches.length === 2) {
        this.handleZoom(e.touches);
      }
    },
    touchEnd(e) {
      // 结束缩放状态
      isZooming = false;
    },
    // --- 双指缩放逻辑（DataZoom 控制） ---
    getDistance(t1, t2) {
      // 计算两触点之间的距离
      return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
    },
    handleZoom(touches) {
      const currentDistance = this.getDistance(touches[0], touches[1]);
      const diff = currentDistance - lastDistance;
      lastDistance = currentDistance;

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

      // 边界处理（确保缩放窗口不超出0-100%的范围
      if (newStart < 0) {
        newStart = 0;
        newEnd = newLen;
      } else if (newEnd > 100) {
        newEnd = 100;
        newStart = 100 - newLen;
      }

      this.setData({ dataZoom: [newStart, newEnd] });

      // ECharts的dataZoom action
      chart.dispatchAction({
        type: 'dataZoom',
        dataZoomIndex: 0,
        start: newStart,
        end: newEnd
      });
    }
  }
});