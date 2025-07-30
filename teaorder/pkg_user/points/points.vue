<template>
  <view class="points-container">
    <view class="points-header">
      <image :src="$oss + 'basic/积分.png'" class="points-icon" mode="aspectFit" />
      <view class="points-info">
        <text class="points-title">我的积分</text>
        <text class="points-value">{{ points }}</text>
      </view>
    </view>
    <view class="points-rules">
      <text class="rules-title">积分规则</text>
      <view class="rules-list">
        <text>· 消费1元获得1积分</text>
        <text>· 200积分可兑换5元优惠券</text>
        <text>· 400积分可兑换10元优惠券</text>
        <text>· 600积分可兑换20元优惠券</text>
      </view>
    </view>
    <view class="exchange-section">
      <button class="exchange-btn" :disabled="points < 200" @click="exchange(200, 5)">兑5元券（200积分）</button>
      <button class="exchange-btn" :disabled="points < 400" @click="exchange(400, 10)">兑10元券（400积分）</button>
      <button class="exchange-btn" :disabled="points < 600" @click="exchange(600, 20)">兑20元券（600积分）</button>
    </view>
    <view class="coupon-list">
      <text class="coupon-title">我的优惠券</text>
      <view v-if="coupons.length === 0" class="empty">暂无优惠券</view>
      <view v-for="c in coupons" :key="c.id" :class="['coupon-item', c.status]">
        <view class="coupon-left">
          <view class="coupon-value">￥{{ c.value }}</view>
        </view>
        <view class="coupon-right">
          <text class="coupon-type">{{ c.type }}优惠券</text>
          <text class="coupon-status">{{ c.status === 'unused' ? '未使用' : c.status === 'used' ? '已使用' : '已过期' }}</text>
          <text class="coupon-date">{{ c.created_at | formatDate }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      points: 0,
      coupons: []
    };
  },
  onShow() {
    this.getPoints();
    this.getCoupons();
  },
  methods: {
    getPoints() {
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo) return;
      uni.request({
        url: `http://localhost:3000/api/user/points/${userInfo.id}`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            this.points = res.data.points;
          }
        }
      });
    },
    getCoupons() {
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo) return;
      uni.request({
        url: `http://localhost:3000/api/user/coupons/${userInfo.id}`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            this.coupons = res.data;
          }
        }
      });
    },
    exchange(points, value) {
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo) return;
      uni.request({
        url: `http://localhost:3000/api/user/exchange-coupon`,
        method: 'POST',
        data: {
          user_id: userInfo.id,
          points,
          value
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            uni.showToast({ title: '兑换成功', icon: 'success' });
            this.getPoints();
            this.getCoupons();
          } else {
            uni.showToast({ title: res.data.message || '兑换失败', icon: 'none' });
          }
        }
      });
    },
    getCouponImg(type) {
      // 移除图片方法
      return '';
    }
  },
  filters: {
    formatDate(val) {
      if (!val) return '';
      return val.substr(0, 10);
    }
  }
};
</script>

<style scoped>
.points-container {
  min-height: 100vh;
  background: #fffbe6;
  padding: 30rpx;
}
.points-header {
  display: flex;
  align-items: center;
  background: #fff9e2;
  border-radius: 20rpx;
  padding: 36rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx #f3e6c1;
}
.points-icon {
  width: 100rpx;
  height: 100rpx;
  margin-right: 30rpx;
}
.points-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.points-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #bfa76a;
  margin-bottom: 8rpx;
}
.points-value {
  font-size: 48rpx;
  color: #ffb300;
  font-weight: bold;
}
.points-rules {
  background: #fff9e2;
  border-radius: 16rpx;
  padding: 24rpx 30rpx;
  margin-bottom: 30rpx;
  font-size: 28rpx;
  color: #bfa76a;
  box-shadow: 0 2rpx 8rpx #f3e6c1;
}
.rules-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  color: #bfa76a;
}
.rules-list text {
  display: block;
  margin-bottom: 6rpx;
  color: #bfa76a;
}
.exchange-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
  align-items: center;
}
.exchange-btn {
  background: linear-gradient(90deg, #ffe082 0%, #ffb300 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  font-size: 32rpx;
  padding: 24rpx 0 24rpx 0;
  font-weight: bold;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx #f3e6c1;
  width: 80vw;
  max-width: 500rpx;
  min-width: 260rpx;
  justify-content: center;
}
.exchange-btn:disabled {
  background: #f3e6c1;
  color: #fffbe6;
}
.coupon-icon {
  display: none;
}
.coupon-list {
  background: #fff9e2;
  border-radius: 20rpx;
  padding: 30rpx 24rpx;
  box-shadow: 0 4rpx 16rpx #f3e6c1;
}
.coupon-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #bfa76a;
  margin-bottom: 16rpx;
  padding-left: 40rpx;
}
.coupon-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 2rpx 8rpx #f3e6c1;
  padding: 18rpx 20rpx;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.coupon-item:last-child {
  margin-bottom: 0;
}
.coupon-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 24rpx;
  min-width: 160rpx;
}
.coupon-bg {
  display: none;
}
.coupon-value {
  font-size: 36rpx;
  color: #ffb300;
  font-weight: bold;
  letter-spacing: 1rpx;
}
.coupon-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6rpx;
  align-items: flex-start;
}
.coupon-type {
  font-size: 28rpx;
  color: #bfa76a;
  font-weight: bold;
}
.coupon-status {
  font-size: 24rpx;
  color: #ffb300;
}
.coupon-date {
  font-size: 22rpx;
  color: #bbb;
}
.coupon-item.used {
  opacity: 0.5;
}
.coupon-item.expired {
  opacity: 0.5;
  filter: grayscale(1);
}
.empty {
  color: #bbb;
  text-align: center;
  margin: 30rpx 0;
}
</style> 