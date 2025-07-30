<template>
  <view class="orders-container">
    <!-- 状态筛选栏 -->
    <scroll-view class="order-status-tabs-scroll" scroll-x>
      <view class="order-status-tabs">
        <view v-for="tab in statusTabs" :key="tab.value" :class="['order-status-tab', currentStatus === tab.value ? 'active' : '']" @click="filterByStatus(tab.value)">{{ tab.label }}</view>
      </view>
    </scroll-view>
    <!-- 批量操作栏 -->
    <view v-if="orders.length && currentStatus !== '' && currentStatus !== 'completed'" class="batch-bar-fixed">
      <view class="batch-left">
        <checkbox :checked="isAllSelected" @click.stop="toggleSelectAll" class="batch-all-checkbox" />
        <text class="batch-all-text" @click.stop="toggleSelectAll">全选</text>
      </view>
      <button class="batch-btn" :disabled="!selectedOrderIds.length" @click="batchDeliver">{{ getBatchButtonText() }}</button>
    </view>
    <!-- 订单列表 -->
    <scroll-view 
      class="orders-list" 
      :class="{ 'no-batch-bar': !(orders.length && currentStatus !== '' && currentStatus !== 'completed') }"
      scroll-y
      @scrolltolower="onScrollToLower"
      :lower-threshold="50"
      :style="{ height: 'calc(100vh - 200rpx)' }"
    >
      <view v-for="order in orders" :key="order.id" class="order-item">
        <checkbox v-if="currentStatus !== '' && currentStatus !== 'completed'" :value="order.id" :checked="selectedOrderIds.includes(order.id)" @click.stop="toggleSelectOrder(order.id)" class="order-checkbox" />
        <view class="order-content" @click="viewOrderDetail(order.id)">
          <view class="order-header">
            <text class="order-id">订单号：{{ order.order_no }}</text>
            <view :class="['order-status', getStatusClass(order.status)]">{{ getStatusText(order.status) }}</view>
          </view>
          <view class="order-info">
            <text class="order-user">{{ order.user_nickname || order.user_phone }}</text>
            <text class="order-type">{{ order.delivery_type === 'delivery' ? '配送' : '自取' }}</text>
          </view>
          <view class="order-amount">订单金额：¥{{ order.total_amount }}</view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading && orders.length > 0" class="loading-more">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 暂无订单状态 -->
      <view v-if="orders.length === 0 && !loading" class="empty-state">
        <view class="empty-icon">📋</view>
        <text class="empty-text">暂无订单</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orders: [],
      currentStatus: '',
      selectedOrderIds: [],
      statusTabs: [
        { label: '全部', value: '' },
        { label: '待付款', value: 'pending' },
        { label: '已付款', value: 'paid' },
        { label: '制作中', value: 'preparing' },
        { label: '待取餐', value: 'ready' },
        { label: '配送中', value: 'delivering' },
        { label: '已完成', value: 'completed' }
      ],
      currentPage: 1,
      hasMore: true,
      loading: false
    };
  },
  computed: {
    isAllSelected() {
      return this.orders.length > 0 && this.selectedOrderIds.length === this.orders.length;
    }
  },
  onLoad(options) {
    if (options.status) {
      this.currentStatus = options.status;
    }
    this.loadOrders();
  },
  methods: {
    // 加载订单列表
    loadOrders(reset = true) {
      if (reset) {
        this.orders = [];
        this.currentPage = 1;
        this.hasMore = true;
      }
      
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      
      let url = `http://localhost:3000/api/admin/orders?page=${this.currentPage}&limit=10`;
      if (this.currentStatus) {
        url += `&status=${this.currentStatus}`;
      }
      
      uni.request({
        url: url,
        method: 'GET',
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.data && res.data.success) {
            const newOrders = res.data.orders;
            if (reset) {
              this.orders = newOrders;
            } else {
              this.orders = [...this.orders, ...newOrders];
            }
            
            this.hasMore = newOrders.length === 10;
            this.currentPage++;
          }
        },
        fail: () => {
          uni.showToast({ title: '加载订单失败', icon: 'none' });
        },
        complete: () => {
          this.loading = false;
        }
      });
    },
    
    // 筛选订单状态
    filterByStatus(status) {
      this.currentStatus = status;
      this.selectedOrderIds = [];
      this.loadOrders(true);
    },
    
    // 批量选择订单
    onBatchSelect(e) {
      this.selectedOrderIds = e.detail.value.map(id => Number(id));
    },

    // 批量操作
    async batchDeliver() {
      if (!this.selectedOrderIds.length) return;
      const action = this.getBatchButtonText();
      
      // 先隐藏可能存在的loading
      uni.hideLoading();
      
      try {
        uni.showLoading({ title: action + '...' });
        
        let url = 'http://localhost:3000/api/admin/orders/batch-deliver';
        let status = 'delivering';
        if (this.currentStatus === 'pending') {
          url = 'http://localhost:3000/api/admin/orders/batch-pay';
          status = 'paid';
        } else if (this.currentStatus === 'delivering') {
          url = 'http://localhost:3000/api/admin/orders/batch-complete';
          status = 'completed';
        } else if (this.currentStatus === 'paid') {
          url = 'http://localhost:3000/api/admin/orders/batch-prepare';
          status = 'preparing';
        } else if (this.currentStatus === 'preparing') {
          url = 'http://localhost:3000/api/admin/orders/batch-ready';
          status = 'ready';
        }
        
        const result = await new Promise((resolve, reject) => {
          uni.request({
            url: url,
            method: 'PUT',
            header: {
              'Content-Type': 'application/json'
            },
            data: { orderIds: this.selectedOrderIds },
            success: (res) => {
              resolve(res);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
        
        uni.hideLoading();
        
        if (result.data && result.data.success) {
          uni.showToast({ title: action + '成功', icon: 'success' });
          this.selectedOrderIds = [];
          this.loadOrders(true);
        } else {
          uni.showToast({ title: result.data?.message || action + '失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('批量操作失败:', error);
        uni.showToast({ title: action + '失败', icon: 'none' });
      }
    },
    
    // 更新订单状态
    updateOrderStatus(orderId, status) {
      uni.request({
        url: `http://localhost:3000/api/admin/orders/${orderId}/status`,
        method: 'PUT',
        header: {
          'Content-Type': 'application/json'
        },
        data: { status },
        success: (res) => {
          if (res.data && res.data.success) {
            uni.showToast({ title: '状态更新成功', icon: 'success' });
            // 重新加载订单列表
            this.loadOrders(true);
          } else {
            uni.showToast({ title: res.data.message || '更新失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    
    // 查看订单详情
    viewOrderDetail(orderId) {
      uni.navigateTo({ url: `/pkg_admin/orders/detail?orderId=${orderId}` });
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'pending': '待付款',
        'paid': '已付款',
        'preparing': '制作中',
        'ready': '待取餐',
        'delivering': '配送中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      const classMap = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'preparing': 'status-preparing',
        'ready': 'status-ready',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
      };
      return classMap[status] || '';
    },
    
    // 格式化时间
    formatTime(timeStr) {
      const date = new Date(timeStr);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return date.toLocaleDateString();
      }
    },
    toggleSelectOrder(orderId) {
      const idx = this.selectedOrderIds.indexOf(orderId);
      if (idx > -1) {
        this.selectedOrderIds.splice(idx, 1);
      } else {
        this.selectedOrderIds.push(orderId);
      }
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedOrderIds = [];
      } else {
        this.selectedOrderIds = this.orders.map(o => o.id);
      }
    },
    getBatchButtonText() {
      if (this.currentStatus === 'pending') return '批量确认付款';
      if (this.currentStatus === 'ready') return '批量配送中';
      if (this.currentStatus === 'delivering') return '批量完成';
      if (this.currentStatus === 'paid') return '批量制作中';
      if (this.currentStatus === 'preparing') return '批量待取餐';
      return '批量操作';
    },
    getActionButtonText(status) {
      if (status === 'pending') return '确认付款';
      if (status === 'paid') return '开始制作';
      if (status === 'preparing') return '制作完成';
      if (status === 'ready') return '确认完成';
      if (status === 'delivering') return '批量完成';
      if (status === 'completed') return '批量完成';
      if (status === 'cancelled') return '取消订单';
      return '操作';
    },
    getNextStatus(currentStatus) {
      if (currentStatus === 'pending') return 'paid';
      if (currentStatus === 'paid') return 'preparing';
      if (currentStatus === 'preparing') return 'ready';
      if (currentStatus === 'ready') return 'completed';
      if (currentStatus === 'delivering') return 'completed';
      if (currentStatus === 'completed') return 'completed';
      if (currentStatus === 'cancelled') return 'cancelled';
      return currentStatus;
    },
    onScrollToLower() {
      console.log('滑动到底部，触发加载更多');
      if (this.loading || !this.hasMore) {
        console.log('正在加载或没有更多数据，跳过');
        return;
      }
      console.log('开始加载更多订单');
      this.loadOrders(false);
    }
  }
};
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-top: 120rpx;
}

.order-status-tabs-scroll {
  width: 100vw;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1rpx solid #e9ecef;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.order-status-tabs {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx 0 24rpx;
}

.order-status-tab {
  font-size: 26rpx;
  color: #6c757d;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12rpx;
  white-space: nowrap;
  border: 1rpx solid transparent;
}

.order-status-tab.active {
  background: #007aff;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
}

.batch-bar-fixed {
  position: fixed;
  top: 80rpx;
  left: 0;
  right: 0;
  z-index: 99;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #e9ecef;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.08);
}

.batch-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.batch-all-checkbox {
  margin-right: 1rpx;
}

.batch-all-text {
  font-size: 28rpx;
  color: #495057;
  font-weight: 500;
}

.batch-btn {
  margin-right: 10rpx;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.2);
}

.batch-btn:disabled {
  background: #dee2e6;
  color: #adb5bd;
  box-shadow: none;
}

.orders-list {
  padding: 24rpx;
  padding-top: 130rpx;
  height: calc(100vh - 200rpx);
  overflow-y: auto;
}

.orders-list.no-batch-bar {
  padding-top: 30rpx;
}

.order-item {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  transition: all 0.3s ease;
  border: 1rpx solid #f1f3f4;
}

.order-item:hover {
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  transform: translateY(-2rpx);
}

.order-checkbox {
  margin-top: 8rpx;
}

.order-content {
  flex: 1;
  position: relative;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.order-id {
  font-size: 28rpx;
  font-weight: 600;
  color: #212529;
}

.order-status {
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  text-align: center;
  min-width: 80rpx;
}

.order-status.pending { 
  background: #fff3cd; 
  color: #856404; 
  border: 1rpx solid #ffeaa7;
}

.order-status.paid { 
  background: #d1ecf1; 
  color: #0c5460; 
  border: 1rpx solid #bee5eb;
}

.order-status.preparing { 
  background: #f8d7da; 
  color: #721c24; 
  border: 1rpx solid #f5c6cb;
}

.order-status.ready { 
  background: #d4edda; 
  color: #155724; 
  border: 1rpx solid #c3e6cb;
}

.order-status.delivering { 
  background: #e2e3e5; 
  color: #383d41; 
  border: 1rpx solid #d6d8db;
}

.order-status.completed { 
  background: #d1ecf1; 
  color: #0c5460; 
  border: 1rpx solid #bee5eb;
}

.order-info {
  display: flex;
  gap: 24rpx;
  margin-bottom: 12rpx;
}

.order-user, .order-type {
  font-size: 26rpx;
  color: #6c757d;
  font-weight: 400;
}

.order-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  white-space: nowrap;
  display: inline-block;
  min-width: 60rpx;
  text-align: center;
  line-height: 1.2;
}

.order-amount {
  font-size: 30rpx;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 20rpx;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.action-btn {
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.2);
}

.action-btn:hover {
  background: #0056b3;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.action-btn.detail {
  background: #6c757d;
  box-shadow: 0 2rpx 8rpx rgba(108, 117, 125, 0.2);
}

.action-btn.detail:hover {
  background: #545b62;
  box-shadow: 0 4rpx 12rpx rgba(108, 117, 125, 0.3);
}

.action-btn.cancel {
  background: #dc3545;
  box-shadow: 0 2rpx 8rpx rgba(220, 53, 69, 0.2);
}

.action-btn.cancel:hover {
  background: #c82333;
  box-shadow: 0 4rpx 12rpx rgba(220, 53, 69, 0.3);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 120rpx 24rpx;
  color: #6c757d;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 32rpx;
  color: #495057;
  font-weight: 500;
  margin-bottom: 12rpx;
  display: block;
}

/* 加载状态 */
.loading-more {
  text-align: center;
  padding: 40rpx;
  color: #6c757d;
}

.loading-text {
  font-size: 26rpx;
  color: #adb5bd;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .order-status-tabs {
    gap: 8rpx;
    padding: 12rpx 16rpx 0 16rpx;
  }
  
  .order-status-tab {
    font-size: 24rpx;
    padding: 10rpx 20rpx;
  }
  
  .orders-list {
    padding: 16rpx;
    padding-top: 160rpx;
  }
  
  .order-item {
    padding: 20rpx;
    margin-bottom: 16rpx;
  }
}
</style> 