<template>
  <view class="analytics-container">
    <!-- 顶部统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card" v-for="(stat, index) in overviewStats" :key="index">
        <view class="stat-icon">{{ stat.icon }}</view>
        <view class="stat-content">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <!-- 销售趋势图 -->
    <view class="chart-section">
      <view class="section-title">销售趋势（最近7天）</view>
      <view class="chart-container">
        <canvas canvas-id="salesChart" class="chart-canvas"></canvas>
      </view>
    </view>

    <!-- 商品销售排行 -->
    <view class="chart-section">
      <view class="section-title">商品销售排行</view>
      <view class="chart-container">
        <canvas canvas-id="productChart" class="chart-canvas"></canvas>
      </view>
    </view>

    <!-- 分类销售统计 -->
    <view class="chart-section">
      <view class="section-title">分类销售统计</view>
      <view class="chart-container">
        <canvas canvas-id="categoryChart" class="chart-canvas"></canvas>
      </view>
    </view>

    <!-- 订单状态分布 -->
    <view class="chart-section">
      <view class="section-title">订单状态分布</view>
      <view class="chart-container">
        <canvas canvas-id="orderStatusChart" class="chart-canvas"></canvas>
      </view>
    </view>

    <!-- 用户活跃度 -->
    <view class="chart-section">
      <view class="section-title">用户活跃度（最近30天）</view>
      <view class="chart-container">
        <canvas canvas-id="userActivityChart" class="chart-canvas"></canvas>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      overviewStats: [
        { label: '今日订单', value: 0, icon: '📊' },
        { label: '今日销售额', value: '¥0', icon: '💰' },
        { label: '总用户数', value: 0, icon: '👥' },
        { label: '总商品数', value: 0, icon: '🍹' }
      ],
      salesData: [],
      productData: [],
      categoryData: [],
      orderStatusData: [],
      userActivityData: []
    }
  },
  onLoad() {
    this.loadAllData();
  },
  methods: {
    async loadAllData() {
      await Promise.all([
        this.loadOverviewStats(),
        this.loadSalesTrend(),
        this.loadProductRanking(),
        this.loadCategoryStats(),
        this.loadOrderStatus(),
        this.loadUserActivity()
      ]);
    },

    // 加载概览统计
    async loadOverviewStats() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/statistics',
          method: 'GET'
        });
        if (res.data.success) {
          const stats = res.data.statistics;
          this.overviewStats[0].value = stats.todayOrders;
          this.overviewStats[1].value = `¥${stats.todaySales}`;
          this.overviewStats[2].value = stats.totalUsers;
          this.overviewStats[3].value = stats.totalProducts;
        }
      } catch (error) {
        console.error('加载概览统计失败:', error);
      }
    },

    // 加载销售趋势
    async loadSalesTrend() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/sales-trend',
          method: 'GET'
        });
        if (res.data.success) {
          this.salesData = res.data.data;
          this.renderSalesChart();
        }
      } catch (error) {
        console.error('加载销售趋势失败:', error);
      }
    },

    // 加载商品排行
    async loadProductRanking() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/product-ranking',
          method: 'GET'
        });
        if (res.data.success) {
          this.productData = res.data.data;
          this.renderProductChart();
        }
      } catch (error) {
        console.error('加载商品排行失败:', error);
      }
    },

    // 加载分类统计
    async loadCategoryStats() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/category-stats',
          method: 'GET'
        });
        if (res.data.success) {
          this.categoryData = res.data.data;
          this.renderCategoryChart();
        }
      } catch (error) {
        console.error('加载分类统计失败:', error);
      }
    },

    // 加载订单状态
    async loadOrderStatus() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/order-status',
          method: 'GET'
        });
        if (res.data.success) {
          this.orderStatusData = res.data.data;
          this.renderOrderStatusChart();
        }
      } catch (error) {
        console.error('加载订单状态失败:', error);
      }
    },

    // 加载用户活跃度
    async loadUserActivity() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/user-activity',
          method: 'GET'
        });
        if (res.data.success) {
          this.userActivityData = res.data.data;
          this.renderUserActivityChart();
        }
      } catch (error) {
        console.error('加载用户活跃度失败:', error);
      }
    },

    // 渲染销售趋势图
    renderSalesChart() {
      const ctx = uni.createCanvasContext('salesChart', this);
      const dates = this.salesData.map(item => item.date);
      const sales = this.salesData.map(item => item.total_sales);
      const orders = this.salesData.map(item => item.order_count);

      // 简单的折线图实现
      const width = 300;
      const height = 200;
      const padding = 20;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 绘制坐标轴
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // 绘制销售数据
      if (sales.length > 0) {
        const maxSales = Math.max(...sales);
        const stepX = (width - 2 * padding) / (sales.length - 1);
        
        ctx.beginPath();
        ctx.setStrokeStyle('#ff6b6b');
        sales.forEach((value, index) => {
          const x = padding + index * stepX;
          const y = height - padding - (value / maxSales) * (height - 2 * padding);
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      ctx.draw();
    },

    // 渲染商品排行图
    renderProductChart() {
      const ctx = uni.createCanvasContext('productChart', this);
      const names = this.productData.map(item => item.name);
      const revenues = this.productData.map(item => item.total_revenue);

      // 简单的柱状图实现
      const width = 300;
      const height = 200;
      const padding = 40;

      ctx.clearRect(0, 0, width, height);

      if (revenues.length > 0) {
        const maxRevenue = Math.max(...revenues);
        const barWidth = (width - 2 * padding) / revenues.length;
        
        revenues.forEach((value, index) => {
          const barHeight = (value / maxRevenue) * (height - 2 * padding);
          const x = padding + index * barWidth;
          const y = height - padding - barHeight;
          
          ctx.setFillStyle('#4ecdc4');
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
      }

      ctx.draw();
    },

    // 渲染分类统计图
    renderCategoryChart() {
      const ctx = uni.createCanvasContext('categoryChart', this);
      const categories = this.categoryData.map(item => item.category);
      const revenues = this.categoryData.map(item => item.total_revenue);

      // 简单的饼图实现
      const centerX = 150;
      const centerY = 100;
      const radius = 60;

      ctx.clearRect(0, 0, 300, 200);

      if (revenues.length > 0) {
        const total = revenues.reduce((sum, value) => sum + value, 0);
        let startAngle = 0;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

        revenues.forEach((value, index) => {
          const angle = (value / total) * 2 * Math.PI;
          
          ctx.beginPath();
          ctx.setFillStyle(colors[index % colors.length]);
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
          ctx.closePath();
          ctx.fill();
          
          startAngle += angle;
        });
      }

      ctx.draw();
    },

    // 渲染订单状态图
    renderOrderStatusChart() {
      const ctx = uni.createCanvasContext('orderStatusChart', this);
      const statuses = this.orderStatusData.map(item => item.status);
      const counts = this.orderStatusData.map(item => item.count);

      // 简单的柱状图实现
      const width = 300;
      const height = 200;
      const padding = 40;

      ctx.clearRect(0, 0, width, height);

      if (counts.length > 0) {
        const maxCount = Math.max(...counts);
        const barWidth = (width - 2 * padding) / counts.length;
        
        counts.forEach((value, index) => {
          const barHeight = (value / maxCount) * (height - 2 * padding);
          const x = padding + index * barWidth;
          const y = height - padding - barHeight;
          
          ctx.setFillStyle('#ff9ff3');
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        });
      }

      ctx.draw();
    },

    // 渲染用户活跃度图
    renderUserActivityChart() {
      const ctx = uni.createCanvasContext('userActivityChart', this);
      const dates = this.userActivityData.map(item => item.date);
      const users = this.userActivityData.map(item => item.active_users);

      // 简单的折线图实现
      const width = 300;
      const height = 200;
      const padding = 20;

      ctx.clearRect(0, 0, width, height);

      // 绘制坐标轴
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();

      // 绘制用户数据
      if (users.length > 0) {
        const maxUsers = Math.max(...users);
        const stepX = (width - 2 * padding) / (users.length - 1);
        
        ctx.beginPath();
        ctx.setStrokeStyle('#54a0ff');
        users.forEach((value, index) => {
          const x = padding + index * stepX;
          const y = height - padding - (value / maxUsers) * (height - 2 * padding);
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      ctx.draw();
    }
  }
}
</script>

<style scoped>
.analytics-container {
  padding: 20rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.stats-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.stat-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #7f8c8d;
}

.chart-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20rpx;
}

.chart-container {
  width: 100%;
  height: 400rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-canvas {
  width: 600rpx;
  height: 400rpx;
}
</style> 