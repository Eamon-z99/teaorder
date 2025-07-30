<template>
  <view class="statistics-container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">数据统计</text>
      <text class="page-subtitle">实时业务数据分析</text>
    </view>

    <!-- 统计卡片网格 -->
    <view class="stats-grid">
      <view class="stat-card primary" @click="refreshData">
        <view class="stat-icon">📊</view>
        <view class="stat-content">
          <text class="stat-value">{{ stats.userCount }}</text>
          <text class="stat-label">总用户数</text>
        </view>
      </view>
      
      <view class="stat-card success" @click="refreshData">
        <view class="stat-icon">📦</view>
        <view class="stat-content">
          <text class="stat-value">{{ stats.orderCount }}</text>
          <text class="stat-label">总订单数</text>
        </view>
      </view>
      
      <view class="stat-card warning" @click="refreshData">
        <view class="stat-icon">🍹</view>
        <view class="stat-content">
          <text class="stat-value">{{ stats.productCount }}</text>
          <text class="stat-label">总商品数</text>
        </view>
      </view>
      
      <view class="stat-card info" @click="refreshData">
        <view class="stat-icon">⏳</view>
        <view class="stat-content">
          <text class="stat-value">{{ stats.todayOrderCount }}</text>
          <text class="stat-label">今日订单</text>
        </view>
      </view>
      
      <view class="stat-card danger" @click="refreshData">
        <view class="stat-icon">💰</view>
        <view class="stat-content">
          <text class="stat-value">¥{{ stats.todaySales }}</text>
          <text class="stat-label">今日销售额</text>
        </view>
      </view>
      
      <view class="stat-card purple" @click="refreshData">
        <view class="stat-icon">📈</view>
        <view class="stat-content">
          <text class="stat-value">{{ stats.avgOrderValue }}</text>
          <text class="stat-label">平均订单金额</text>
        </view>
      </view>
    </view>

    <!-- 数据趋势图表 -->
    <view class="chart-section">
      <view class="section-header">
        <text class="section-title">销售趋势</text>
        <text class="section-subtitle">最近7天数据</text>
      </view>
      <view class="chart-container">
        <canvas canvas-id="trendChart" class="chart-canvas"></canvas>
      </view>
    </view>

    <!-- 分类统计 -->
    <view class="category-section">
      <view class="section-header">
        <text class="section-title">商品分类统计</text>
        <text class="section-subtitle">各分类销售情况</text>
      </view>
      <view class="category-list">
        <view class="category-item" v-for="(category, index) in categoryStats" :key="index">
          <view class="category-info">
            <text class="category-name">{{ category.name }}</text>
            <text class="category-count">{{ category.count }}件商品</text>
          </view>
          <view class="category-bar">
            <view class="bar-fill" :style="{ width: category.percentage + '%' }"></view>
          </view>
          <text class="category-percentage">{{ category.percentage }}%</text>
        </view>
      </view>
    </view>

    <!-- 刷新按钮 -->
    <view class="refresh-section">
      <button class="refresh-btn" @click="refreshData">
        <text class="refresh-icon">🔄</text>
        <text class="refresh-text">刷新数据</text>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        userCount: 0,
        orderCount: 0,
        productCount: 0,
        todayOrderCount: 0,
        todaySales: 0,
        avgOrderValue: 0
      },
      // 分类统计数据
      categoryStats: [],
      // 销售趋势数据
      trendData: []
    }
  },
  onLoad() {
    this.getStatistics();
    this.getCategoryStats();
    this.getTrendData();
  },
  methods: {
    async getStatistics() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/statistics',
          method: 'GET'
        });
        if (res.data.success) {
          const data = res.data.statistics;
          this.stats = {
            userCount: data.totalUsers || 0,
            orderCount: data.totalOrders || 0,
            productCount: data.totalProducts || 0,
            todayOrderCount: data.todayOrders || 0,
            todaySales: data.todaySales || 0,
            avgOrderValue: data.avgOrderValue || 0
          };
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
        uni.showToast({ title: '获取数据失败', icon: 'none' });
      }
    },
    async getCategoryStats() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/category-stats',
          method: 'GET'
        });
        if (res.data.success) {
          // 计算百分比
          const total = res.data.data.reduce((sum, item) => sum + (item.total_quantity || 0), 0);
          this.categoryStats = res.data.data.map(item => ({
            name: item.category || '未分类',
            count: item.total_quantity || 0,
            percentage: total ? Math.round((item.total_quantity || 0) / total * 100) : 0
          }));
        }
      } catch (error) {
        console.error('获取分类统计失败:', error);
      }
    },
    async getTrendData() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/analytics/sales-trend',
          method: 'GET'
        });
        if (res.data.success) {
          // 生成最近7天日期
          const days = [];
          const today = new Date();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push(d.toISOString().slice(0, 10));
          }
          // 补全数据
          const map = {};
          res.data.data.forEach(item => {
            map[item.date] = item;
          });
          this.trendData = days.map(date => ({
            date,
            total_sales: map[date]?.total_sales || 0,
            order_count: map[date]?.order_count || 0
          }));
          this.renderChart();
        }
      } catch (error) {
        console.error('获取销售趋势失败:', error);
      }
    },
    renderChart() {
      // 用真实趋势数据渲染折线图
      const ctx = uni.createCanvasContext('trendChart', this);
      const width = 300;
      const height = 200;
      const padding = 20;
      const data = this.trendData.map(item => item.total_sales || 0);
      if (!data.length) return;
      const maxValue = Math.max(...data);
      ctx.clearRect(0, 0, width, height);
      ctx.setStrokeStyle('#f0f0f0');
      for (let i = 0; i <= 4; i++) {
        const y = padding + (height - 2 * padding) * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      ctx.setStrokeStyle('#667eea');
      ctx.setLineWidth(3);
      ctx.beginPath();
      data.forEach((value, index) => {
        const x = padding + (width - 2 * padding) * index / (data.length - 1);
        const y = height - padding - (value / maxValue) * (height - 2 * padding);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setFillStyle('#667eea');
      data.forEach((value, index) => {
        const x = padding + (width - 2 * padding) * index / (data.length - 1);
        const y = height - padding - (value / maxValue) * (height - 2 * padding);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
      ctx.draw();
    },
    refreshData() {
      uni.showLoading({ title: '刷新中...' });
      Promise.all([
        this.getStatistics(),
        this.getCategoryStats(),
        this.getTrendData()
      ]).then(() => {
        uni.hideLoading();
        uni.showToast({ title: '数据已更新', icon: 'success' });
      });
    }
  }
}
</script>

<style scoped>
.statistics-container {
  padding: 20rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 40rpx 0;
}

.page-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10rpx;
}

.page-subtitle {
  display: block;
  font-size: 28rpx;
  color: #7f8c8d;
}

.stats-grid {
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
  transition: all 0.3s ease;
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-card.primary {
  border-left: 6rpx solid #667eea;
}

.stat-card.success {
  border-left: 6rpx solid #4ecdc4;
}

.stat-card.warning {
  border-left: 6rpx solid #ffb300;
}

.stat-card.info {
  border-left: 6rpx solid #45b7d1;
}

.stat-card.danger {
  border-left: 6rpx solid #ff6b6b;
}

.stat-card.purple {
  border-left: 6rpx solid #a55eea;
}

.stat-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.stat-content {
  flex: 1;
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

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8rpx;
}

.section-subtitle {
  display: block;
  font-size: 24rpx;
  color: #7f8c8d;
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

.category-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.category-count {
  font-size: 22rpx;
  color: #7f8c8d;
}

.category-bar {
  width: 120rpx;
  height: 8rpx;
  background: #e9ecef;
  border-radius: 4rpx;
  margin: 0 20rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4rpx;
  transition: width 0.3s ease;
}

.category-percentage {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 500;
  min-width: 60rpx;
  text-align: right;
}

.refresh-section {
  padding: 40rpx 0;
  text-align: center;
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  padding: 30rpx 60rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.refresh-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.refresh-text {
  font-size: 28rpx;
}
</style> 