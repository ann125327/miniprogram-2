// pie-chart.js
// 1. 【修正路径】这里恢复成你原来正确的相对路径
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
      // 2. 【增加延时】给视图一点渲染时间，防止宽/高为0导致图表画不出来
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
      
      // 安全检查：防止组件还没加载完
      if (!this.ecComponent) return;

      this.ecComponent.init((canvas, width, height, dpr) => {
        // 3. 创建图表实例
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        canvas.setChart(chart);

        // 4. 【关键】将 chart 存入 this，保证每个组件实例独立
        this.chart = chart;
        this.setData({ isLoaded: true });

        // 如果此时已有数据，立即绘制
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
        // 安全取值
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