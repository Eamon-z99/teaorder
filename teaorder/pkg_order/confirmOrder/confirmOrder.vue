<template>
  <view class="confirm-container">
    <view class="section-title">订单确认</view>
    <view class="address-section" v-if="orderType==='delivery'">
      <view v-if="address">
        <text class="address-main">{{ address.name }} {{ address.phone }}</text>
        <text class="address-detail">{{ address.address }} <span class="address-tag">{{ address.tag }}</span></text>
      </view>
      <view v-else class="addr-empty">请选择收货地址</view>
    </view>
    <view class="product-list">
      <view v-for="item in cart" :key="item.id" class="product-item">
        <image :src="item.img || item.image_url || ($oss + 'logo.png')" class="product-img" />
        <view class="product-info">
          <text class="product-name">{{ item.name }}</text>
          <text class="product-count">x{{ item.quantity || item.count }}</text>
          <text class="product-price">￥{{ item.price }}</text>
        </view>
      </view>
    </view>
    <view class="coupon-section">
      <text class="coupon-label">选择优惠券：</text>
      <picker :range="couponOptions" range-key="label" @change="onCouponChange">
        <view class="picker-value">{{ selectedCoupon ? selectedCoupon.label : '不使用优惠券' }}</view>
      </picker>
    </view>
    <view class="total-section">
      <text>总价：</text>
      <text class="total-value">￥{{ finalTotal }}</text>
    </view>
    <button class="submit-btn" @click="submitOrder">提交订单</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      cart: [],
      address: null,
      orderType: 'self',
      couponOptions: [],
      selectedCoupon: null,
      total: 0,
      finalTotal: 0,
      userId: null
    };
  },
  onShow() {
    this.initData();
  },
  methods: {
    async initData() {
      let userInfo = uni.getStorageSync('userInfo');
      // 兼容userId字段
      if (userInfo && !userInfo.id && userInfo.userId) {
        userInfo.id = userInfo.userId;
        uni.setStorageSync('userInfo', userInfo);
      }
      if (!userInfo) return;
      this.userId = userInfo.id;
      this.cart = uni.getStorageSync('cart') || [];
      this.orderType = uni.getStorageSync('orderType') || 'self';
      this.total = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || item.count)), 0);
      this.finalTotal = this.total;
      // 地址
      if (this.orderType === 'delivery') {
        await this.getDefaultAddress();
      }
      // 优惠券
      await this.getCoupons();
    },
    async getDefaultAddress() {
      try {
        const res = await uni.request({
          url: `http://localhost:3000/api/address/user/${this.userId}`,
          method: 'GET'
        });
        if (res.statusCode === 200 && res.data.length > 0) {
          this.address = res.data.find(addr => addr.is_default) || res.data[0];
        } else {
          this.address = null;
        }
      } catch (error) {
        this.address = null;
      }
    },
    async getCoupons() {
      const res = await uni.request({
        url: `http://localhost:3000/api/user/coupons/${this.userId}`,
        method: 'GET'
      });
      if (res.statusCode === 200) {
        const unused = res.data.filter(c => c.status === 'unused');
        this.couponOptions = [{ label: '不使用优惠券', value: null }, ...unused.map(c => ({ label: `${c.value}元券`, value: c.id, coupon: c }))];
        this.selectedCoupon = this.couponOptions[0];
      }
    },
    onCouponChange(e) {
      const idx = e.detail.value;
      this.selectedCoupon = this.couponOptions[idx];
      if (this.selectedCoupon && this.selectedCoupon.coupon) {
        this.finalTotal = Math.max(0, this.total - this.selectedCoupon.coupon.value);
      } else {
        this.finalTotal = this.total;
      }
    },
    async submitOrder() {
      if (this.orderType === 'delivery' && !this.address) {
        uni.showToast({ title: '请选择地址', icon: 'none' });
        return;
      }
      const orderData = {
        user_id: this.userId,
        order_type: this.orderType,
        total_amount: this.total,
        address_id: this.orderType === 'delivery' && this.address ? this.address.id : null,
        remark: '',
        items: this.cart,
        coupon_id: this.selectedCoupon && this.selectedCoupon.value ? this.selectedCoupon.value : null
      };
      uni.request({
        url: 'http://localhost:3000/api/order',
        method: 'POST',
        data: orderData,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.removeStorageSync('cart');
            uni.showToast({ title: '下单成功', icon: 'success' });
            setTimeout(() => {
              uni.switchTab({ url: '/pages/myOrder/myOrder' });
            }, 1200);
          } else {
            uni.showToast({ title: res.data.error || '下单失败', icon: 'none' });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.confirm-container {
  min-height: 100vh;
  background: #fffbe6;
  padding: 30rpx;
}
.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #bfa76a;
  margin-bottom: 24rpx;
}
.address-section {
  background: #fff9e2;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 24rpx;
  color: #bfa76a;
}
.address-main {
  font-size: 30rpx;
  font-weight: bold;
}
.address-detail {
  font-size: 26rpx;
  color: #bfa76a;
}
.address-tag {
  background: #ffe082;
  color: #fff;
  border-radius: 8rpx;
  padding: 2rpx 10rpx;
  margin-left: 10rpx;
  font-size: 22rpx;
}
.addr-empty {
  color: #bbb;
  font-size: 28rpx;
}
.product-list {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 18rpx 20rpx;
}
.product-item {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.product-item:last-child {
  margin-bottom: 0;
}
.product-img {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  margin-right: 18rpx;
  background-color: #f5f5f5;
}
.product-info {
  display: flex;
  flex-direction: column;
}
.product-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}
.product-count {
  font-size: 24rpx;
  color: #888;
}
.product-price {
  font-size: 28rpx;
  color: #ffb300;
  font-weight: bold;
}
.coupon-section {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.coupon-label {
  font-size: 28rpx;
  color: #bfa76a;
  margin-right: 18rpx;
}
.picker-value {
  font-size: 28rpx;
  color: #ffb300;
}
.total-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 32rpx;
  color: #bfa76a;
  margin-bottom: 32rpx;
}
.total-value {
  font-size: 36rpx;
  color: #ffb300;
  font-weight: bold;
  margin-left: 10rpx;
}
.submit-btn {
  width: 80vw;
  max-width: 500rpx;
  background: linear-gradient(90deg, #ffe082 0%, #ffb300 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
  padding: 24rpx 0;
  margin: 0 auto;
  display: block;
  box-shadow: 0 2rpx 8rpx #f3e6c1;
}
</style> 