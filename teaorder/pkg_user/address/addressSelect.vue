<template>
  <view class="address-select-page">
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

    <!-- 地图容器 -->
    <view class="map-container">
      <map
        id="addressMap"
        class="map"
        :latitude="mapCenter.latitude"
        :longitude="mapCenter.longitude"
        :markers="markers"
        :scale="16"
        :show-location="true"
        :enable-zoom="true"
        :enable-scroll="true"
        :enable-rotate="false"
        @markertap="onMarkerTap"
        @regionchange="onRegionChange"
        @tap="onMapTap"
      ></map>
      
      <!-- 地图中心点指示器 -->
      <view class="map-center-indicator">
        <text class="center-icon">📍</text>
      </view>
    </view>

    <!-- 地址信息面板 -->
    <view class="address-panel">
      <view class="panel-header">
        <text class="panel-title">选择地址</text>
        <text class="panel-subtitle">{{ selectedAddress || '搜索或选择地址' }}</text>
      </view>
      
      <view class="address-details" v-if="selectedLocation">
        <view class="detail-item">
          <text class="detail-label">详细地址：</text>
          <text class="detail-value">{{ selectedAddress }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">经纬度：</text>
          <text class="detail-value">{{ selectedLocation.latitude.toFixed(6) }}, {{ selectedLocation.longitude.toFixed(6) }}</text>
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

    <!-- 常用地址列表 -->
    <view v-if="!searchKeyword && searchResults.length === 0" class="common-addresses">
      <view class="common-header">
        <text class="common-title">常用地址</text>
      </view>
      <view class="common-list">
        <view 
          v-for="(address, index) in commonAddresses" 
          :key="index"
          class="common-item"
          @click="selectCommonAddress(address)"
        >
          <view class="common-info">
            <text class="common-name">{{ address.name }}</text>
            <text class="common-address">{{ address.address }}</text>
          </view>
          <text class="common-icon">📍</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { baiduMapConfig } from '../../config.js';

console.log('百度地图配置:', baiduMapConfig);

export default {
  data() {
    return {
      searchKeyword: '',
      selectedLocation: null,
      selectedAddress: '',
      searchResults: [],
      searchTimer: null,
      mapCenter: { latitude: 39.908823, longitude: 116.397470 }, // 地图中心点
      markers: [], // 地图标记点
      commonAddresses: [
        {
          name: '当前位置',
          address: '正在获取...',
          location: null
        },
        {
          name: '公司',
          address: '北京市朝阳区建国门外大街1号',
          location: { latitude: 39.908823, longitude: 116.397470 }
        },
        {
          name: '家',
          address: '北京市海淀区中关村大街1号',
          location: { latitude: 39.9837, longitude: 116.3229 }
        }
      ]
    };
  },
  
  onLoad() {
    // 验证配置是否正确加载
    console.log('地址选择页面加载，百度地图配置:', baiduMapConfig);
    
    if (!baiduMapConfig || !baiduMapConfig.ak) {
      uni.showToast({ 
        title: '百度地图配置错误', 
        icon: 'none' 
      });
      return;
    }
    
    // 获取当前位置
    this.getCurrentLocation();
  },
  
  methods: {
    // 获取当前位置
    getCurrentLocation() {
      uni.showLoading({ title: '定位中...' });
      
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.mapCenter = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          this.selectedLocation = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          
          // 根据坐标获取地址信息
          this.reverseGeocode(res.latitude, res.longitude);
          
          // 更新常用地址中的当前位置
          this.commonAddresses[0].location = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          
          // 更新地图标记
          this.updateMarkers();
          
          uni.hideLoading();
          uni.showToast({ title: '定位成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('定位失败:', err);
          uni.hideLoading();
          
          // 根据错误类型显示不同的提示
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
        // 使用百度地图API搜索地址
        const url = `${baiduMapConfig.baseUrl}/place/v2/search`;
        const params = {
          query: this.searchKeyword,
          location: '39.908823,116.397470', // 默认北京
          radius: 5000,
          output: 'json',
          ak: baiduMapConfig.ak
        };
        
        const queryString = Object.keys(params)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');
        
        const res = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET'
        });
        
        if (res.data && res.data.results) {
          this.searchResults = res.data.results.map(item => ({
            title: item.name,
            address: item.address,
            location: {
              latitude: item.location.lat,
              longitude: item.location.lng
            },
            distance: (item.distance / 1000).toFixed(1)
          }));
        }
      } catch (error) {
        console.error('搜索地址失败:', error);
        // 如果API调用失败，使用模拟数据
        this.searchResults = [
          {
            title: this.searchKeyword,
            address: `${this.searchKeyword}附近`,
            location: { latitude: 39.908823, longitude: 116.397470 },
            distance: '0.1'
          }
        ];
      }
    },
    
    // 选择搜索结果
    selectSearchResult(result) {
      this.mapCenter = result.location;
      this.selectedLocation = result.location;
      this.selectedAddress = result.address;
      this.searchResults = [];
      this.searchKeyword = result.title;
      
      this.updateMarkers();
    },
    
    // 选择常用地址
    selectCommonAddress(address) {
      if (address.location) {
        this.mapCenter = address.location;
        this.selectedLocation = address.location;
        this.selectedAddress = address.address;
        this.updateMarkers();
        uni.showToast({ title: `已选择${address.name}`, icon: 'success' });
      } else {
        uni.showToast({ title: '正在获取位置信息', icon: 'none' });
      }
    },
    
    // 逆地理编码（坐标转地址）
    async reverseGeocode(latitude, longitude) {
      try {
        const url = `${baiduMapConfig.baseUrl}/reverse_geocoding/v3`;
        const params = {
          location: `${latitude},${longitude}`,
          output: 'json',
          ak: baiduMapConfig.ak
        };
        
        const queryString = Object.keys(params)
          .map(key => `${key}=${encodeURIComponent(params[key])}`)
          .join('&');
        
        const res = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET'
        });
        
        if (res.data && res.data.result) {
          const result = res.data.result;
          this.selectedAddress = result.formatted_address || '未知地址';
          
          // 更新常用地址中的当前位置
          this.commonAddresses[0].address = result.formatted_address || '当前位置';
        }
      } catch (error) {
        console.error('逆地理编码失败:', error);
        this.selectedAddress = '未知地址';
      }
    },
    
    // 地图点击事件
    onMapTap(e) {
      const { latitude, longitude } = e.detail;
      this.selectedLocation = { latitude, longitude };
      this.reverseGeocode(latitude, longitude);
      this.updateMarkers();
    },

    // 地图标记点点击事件
    onMarkerTap(e) {
      this.selectedLocation = {
        latitude: e.detail.latitude,
        longitude: e.detail.longitude
      };
      this.selectedAddress = '点击地图选择位置';
      this.searchResults = [];
      this.searchKeyword = '';
    },

    // 地图区域变化事件
    onRegionChange(e) {
      if (e.type === 'end' && e.detail.centerLocation) {
        const { latitude, longitude } = e.detail.centerLocation;
        this.selectedLocation = { latitude, longitude };
        this.reverseGeocode(latitude, longitude);
        this.updateMarkers();
      }
    },
    
    // 更新地图标记
    updateMarkers() {
      if (this.selectedLocation) {
        this.markers = [{
          id: 1,
          latitude: this.selectedLocation.latitude,
          longitude: this.selectedLocation.longitude,
          title: '选择的位置',
          iconPath: '/static/images/map-marker.png',
          width: 32,
          height: 32
        }];
      }
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
      
      // 返回选择的地址信息
      const addressInfo = {
        latitude: this.selectedLocation.latitude,
        longitude: this.selectedLocation.longitude,
        address: this.selectedAddress
      };
      
      // 通过页面参数传递数据
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
.address-select-page {
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
}

.map {
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

.common-addresses {
  background: #fff;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
}

.common-header {
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.common-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.common-list {
  max-height: 300rpx;
  overflow-y: auto;
}

.common-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.common-item:last-child {
  border-bottom: none;
}

.common-item:active {
  background: #f5f5f5;
}

.common-info {
  flex: 1;
  margin-right: 16rpx;
}

.common-name {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.common-address {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.common-icon {
  font-size: 32rpx;
  color: #1890ff;
}
</style> 