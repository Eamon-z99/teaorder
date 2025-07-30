<template>
  <view class="user-detail-container">
    <!-- 用户基本信息 -->
    <view class="user-basic-info">
      <view class="avatar-section">
        <image :src="userInfo.avatar || '/static/images/default-avatar.png'" class="user-avatar" mode="aspectFill" />
        <view class="user-info-text">
          <text class="user-name">{{ userInfo.nickname || '匿名用户' }}</text>
          <text class="user-phone">{{ userInfo.phone || '未设置' }}</text>
        </view>
      </view>
    </view>

    <!-- 用户详细信息 -->
    <view class="user-detail-list">
      <view class="detail-item">
        <text class="detail-label">积分</text>
        <text class="detail-value">{{ userInfo.points || 0 }} 分</text>
      </view>
      
      <view class="detail-item">
        <text class="detail-label">个性签名</text>
        <text class="detail-value">{{ userInfo.signature || '未设置' }}</text>
      </view>
      
      <view class="detail-item">
        <text class="detail-label">注册时间</text>
        <text class="detail-value">{{ formatDate(userInfo.created_at) }}</text>
      </view>
      
      <view class="detail-item">
        <text class="detail-label">最后登录</text>
        <text class="detail-value">{{ formatDate(userInfo.last_login) }}</text>
      </view>
      
      <view class="detail-item">
        <text class="detail-label">用户ID</text>
        <text class="detail-value">{{ userInfo.id }}</text>
      </view>
    </view>

    <!-- 用户统计信息 -->
    <view class="user-stats">
      <view class="stats-title">用户统计</view>
      <view class="stats-grid">
        <view class="stats-item">
          <text class="stats-number">{{ orderStats.total || 0 }}</text>
          <text class="stats-label">总订单</text>
        </view>
        <view class="stats-item">
          <text class="stats-number">{{ orderStats.completed || 0 }}</text>
          <text class="stats-label">已完成</text>
        </view>
        <view class="stats-item">
          <text class="stats-number">{{ orderStats.totalAmount || 0 }}</text>
          <text class="stats-label">消费金额</text>
        </view>
        <view class="stats-item">
          <text class="stats-number">{{ couponStats.total || 0 }}</text>
          <text class="stats-label">优惠券</text>
        </view>
      </view>
    </view>

    <!-- 点单历史记录 -->
    <view class="order-history">
      <view class="history-header">
        <text class="history-title">点单历史记录</text>
        <text class="history-count">共 {{ (orders && orders.length) || 0 }} 条记录</text>
      </view>
      
      <view v-if="(!orders || orders.length === 0) && !loading" class="empty-orders">
        <text class="empty-text">暂无订单记录</text>
      </view>
      
      <view v-else-if="orders && orders.length > 0" class="orders-list">
        <view 
          v-for="order in orders" 
          :key="order.id" 
          class="order-item"
          @click="viewOrderDetail(order.id)"
        >
          <view class="order-header">
            <text class="order-id">订单号：{{ order.order_no || order.order_number }}</text>
            <text class="order-status" :class="{
              'status-pending': order.status === 'pending',
              'status-paid': order.status === 'paid',
              'status-preparing': order.status === 'preparing',
              'status-ready': order.status === 'ready',
              'status-delivering': order.status === 'delivering',
              'status-completed': order.status === 'completed',
              'status-cancelled': order.status === 'cancelled'
            }">
              {{ getStatusText(order.status) }}
            </text>
          </view>
          
          <view class="order-content">
            <view class="order-products">
              <text class="product-text">{{ getProductSummary(order.products) }}</text>
            </view>
            <view class="order-info">
              <text class="order-time">{{ formatDate(order.created_at) }}</text>
              <text class="order-amount">¥{{ order.total_amount }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <!-- 删除操作按钮 -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      userId: null,
      userInfo: {},
      orderStats: {},
      couponStats: {},
      orders: [],
      loading: false
    };
  },
  onLoad(options) {
    if (options.userId) {
      this.userId = options.userId;
      this.loadUserDetail();
      this.loadUserStats();
      this.loadUserOrders();
    }
  },
  mounted() {
    // 确保数据正确初始化
  },
  methods: {
    // 加载用户详情
    async loadUserDetail() {
      try {
        const res = await uni.request({
          url: `http://localhost:3000/api/admin/users/${this.userId}`,
          method: 'GET'
        });
        
        if (res.data && res.data.success) {
          this.userInfo = res.data.user;
        } else {
          uni.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取用户详情失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    // 加载用户统计信息
    async loadUserStats() {
      try {
        // 获取订单统计
        const orderRes = await uni.request({
          url: `http://localhost:3000/api/admin/users/${this.userId}/orders/stats`,
          method: 'GET'
        });
        
        if (orderRes.data && orderRes.data.success) {
          this.orderStats = orderRes.data.stats;
        }
        
        // 获取优惠券统计
        const couponRes = await uni.request({
          url: `http://localhost:3000/api/admin/users/${this.userId}/coupons/stats`,
          method: 'GET'
        });
        
        if (couponRes.data && couponRes.data.success) {
          this.couponStats = couponRes.data.stats;
        }
      } catch (error) {
        console.error('获取用户统计失败:', error);
      }
    },
    
    // 加载用户订单历史
    async loadUserOrders() {
      try {
        this.loading = true;
        
        const res = await uni.request({
          url: `http://localhost:3000/api/admin/users/${this.userId}/orders`,
          method: 'GET'
        });
        
        if (res.data && res.data.success) {
          // 确保数据是数组
          const ordersData = Array.isArray(res.data.orders) ? res.data.orders : [];
          this.orders = ordersData;
          
          // 强制更新视图
          this.$forceUpdate();
        } else {
          console.error('获取订单历史失败:', res.data);
          this.orders = [];
          uni.showToast({ title: '获取订单历史失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取用户订单失败:', error);
        this.orders = [];
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '未知';
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'pending': '待支付',
        'paid': '已支付',
        'preparing': '制作中',
        'ready': '待取餐',
        'delivering': '配送中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || '未知状态';
    },
    
    // 获取商品摘要
    getProductSummary(products) {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return '暂无商品信息';
      }
      const productNames = products.map(p => p.name || p.product_name).filter(name => name);
      return productNames.slice(0, 3).join('、') + (productNames.length > 3 ? '...' : '');
    },
    
    // 查看订单详情
    viewOrderDetail(orderId) {
      uni.navigateTo({
        url: `/pkg_admin/orders/detail?orderId=${orderId}`
      });
    }
  }
};
</script>

<style scoped>
.user-detail-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20rpx;
}

.user-basic-info {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.user-info-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #212529;
}

.user-phone {
  font-size: 28rpx;
  color: #6c757d;
}

.user-detail-list {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f1f3f4;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 28rpx;
  color: #6c757d;
  font-weight: 500;
}

.detail-value {
  font-size: 28rpx;
  color: #212529;
  max-width: 60%;
  text-align: right;
}

.user-stats {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.stats-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #212529;
  margin-bottom: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.stats-number {
  font-size: 36rpx;
  font-weight: 600;
  color: #007aff;
  margin-bottom: 8rpx;
}

.stats-label {
  font-size: 24rpx;
  color: #6c757d;
}

.order-history {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #f1f3f4;
}

.history-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #212529;
}

.history-count {
  font-size: 24rpx;
  color: #6c757d;
}

.empty-orders {
  padding: 80rpx 32rpx;
  text-align: center;
}

.empty-text {
  font-size: 28rpx;
  color: #6c757d;
}

.orders-list {
  padding: 0 32rpx 32rpx;
}

.order-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f3f4;
  cursor: pointer;
}

.order-item:last-child {
  border-bottom: none;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-id {
  font-size: 26rpx;
  color: #6c757d;
}

.order-status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  color: #fff;
  white-space: nowrap;
  display: inline-block;
  min-width: 80rpx;
  text-align: center;
  line-height: 1.2;
}

.status-pending {
  background-color: #ff9500;
}

.status-paid {
  background-color: #007aff;
}

.status-preparing {
  background-color: #ff3b30;
}

.status-ready {
  background-color: #34c759;
}

.status-delivering {
  background-color: #5856d6;
}

.status-completed {
  background-color: #34c759;
}

.status-cancelled {
  background-color: #8e8e93;
}

.order-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.order-products {
  flex: 1;
}

.product-text {
  font-size: 28rpx;
  color: #212529;
  line-height: 1.4;
}

.order-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.order-time {
  font-size: 24rpx;
  color: #6c757d;
}

.order-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: #dc3545;
}
</style> 