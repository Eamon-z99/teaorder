<template>
  <view class="order-detail-container" v-if="order">
    <view class="section">
      <view class="section-title">订单信息</view>
      <view class="info-row"><text class="label">订单号：</text><text>{{ order.order_no }}</text></view>
      <view class="info-row"><text class="label">下单时间：</text><text>{{ order.created_at }}</text></view>
      <view class="info-row"><text class="label">订单类型：</text><text>{{ order.order_type === 'delivery' ? '外卖' : '自取' }}</text></view>
      <view class="info-row"><text class="label">订单状态：</text><text>{{ getStatusText(order.status) }}</text></view>
      <view class="info-row"><text class="label">总金额：</text><text>¥{{ order.total_amount }}</text></view>
      <view class="info-row"><text class="label">备注：</text><text>{{ order.remark || '无' }}</text></view>
    </view>
    <view class="section">
      <view class="section-title">用户信息</view>
      <view class="info-row"><text class="label">昵称：</text><text>{{ order.user_nickname || '匿名用户' }}</text></view>
      <view class="info-row"><text class="label">手机号：</text><text>{{ order.user_phone || '无' }}</text></view>
    </view>
    <view class="section" v-if="order.order_type === 'delivery'">
      <view class="section-title">收货信息</view>
      <view class="info-row"><text class="label">收货人：</text><text>{{ order.address_name }}</text></view>
      <view class="info-row"><text class="label">电话：</text><text>{{ order.address_phone }}</text></view>
      <view class="info-row"><text class="label">地址：</text><text>{{ order.address_detail }}</text></view>
    </view>
    <view class="section">
      <view class="section-title">商品明细</view>
      <view class="product-list">
        <view class="product-item" v-for="item in items" :key="item.id">
          <image :src="item.img || item.image_url || '/static/images/default-product.png'" class="product-img" mode="aspectFill" />
          <view class="product-info">
            <view class="product-name">{{ item.product_name }}</view>
            <view class="product-meta">数量: {{ item.quantity }} | 单价: ¥{{ item.product_price }}</view>
            <view class="product-meta">规格: {{ item.spec || '-' }} | 甜度: {{ item.sweetness || '-' }} | 温度: {{ item.temperature || '-' }}</view>
            <view class="product-meta">小料: {{ formatToppings(item.toppings) }}</view>
            <view class="product-meta">小计: ¥{{ item.total_price }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
  <view v-else class="empty-state"><text>加载中...</text></view>
</template>

<script>
export default {
  data() {
    return {
      orderId: null,
      order: null,
      items: []
    };
  },
  onLoad(options) {
    if (options.orderId) {
      this.orderId = options.orderId;
      this.loadOrderDetail();
    }
  },
  methods: {
    // 加载订单详情
    loadOrderDetail() {
      uni.request({
        url: `http://localhost:3000/api/admin/orders/${this.orderId}`,
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.data && res.data.success) {
            this.order = res.data.order;
            this.orderItems = res.data.items;
          } else {
            uni.showToast({ title: '加载订单详情失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    getStatusText(status) {
      const statusMap = {
        'pending': '待付款',
        'paid': '已付款',
        'preparing': '制作中',
        'ready': '待取餐',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    },
    formatToppings(toppings) {
      if (!toppings) return '-';
      try {
        const arr = JSON.parse(toppings);
        return Array.isArray(arr) && arr.length ? arr.join('、') : '-';
      } catch {
        return '-';
      }
    }
  }
};
</script>

<style scoped>
.order-detail-container { min-height: 100vh; background: #f5f5f5; padding: 20rpx; }
.section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 30rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }
.info-row { display: flex; gap: 20rpx; font-size: 28rpx; color: #444; margin-bottom: 12rpx; }
.label { color: #888; min-width: 120rpx; display: inline-block; }
.product-list { margin-top: 10rpx; }
.product-item { display: flex; gap: 20rpx; align-items: center; margin-bottom: 20rpx; }
.product-img { width: 100rpx; height: 100rpx; border-radius: 12rpx; background: #eee; }
.product-info { flex: 1; display: flex; flex-direction: column; gap: 6rpx; }
.product-name { font-size: 28rpx; font-weight: bold; color: #333; }
.product-meta { font-size: 24rpx; color: #666; }
.empty-state { padding: 100rpx 20rpx; text-align: center; color: #999; font-size: 28rpx; }
</style> 