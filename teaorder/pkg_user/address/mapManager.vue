<template>
  <view class="map-manager-page">
    <view class="map-header">
      <text class="map-title">地址地图总览</text>
    </view>
    <map
      class="full-map"
      :latitude="centerLat"
      :longitude="centerLng"
      :markers="markers"
      :scale="14"
      :enable-zoom="true"
      :enable-scroll="true"
      :enable-rotate="true"
      :enable-3D="true"
      :show-location="true"
      :enable-satellite="true"
      :enable-overlooking="true"
      :enable-compass="true"
      :enable-traffic="true"
      @markertap="onMarkerTap"
    >
    </map>
    <view v-if="selectedAddress" class="address-info-panel">
      <text class="address-title">{{ selectedAddress.name }} {{ selectedAddress.phone }}</text>
      <text class="address-detail">{{ selectedAddress.address }}</text>
      <text class="address-coord">纬度: {{ selectedAddress.lat }}，经度: {{ selectedAddress.lng }}</text>
    </view>
  </view>
</template>

<script>
import { baiduMapConfig } from '../../config.js';

export default {
  data() {
    return {
      addressList: [],
      markers: [],
      centerLat: 39.908823,
      centerLng: 116.397470,
      selectedAddress: null
    };
  },
  onLoad() {
    this.fetchAddressList();
  },
  methods: {
    async fetchAddressList() {
      // 假设用户ID已存储在本地
      const userInfo = uni.getStorageSync('userInfo');
      if (!userInfo || !userInfo.id) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      try {
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/address/user/${userInfo.id}`,
          method: 'GET',
          timeout: 10000
        });
        if (error) {
          uni.showToast({ title: '获取地址失败', icon: 'none' });
          return;
        }
        if (res && res.data && Array.isArray(res.data)) {
          this.addressList = res.data;
          this.markers = this.addressList.filter(a => a.lat && a.lng).map((addr, idx) => ({
            id: idx,
            latitude: Number(addr.lat),
            longitude: Number(addr.lng),
            title: addr.name,
            iconPath: '/static/images/map-marker.png',
            width: 40,
            height: 40,
            callout: {
              content: addr.name + '\n' + addr.address,
              color: '#333',
              fontSize: 14,
              borderRadius: 8,
              bgColor: '#fff',
              padding: 8,
              display: 'ALWAYS'
            }
          }));
          if (this.markers.length > 0) {
            this.centerLat = this.markers[0].latitude;
            this.centerLng = this.markers[0].longitude;
          }
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    onMarkerTap(e) {
      const markerId = e.detail.markerId;
      this.selectedAddress = this.addressList[markerId];
    }
  }
};
</script>

<style scoped>
.map-manager-page {
  width: 100vw;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}
.map-header {
  padding: 20rpx 0;
  text-align: center;
  background: #667eea;
  color: #fff;
}
.map-title {
  font-size: 36rpx;
  font-weight: bold;
}
.full-map {
  flex: 1;
  width: 100vw;
  height: 100vh;
}
.address-info-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.95);
  padding: 32rpx 24rpx;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
  z-index: 10;
  text-align: left;
}
.address-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}
.address-detail {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}
.address-coord {
  font-size: 24rpx;
  color: #999;
}
</style> 