<template>
  <view class="order-container">
    <view v-if="!myOrders.length" class="empty">暂无订单</view>
    <view v-for="order in myOrders" :key="order.id" class="order-card" @click="goDetail(order)">
      <view class="order-header">
        <text class="order-id">订单号: {{order.order_no || order.id}}</text>
        <text :class="['order-type-tag', order.orderType]">{{ order.orderType==='delivery' ? '外卖' : '自取' }}</text>
        <text :class="['order-status', getStatusClass(order.status)]">{{getStatusText(order.status)}}</text>
      </view>
      <view v-if="order.orderType==='delivery' && order.address" class="order-address">
        <text>{{ order.address.name }} {{ order.address.phone }} {{ order.address.detail }} <span class="order-addr-tag">{{ order.address.tag }}</span></text>
      </view>
      <view class="order-items">
        <view v-for="item in order.items" :key="item.id" class="order-item">
          <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="item-img" mode="aspectFill"></image>
          <view class="item-info">
            <text class="item-name">{{item.name}}</text>
            <text class="item-spec">{{item.spec}} / {{item.sweet}} / {{item.temp}}</text>
            <text class="item-toppings" v-if="item.toppings && item.toppings.length">小料：{{item.toppings.join('、')}}</text>
            <text class="item-count">x{{item.count}}</text>
          </view>
          <text class="item-price">￥{{(item.totalPrice || (item.price * item.count)).toFixed(2)}}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      myOrders: [],
      userId: null,
      userInfo: null
    }
  },
  onShow() {
    this.checkLoginStatus();
    this.getOrders();
    
    // 处理从订单详情返回时的逻辑
    const currentOrderId = uni.getStorageSync('currentOrderId');
    if (currentOrderId) {
      // 重新获取订单列表以更新状态
      this.getOrders();
      // 清除缓存的订单id
      uni.removeStorageSync('currentOrderId');
    }
  },
  methods: {
    checkLoginStatus() {
      let userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('token');
      // 兼容userId字段
      if (userInfo && !userInfo.id && userInfo.userId) {
        userInfo.id = userInfo.userId;
        uni.setStorageSync('userInfo', userInfo);
      }
      if (userInfo && token) {
        this.userInfo = userInfo;
        this.userId = userInfo.id;
      } else {
        this.userInfo = null;
        this.userId = null;
      }
    },
    async getOrders() {
      if (!this.userId) {
        this.myOrders = [];
        return;
      }
      try {
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/order/user/${this.userId}`,
          method: 'GET'
        });
        
        if (error) {
          console.error('获取订单请求错误:', error);
          this.myOrders = [];
          return;
        }
        
        if (res && res.statusCode === 200) {
          // 并发请求每个订单的商品明细
          const orders = res.data;
          const detailPromises = orders.map(async order => {
            const [detailError, detailRes] = await uni.request({
              url: `http://localhost:3000/api/order/${order.id}/items`,
              method: 'GET'
            });
            return { error: detailError, res: detailRes };
          });
          const detailResults = await Promise.all(detailPromises);
          this.myOrders = orders.map((order, idx) => {
            const detailResult = detailResults[idx];
            const itemsRaw = detailResult && !detailResult.error && detailResult.res && detailResult.res.statusCode === 200 ? (detailResult.res.data.items || []) : [];
            // 字段映射，兼容图片、描述、规格、数量、价格等
            const items = itemsRaw.map(item => ({
              ...item,
              img: item.img, // 优先用后端 img 字段
              desc: item.desc || item.description || '',
              sweet: item.sweet || item.sweetness || '',
              temp: item.temp || item.temperature || '',
              count: Number(item.count || item.quantity || 1),
              name: item.name || item.product_name || '',
              price: Number(item.price || item.product_price || 0),
              totalPrice: Number(item.totalPrice || item.total_price || (item.price || item.product_price || 0) * (item.count || item.quantity || 1)),
              toppings: typeof item.toppings === 'string' ? JSON.parse(item.toppings || '[]') : (item.toppings || [])
            }));
            // 兼容 orderType 字段
            // 新增 address 字段组装
            const address = order.address_name ? {
              name: order.address_name,
              phone: order.address_phone,
              detail: order.address_detail,
              tag: order.address_tag
            } : null;
            return { ...order, items, orderType: order.orderType || order.order_type || 'self', address };
          });
        } else {
          console.error('获取订单失败:', res);
          this.myOrders = [];
        }
      } catch (error) {
        console.error('获取订单失败:', error);
        this.myOrders = [];
      }
    },
    goDetail(order) {
      // 使用navigateTo跳转到订单详情页，并传递订单ID
      uni.navigateTo({
        url: `/pkg_order/orderDetail/orderDetail?id=${order.id}`,
        success: () => {
          console.log('跳转到订单详情成功');
        },
        fail: (err) => {
          console.error('跳转失败:', err);
        }
      });
    },
    getStatusClass(status) {
      const statusMap = {
        'pending': 'pending',
        'paid': 'paid', 
        'preparing': 'preparing',
        'ready': 'ready',
        'delivering': 'delivering',
        'completed': 'done',
        'cancelled': 'cancelled'
      };
      return statusMap[status] || 'pending';
    },
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
    }
  }
}
</script>

<style scoped>
.order-container {
  min-height: 100vh;
  background: #fff;
  padding: 30rpx 0 30rpx 0;
}
.empty {
  text-align: center;
  color: #bbb;
  font-size: 32rpx;
  margin-top: 200rpx;
}
.order-card {
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx #f3e6c1;
  margin: 0 30rpx 30rpx 30rpx;
  padding: 30rpx 20rpx;
  cursor: pointer;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}
.order-id {
  font-size: 28rpx;
  color: #bfa76a;
  font-weight: bold;
}
.order-status {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  white-space: nowrap;
  display: inline-block;
  min-width: 80rpx;
  text-align: center;
  line-height: 1.2;
}
.order-status.pending {
  background: #fff2cc;
  color: #bfa76a;
}
.order-status.paid {
  background: #e3f2fd;
  color: #1976d2;
}
.order-status.preparing {
  background: #fff3e0;
  color: #f57c00;
}
.order-status.ready {
  background: #e8f5e8;
  color: #388e3c;
}
.order-status.delivering {
  background: #f3e5f5;
  color: #7b1fa2;
}
.order-status.done {
  background: #e0f7e9;
  color: #4caf50;
}
.order-status.cancelled {
  background: #ffebee;
  color: #f44336;
}
.order-items {
  margin-top: 20rpx;
}
.order-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.order-item:last-child {
  border-bottom: none;
}
.item-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  background-color: #f5f5f5;
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 20rpx;
}
.item-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}
.item-count {
  font-size: 24rpx;
  color: #888;
}
.item-price {
  font-size: 28rpx;
  color: #ff6b6b;
  font-weight: bold;
}
.item-spec {
  font-size: 22rpx;
  color: #888;
  margin: 4rpx 0 0 0;
  display: block;
}
.order-type-tag {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin: 0 12rpx;
  white-space: nowrap;
  display: inline-block;
  min-width: 60rpx;
  text-align: center;
  line-height: 1.2;
}
.order-type-tag.delivery {
  background: #fffbe6;
  color: #ffb300;
}
.order-type-tag.self {
  background: #e6f7ff;
  color: #1890ff;
}
.order-address {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 8rpx;
}
.order-addr-tag {
  background: #f0f0f0;
  color: #888;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
  margin-left: 8rpx;
}
.item-toppings {
  font-size: 22rpx;
  color: #bfa76a;
  margin-top: 2rpx;
  display: block;
}
</style>