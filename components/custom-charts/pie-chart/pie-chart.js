import * as echarts from '../../ec-canvas/echarts';

Component({
  properties: {
    chartData: {
      type: Array,
      value: []
    }
  },
  data: {
    ec: {
      lazyLoad: true // 开启懒加载，手动控制初始化
    },
    isLoaded: false,
  },
  // 监听数据变化
  observers: {
    'chartData': function(chartData) {
      if (this.data.isLoaded && this.chart) {
        this.setOption(chartData);
      }
    }
  },
  lifetimes: {
    ready() {
      // 增加了一个200毫秒的延迟，确保WXML渲染完成，<canvas> 元素获取到正确的宽度和高度（非零值）。
      //用来避免ECharts在尺寸计算错误时无法正确渲染的问题。
      setTimeout(() => {
        this.initChart();
      }, 200); 
    },
    
    detached() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    }
  },
  methods: {
    initChart() {
      this.ecComponent = this.selectComponent('.ec-canvas');
      
      if (!this.ecComponent) return;

      this.ecComponent.init((canvas, width, height, dpr) => {
        // 创建图表
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(chart);

        // 避免接收完数据后只能显示一个饼图，将chart存入this，保证每个饼图能独立接收数据
        this.chart = chart;
        this.setData({ isLoaded: true });

        // 确保数据接收完成再绘制，依旧为了避免ECharts在没数据时就开始画图而导致无法正确渲染的问题
        if (this.data.chartData && this.data.chartData.length > 0) {
           this.setOption(this.data.chartData);
        }
        
        // 绑定点击事件
        this.chart.on('click', (params) => {
            this.handleChartClick(params);
        });

        return chart;
      });
    },

    setOption(data) {
      if (!this.chart) return;

      // 处理空数据情况
      if (!data || data.length === 0) {
        this.chart.clear();
        return;
      }

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          bottom: '0%', 
          left: 'center',
          icon: 'circle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { fontSize: 10 }
        },
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: ['35%', '55%'], 
          center: ['50%', '40%'], 
          data: data,
          avoidLabelOverlap: true,
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 10,
            color: '#666'
          },
          labelLine: {
            show: true,
            length: 5,
            length2: 5,
            smooth: true
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowColor: 'transparent'
            }
          }
        }]
      };

      this.chart.setOption(option, true);
    },

    handleChartClick(params) {
      if (params.componentType === 'series') {
        const dataIndex = params.dataIndex;
        if(this.data.chartData && this.data.chartData[dataIndex]){
             const categoryId = this.data.chartData[dataIndex].categoryId;
             this.triggerEvent('categoryTap', {
               categoryName: params.name,
               categoryId: categoryId
             });
        }
      }
    }
  }
});