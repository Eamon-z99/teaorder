<template>
  <view class="baidu-map-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input 
          v-model="searchKeyword" 
          placeholder="搜索地址" 
          class="search-input"
          @input="onSearchInput"
        />
        <text v-if="searchKeyword" class="clear-btn" @click="clearSearch">×</text>
      </view>
      <button class="current-location-btn" @click="getCurrentLocation">
        <text class="location-icon">📍</text>
        <text class="location-text">定位</text>
      </button>
    </view>

    <!-- 百度地图容器 -->
    <view class="map-container">
      <web-view 
        :src="mapUrl" 
        class="baidu-map"
        @message="onMapMessage"
      ></web-view>
      
      <!-- 地图中心点指示器 -->
      <view class="map-center-indicator">
        <text class="center-icon">📍</text>
      </view>
    </view>

    <!-- 地址信息面板 -->
    <view class="address-panel">
      <view class="panel-header">
        <text class="panel-title">选择地址</text>
        <text class="panel-subtitle">{{ selectedAddress || '点击地图选择位置' }}</text>
      </view>
      
      <view class="address-details" v-if="selectedLocation">
        <view class="detail-item">
          <text class="detail-label">详细地址：</text>
          <text class="detail-value">{{ selectedAddress }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">经纬度：</text>
          <text class="detail-value">{{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}</text>
        </view>
      </view>
      
      <view class="panel-actions">
        <button class="action-btn cancel-btn" @click="cancelSelect">取消</button>
        <button class="action-btn confirm-btn" @click="confirmSelect" :disabled="!selectedLocation">确认选择</button>
      </view>
    </view>

    <!-- 搜索结果列表 -->
    <view v-if="searchResults.length > 0" class="search-results">
      <view class="results-header">
        <text class="results-title">搜索结果</text>
        <text class="results-count">({{ searchResults.length }})</text>
      </view>
      <view class="results-list">
        <view 
          v-for="(result, index) in searchResults" 
          :key="index"
          class="result-item"
          @click="selectSearchResult(result)"
        >
          <view class="result-info">
            <text class="result-title">{{ result.title }}</text>
            <text class="result-address">{{ result.address }}</text>
          </view>
          <text class="result-distance">{{ result.distance }}km</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { baiduMapConfig } from '../../config.js';

export default {
  data() {
    return {
      searchKeyword: '',
      selectedLocation: null,
      selectedAddress: '',
      searchResults: [],
      searchTimer: null,
      mapUrl: ''
    };
  },
  
  onLoad() {
    // 使用简单的百度地图静态图片
    this.initSimpleMap();
    // 检查网络状态
    this.checkNetworkStatus();
    // 获取当前位置
    this.getCurrentLocation();
  },
  
  methods: {
    // 检查网络状态
    checkNetworkStatus() {
      uni.getNetworkType({
        success: (res) => {
          console.log('网络类型:', res.networkType);
          if (res.networkType === 'none') {
            uni.showModal({
              title: '网络连接提示',
              content: '当前无网络连接，地图功能可能受限',
              showCancel: false,
              confirmText: '我知道了'
            });
          }
        }
      });
    },
    
    // 初始化简单地图
    initSimpleMap() {
      const center = '116.397470,39.908823';
      this.mapUrl = `https://api.map.baidu.com/staticimage/v2?ak=${baiduMapConfig.ak}&center=${center}&width=1200&height=800&zoom=16&markers=${center}&markerStyles=l,A,0xff0000&dpiType=ph&coordType=bd09ll`;
    },
    
    // 获取当前位置
    getCurrentLocation() {
      uni.showLoading({ title: '定位中...' });
      
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.selectedLocation = {
            lat: res.latitude,
            lng: res.longitude
          };
          
          // 更新地图中心点
          this.updateMapCenter(res.longitude, res.latitude);
          
          // 根据坐标获取地址信息
          this.reverseGeocode(res.latitude, res.longitude);
          
          uni.hideLoading();
          uni.showToast({ title: '定位成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('定位失败:', err);
          uni.hideLoading();
          
          if (err.errMsg && err.errMsg.includes('permission')) {
            uni.showModal({
              title: '需要位置权限',
              content: '请在设置中允许获取位置信息，以便为您提供更好的服务',
              showCancel: false,
              confirmText: '我知道了'
            });
          } else {
            uni.showToast({ 
              title: '定位失败，请手动选择地址', 
              icon: 'none',
              duration: 2000
            });
          }
        }
      });
    },
    
    // 更新地图中心点
    updateMapCenter(lng, lat) {
      const center = `${lng},${lat}`;
      this.mapUrl = `https://api.map.baidu.com/staticimage/v2?ak=${baiduMapConfig.ak}&center=${center}&width=1200&height=800&zoom=16&markers=${center}&markerStyles=l,A,0xff0000&dpiType=ph&coordType=bd09ll`;
    },
    
    // 搜索输入处理
    onSearchInput() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      this.searchTimer = setTimeout(() => {
        if (this.searchKeyword.trim()) {
          this.searchAddress();
        } else {
          this.searchResults = [];
        }
      }, 500);
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = '';
      this.searchResults = [];
    },
    
    // 搜索地址
    async searchAddress() {
      if (!this.searchKeyword.trim()) return;
      
      try {
        const url = `${baiduMapConfig.baseUrl}/place/v2/search`;
        const params = {
          query: this.searchKeyword,
          location: '39.908823,116.397470',
          radius: 5000,
          output: 'json',
          ak: baiduMapConfig.ak,
          coordtype: 'gcj02ll'
        };
        
        const queryString = Object.keys(params)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');
        
        console.log('搜索地址请求URL:', `${url}?${queryString}`);
        
        const [error, res] = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET',
          timeout: 10000
        });
        
        console.log('搜索地址响应:', { error, res });
        
        if (error) {
          console.error('搜索请求错误:', error);
          this.searchResults = [];
          return;
        }
        
        if (res && res.data && res.data.results) {
          this.searchResults = res.data.results.map(item => ({
            title: item.name,
            address: item.address,
            location: {
              lat: item.location.lat,
              lng: item.location.lng
            },
            distance: (item.distance / 1000).toFixed(1)
          }));
        } else if (res && res.data && res.data.status !== 0) {
          console.error('搜索地址API错误:', res.data);
          this.searchResults = [];
          uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none',
            duration: 2000
          });
        } else {
          this.searchResults = [];
        }
      } catch (error) {
        console.error('搜索地址失败:', error);
        this.searchResults = [];
        
        uni.showToast({
          title: '搜索失败，请检查网络连接',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 选择搜索结果
    selectSearchResult(result) {
      this.selectedLocation = result.location;
      this.selectedAddress = result.address;
      this.searchResults = [];
      this.searchKeyword = result.title;
      
      // 更新地图中心点
      this.updateMapCenter(result.location.lng, result.location.lat);
    },
    
    // 地图消息处理
    onMapMessage(e) {
      console.log('地图消息:', e.detail);
      if (e.detail.data && e.detail.data.type === 'location_selected') {
        const data = e.detail.data.data;
        this.selectedLocation = {
          lat: data.lat,
          lng: data.lng
        };
        this.selectedAddress = data.address;
      }
    },
    
    // 逆地理编码
    async reverseGeocode(latitude, longitude) {
      try {
        const url = `${baiduMapConfig.baseUrl}/reverse_geocoding/v3`;
        const params = {
          location: `${latitude},${longitude}`,
          output: 'json',
          ak: baiduMapConfig.ak,
          coordtype: 'gcj02ll'
        };
        
        const queryString = Object.keys(params)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');
        
        console.log('逆地理编码请求URL:', `${url}?${queryString}`);
        
        const [error, res] = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET',
          timeout: 10000
        });
        
        console.log('逆地理编码响应:', { error, res });
        
        if (error) {
          console.error('逆地理编码请求错误:', error);
          this.selectedAddress = this.generateAddressFromCoords(latitude, longitude);
          return;
        }
        
        if (res && res.data && res.data.result) {
          const result = res.data.result;
          this.selectedAddress = result.formatted_address || '未知地址';
        } else if (res && res.data && res.data.status !== 0) {
          console.error('逆地理编码API错误:', res.data);
          this.selectedAddress = this.generateAddressFromCoords(latitude, longitude);
        } else {
          this.selectedAddress = '未知地址';
        }
      } catch (error) {
        console.error('逆地理编码失败:', error);
        this.selectedAddress = this.generateAddressFromCoords(latitude, longitude);
        
        uni.showToast({
          title: '使用备用地址解析',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 备用地址生成方案
    generateAddressFromCoords(latitude, longitude) {
      const lat = latitude.toFixed(6);
      const lng = longitude.toFixed(6);
      return `位置坐标 (${lat}, ${lng})`;
    },
    
    // 取消选择
    cancelSelect() {
      uni.navigateBack();
    },
    
    // 确认选择
    confirmSelect() {
      if (!this.selectedLocation) {
        uni.showToast({ title: '请先选择位置', icon: 'none' });
        return;
      }
      
      const addressInfo = {
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng,
        address: this.selectedAddress
      };
      
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      
      if (prevPage && prevPage.$vm && prevPage.$vm.updateLocationFromMap) {
        prevPage.$vm.updateLocationFromMap(addressInfo);
      }
      
      uni.navigateBack();
    }
  }
};
</script>

<style scoped>
.baidu-map-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #e8e8e8;
  gap: 16rpx;
  flex-shrink: 0;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 24rpx;
  padding: 0 20rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #999;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #333;
  background: transparent;
}

.clear-btn {
  font-size: 32rpx;
  color: #999;
  padding: 8rpx;
  cursor: pointer;
}

.current-location-btn {
  display: flex;
  align-items: center;
  background: #1890ff;
  color: #fff;
  border: none;
  border-radius: 24rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  gap: 8rpx;
}

.location-icon {
  font-size: 24rpx;
}

.map-container {
  flex: 1;
  position: relative;
  background: #e8e8e8;
  width: 100%;
  height: 50vh;
  min-height: 400rpx;
}

.baidu-map {
  width: 100%;
  height: 100%;
}

.map-center-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10rpx rgba(0,0,0,0.3);
  z-index: 10;
}

.center-icon {
  font-size: 40rpx;
  color: #1890ff;
}

.address-panel {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 24rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
}

.panel-header {
  margin-bottom: 24rpx;
}

.panel-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.panel-subtitle {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.address-details {
  margin-bottom: 32rpx;
  padding: 24rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
}

.detail-item {
  display: flex;
  margin-bottom: 16rpx;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 26rpx;
  color: #666;
  min-width: 140rpx;
}

.detail-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
  word-break: break-all;
}

.panel-actions {
  display: flex;
  gap: 24rpx;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:active {
  background: #e8e8e8;
}

.confirm-btn {
  background: #1890ff;
  color: #fff;
}

.confirm-btn:active {
  background: #096dd9;
}

.confirm-btn:disabled {
  background: #ccc;
  color: #999;
}

.search-results {
  position: absolute;
  top: 120rpx;
  left: 24rpx;
  right: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  max-height: 400rpx;
  overflow-y: auto;
  z-index: 100;
}

.results-header {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.results-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.results-count {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.results-list {
  max-height: 320rpx;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:active {
  background: #f5f5f5;
}

.result-info {
  flex: 1;
  margin-right: 16rpx;
}

.result-title {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.result-address {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.result-distance {
  font-size: 24rpx;
  color: #1890ff;
  font-weight: bold;
}
</style> 