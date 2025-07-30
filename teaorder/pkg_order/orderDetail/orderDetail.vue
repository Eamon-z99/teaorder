<template>
  <view class="order-detail-container">
    <!-- 订单状态 -->
    <view class="order-status-section">
      <text class="order-id">订单号：{{ orderInfo.order_no || orderInfo.id }}</text>
      <text :class="['order-status', getStatusClass(orderInfo.status)]">
        {{ getStatusText(orderInfo.status) }}
      </text>
    </view>
    
    <!-- 商品明细 -->
    <view v-if="items && items.length">
      <view v-for="item in items" :key="item.id" class="order-item">
        <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="item-img" mode="aspectFill"></image>
        <view class="item-info">
          <text class="item-name">{{ item.product_name || item.name }}</text>
          <text class="item-spec">{{ item.spec }} / {{ item.sweetness || item.sweet }} / {{ item.temperature || item.temp }}</text>
          <text class="item-toppings" v-if="item.toppings && item.toppings.length">小料：{{ Array.isArray(item.toppings) ? item.toppings.join('、') : item.toppings }}</text>
          <text class="item-count">x{{ item.quantity || item.count }}</text>
        </view>
        <text class="item-price">￥{{ (Number(item.total_price) || (Number(item.price) * (item.quantity || item.count || 1))).toFixed(2) }}</text>
      </view>
    </view>
    <!-- 优惠券信息 -->
    <view v-if="coupon" class="coupon-info">
      <text class="coupon-label">使用优惠券：</text>
      <text class="coupon-value">{{ coupon.value != null ? coupon.value + '元（' + coupon.type + '）' : '未使用优惠券' }}</text>
    </view>
    <view v-else class="coupon-info">
      <text class="coupon-label">未使用优惠券</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      orderId: null,
      items: [],
      coupon: null,
      orderInfo: {}
    };
  },
  onLoad(options) {
    this.orderId = options.id;
    this.getOrderDetail();
  },
  methods: {
    async getOrderDetail() {
      try {
        // 获取订单基本信息
        const [orderError, orderRes] = await uni.request({
          url: `http://localhost:3000/api/order/${this.orderId}/info`,
          method: 'GET'
        });
        
        if (orderError) {
          console.error('获取订单基本信息失败:', orderError);
          return;
        }
        
        if (orderRes && orderRes.statusCode === 200) {
          this.orderInfo = orderRes.data;
        }
        
        // 获取订单商品详情
        const [itemsError, itemsRes] = await uni.request({
          url: `http://localhost:3000/api/order/${this.orderId}/items`,
          method: 'GET'
        });
        
        if (itemsError) {
          console.error('获取订单商品详情失败:', itemsError);
          return;
        }
        
        if (itemsRes && itemsRes.statusCode === 200) {
          // 字段映射和类型处理，保证渲染
          this.items = (itemsRes.data.items || []).map(item => ({
            ...item,
            img: item.img || item.image_url || ($oss + 'logo.png'),
            desc: item.desc || item.description || '',
            sweet: item.sweet || item.sweetness || '',
            temp: item.temp || item.temperature || '',
            count: Number(item.count || item.quantity || 1),
            name: item.name || item.product_name || '',
            price: Number(item.price || item.product_price || 0),
            totalPrice: Number(item.totalPrice || item.total_price || (item.price || item.product_price || 0) * (item.count || item.quantity || 1)),
            toppings: typeof item.toppings === 'string' ? JSON.parse(item.toppings || '[]') : (item.toppings || [])
          }));
          this.coupon = itemsRes.data.coupon;
        }
      } catch (error) {
        console.error('获取订单详情失败:', error);
      }
    },
    getStatusClass(status) {
      const statusMap = {
        'pending': 'status-pending',
        'paid': 'status-paid',
        'preparing': 'status-preparing',
        'ready': 'status-ready',
        'delivering': 'status-delivering',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
      };
      return statusMap[status] || 'status-unknown';
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
};
</script>

<style>
.order-detail-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #fffbe6 0%, #fff 100%);
  padding: 0;
}
.order-detail-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px 0 rgba(255,179,0,0.08), 0 1.5px 6px 0 rgba(0,0,0,0.03);
  margin: 18px 10px 0 10px;
  padding: 18px 14px 24px 14px;
  max-width: 420px;
  min-height: 60vh;
  margin-left: auto;
  margin-right: auto;
}
.order-item {
  display: flex;
  align-items: flex-start;
  padding: 14px 0 10px 0;
  border-bottom: 1px solid #f5f5f5;
  transition: box-shadow 0.2s;
}
.order-item:last-child {
  border-bottom: none;
}
.item-img {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  margin-right: 12px;
  background-color: #f5f5f5;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 8px;
  min-width: 0;
}
.item-name-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.item-name {
  font-size: 17px;
  color: #222;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
  word-break: break-all;
}
.item-price {
  font-size: 18px;
  color: #ff6b6b;
  font-weight: bold;
  margin-left: 10px;
  white-space: nowrap;
  align-self: flex-start;
}
.item-spec {
  font-size: 13px;
  color: #888;
  margin: 2px 0 0 0;
  display: block;
  line-height: 1.2;
}
.item-toppings {
  font-size: 13px;
  color: #bfa76a;
  margin-top: 1px;
  display: block;
  line-height: 1.2;
}
.item-count {
  font-size: 13px;
  color: #aaa;
  margin-top: 1px;
}
.coupon-info {
  margin-top: 22px;
  font-size: 15px;
  color: #222;
  background: #fffbe6;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px #f3e6c1;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.coupon-label {
  color: #333;
  font-weight: bold;
  margin-right: 6px;
}
.coupon-value {
  color: #ffb300;
  font-weight: bold;
  margin-left: 2px;
}
.order-status-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f5f5f5;
}
.order-id {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}
.order-status {
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 16px;
  white-space: nowrap;
  display: inline-block;
  min-width: 60px;
  text-align: center;
  line-height: 1.2;
}
.status-pending {
  background-color: #fffbe6;
  color: #ffb300;
}
.status-paid {
  background-color: #e3f2fd;
  color: #1976d2;
}
.status-preparing {
  background-color: #fff3e0;
  color: #f57c00;
}
.status-ready {
  background-color: #e8f5e8;
  color: #388e3c;
}
.status-delivering {
  background-color: #f3e5f5;
  color: #7b1fa2;
}
.status-completed {
  background-color: #e8f5e9;
  color: #4caf50;
}
.status-cancelled {
  background-color: #ffebee;
  color: #f44336;
}
.status-unknown {
  background-color: #e0e0e0;
  color: #666;
}
@media (max-width: 420px) {
  .order-detail-container {
    margin: 12px 2vw 0 2vw;
    padding: 12px 4vw 18px 4vw;
  }
}
</style>