<template>
  <view class="dashboard-container">
    <!-- 顶部欢迎区域 -->
    <view class="welcome-section">
      <view class="admin-info">
        <image :src="adminInfo.avatar || '/static/images/default-avatar.png'" class="avatar" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ adminInfo.nickname || adminInfo.username || '管理员' }}</text>
          <text class="role">超级管理员</text>
        </view>
      </view>
      <view class="logout-btn" @click="logout">
        <text class="logout-text">退出</text>
      </view>
    </view>

    <!-- 实时统计卡片 -->
    <view class="stats-section">
      <view class="section-title">实时数据</view>
      <view class="stats-grid">
        <view class="stat-card" v-for="(stat, index) in overviewStats" :key="index">
          <view class="stat-icon">{{ stat.icon }}</view>
          <view class="stat-content">
            <text class="stat-number">{{ stat.value }}</text>
            <text class="stat-label">{{ stat.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="section-title">管理功能</view>
      <view class="menu-grid">
        <view class="menu-item" @click="goToOrders">
          <view class="menu-icon">📋</view>
          <text class="menu-text">订单管理</text>
          <text class="menu-desc">查看和处理订单</text>
        </view>
        <view class="menu-item" @click="goToProducts">
          <view class="menu-icon">🍹</view>
          <text class="menu-text">商品管理</text>
          <text class="menu-desc">管理商品信息</text>
        </view>
        <view class="menu-item" @click="goToCategories">
          <view class="menu-icon">📂</view>
          <text class="menu-text">分类管理</text>
          <text class="menu-desc">管理商品分类</text>
        </view>
        <view class="menu-item" @click="goToUsers">
          <view class="menu-icon">👥</view>
          <text class="menu-text">用户管理</text>
          <text class="menu-desc">管理用户账户</text>
        </view>
        <view class="menu-item" @click="goToAnalytics">
          <view class="menu-icon">📊</view>
          <text class="menu-text">数据分析</text>
          <text class="menu-desc">查看统计图表</text>
        </view>
        <view class="menu-item" @click="goToCoupons">
          <view class="menu-icon">🎫</view>
          <text class="menu-text">优惠券管理</text>
          <text class="menu-desc">管理优惠券活动</text>
        </view>
        <view class="menu-item" @click="goToSettings">
          <view class="menu-icon">⚙️</view>
          <text class="menu-text">系统设置</text>
          <text class="menu-desc">配置系统参数</text>
        </view>
      </view>
    </view>

    <!-- 最近活动 -->
    <view class="recent-activity">
      <view class="section-title">最近活动</view>
      <view class="activity-list">
        <view class="activity-item" v-for="(activity, index) in recentActivities" :key="index">
          <view class="activity-icon">{{ activity.icon }}</view>
          <view class="activity-content">
            <text class="activity-text">{{ activity.text }}</text>
            <text class="activity-time">{{ activity.time }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      adminInfo: {},
      overviewStats: [
        { label: '今日订单', value: 0, icon: '📊' },
        { label: '今日销售额', value: '¥0', icon: '💰' },
        { label: '待处理订单', value: 0, icon: '⏳' },
        { label: '总用户数', value: 0, icon: '👥' }
      ],
      recentActivities: [
        { text: '新订单 #TEA123456', time: '2分钟前', icon: '📋' },
        { text: '用户注册: 张三', time: '5分钟前', icon: '👤' },
        { text: '商品上架: 新品奶茶', time: '10分钟前', icon: '🍹' },
        { text: '订单完成: #TEA123455', time: '15分钟前', icon: '✅' }
      ]
    }
  },
  onLoad() {
    this.loadAdminInfo();
    this.loadStatistics();
    this.loadRecentActivities();
  },
  methods: {
    // 加载管理员信息
    loadAdminInfo() {
      const adminInfo = uni.getStorageSync('adminInfo');
      if (adminInfo) {
        this.adminInfo = adminInfo;
      }
    },
    
    // 加载统计数据
    async loadStatistics() {
      try {
        console.log('Making request to statistics API...'); // 调试信息
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/statistics',
          method: 'GET',
        });
        
        console.log('Response:', res); // 调试信息
        
        if (res.data.success) {
          const stats = res.data.statistics;
          this.overviewStats[0].value = stats.todayOrders;
          this.overviewStats[1].value = `¥${stats.todaySales}`;
          this.overviewStats[2].value = stats.pendingOrders;
          this.overviewStats[3].value = stats.totalUsers;
        } else {
          console.error('API Error:', res.data);
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
      }
    },

    // 加载最近活动
    async loadRecentActivities() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/recent-activities',
          method: 'GET'
        });
        if (res.data && res.data.success) {
          this.recentActivities = res.data.activities.map(item => ({
            ...item,
            // 格式化时间（如“2分钟前”）
            time: this.formatTime(item.time)
          }));
        }
      } catch (error) {
        console.error('获取最近活动失败:', error);
      }
    },
    // 时间格式化辅助方法
    formatTime(time) {
      const t = new Date(time);
      const now = new Date();
      const diff = Math.floor((now - t) / 1000);
      if (diff < 60) return `${diff}秒前`;
      if (diff < 3600) return `${Math.floor(diff/60)}分钟前`;
      if (diff < 86400) return `${Math.floor(diff/3600)}小时前`;
      return t.toLocaleString();
    },

    // 退出登录
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync();
            uni.redirectTo({ url: '/pkg_user/login/login' });
          }
        }
      });
    },

    // 跳转到订单管理
    goToOrders() {
      uni.navigateTo({ url: '/pkg_admin/orders/orders' });
    },

    // 跳转到商品管理
    goToProducts() {
      uni.navigateTo({ url: '/pkg_admin/products/products' });
    },

    // 跳转到分类管理
    goToCategories() {
      uni.navigateTo({ url: '/pkg_admin/categories/categories' });
    },

    // 跳转到用户管理
    goToUsers() {
      uni.navigateTo({ url: '/pkg_admin/users/users' });
    },

    // 跳转到数据分析
    goToAnalytics() {
      uni.navigateTo({ url: '/pkg_admin/analytics/analytics' });
    },

    // 跳转到优惠券管理
    goToCoupons() {
      uni.navigateTo({ url: '/pkg_admin/coupons/coupons' });
    },

    // 跳转到系统设置
    goToSettings() {
      uni.navigateTo({ url: '/pkg_admin/settings/settings' });
    },

    // 查看最新订单
    goToNewOrder() {
      uni.navigateTo({ url: '/pkg_admin/orders/orders?status=pending' });
    },

    // 添加商品
    goToAddProduct() {
      uni.navigateTo({ url: '/pkg_admin/products/add' });
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20rpx;
}

.welcome-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.admin-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.role {
  font-size: 24rpx;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  align-self: flex-start;
}

.logout-btn {
  padding: 16rpx 24rpx;
  background: #ff4757;
  border-radius: 12rpx;
}

.logout-text {
  color: #fff;
  font-size: 28rpx;
}

.stats-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  padding: 30rpx;
  display: flex;
  align-items: center;
  color: #fff;
}

.stat-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.menu-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.menu-item {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 30rpx 20rpx;
  text-align: center;
  transition: all 0.3s ease;
}

.menu-item:active {
  background: #e9ecef;
  transform: scale(0.98);
}

.menu-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
}

.menu-desc {
  font-size: 22rpx;
  color: #7f8c8d;
  display: block;
}

.recent-activity {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.activity-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.activity-time {
  font-size: 22rpx;
  color: #7f8c8d;
}
</style> 