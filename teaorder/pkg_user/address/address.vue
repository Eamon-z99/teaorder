<template>
  <view class="address-page">
    <view class="address-header">
      <text class="header-title">地址管理</text>
      <text class="header-subtitle">管理您的收货地址</text>
    </view>
    <view v-if="addressList.length === 0" class="address-empty">
      <image :src="$oss + 'button/我的.png'" class="empty-icon" mode="aspectFit"></image>
      <text class="empty-text">暂无地址</text>
      <text class="empty-desc">添加您的第一个收货地址</text>
    </view>
    <view v-else class="address-list">
      <view v-for="(addr, idx) in addressList" :key="idx" class="address-item" @click="chooseMode && chooseThis(idx)">
        <view class="address-info">
          <view class="address-header-row">
            <view class="contact-info">
              <text class="address-name">{{ addr.name }}</text>
              <text class="address-phone">{{ addr.phone }}</text>
            </view>
            <view class="address-tags">
              <text v-if="addr.is_default" class="default-tag">默认</text>
              <text class="tag-tag">{{ addr.tag }}</text>
            </view>
          </view>
          <text class="address-detail">{{ addr.address }}</text>
        </view>
        <view class="address-actions">
          <view class="action-btn edit-btn" @click.stop="onEditBtnClick(idx)">
            <text class="action-icon">✏️</text>
            <text class="action-text">编辑</text>
          </view>
          <view class="action-btn del-btn" @click.stop="deleteAddress(idx)">
            <text class="action-icon">🗑️</text>
            <text class="action-text">删除</text>
          </view>
        </view>
      </view>
    </view>
    <view class="add-btn" @click="onAddBtnClick">
      <text class="add-icon">+</text>
      <text class="add-text">添加新地址</text>
    </view>
    <!-- 新增/编辑弹窗 -->
    <view v-if="showAdd" class="address-modal-mask" @click.self="showAdd = false">
      <view class="address-modal address-modal-flex">
        <!-- 上半部分地图 -->
        <view class="modal-map-wrapper">
          <map
            class="modal-map"
            :latitude="modalMapLat"
            :longitude="modalMapLng"
            :markers="addressMarker"
            :scale="modalMapScale"
            :enable-zoom="true"
            :enable-scroll="true"
            :show-location="false"
            @tap="onModalMapTap"
          ></map>
        </view>
        <!-- 下半部分表单 -->
        <view class="modal-form-section">
          <view class="modal-header">
            <text class="modal-title">{{ editIdx === -1 ? '新增地址' : '编辑地址' }}</text>
            <text class="modal-close" @click="showAdd = false">×</text>
          </view>
          <view class="form-section">
            <view class="input-group">
              <text class="input-label">收货人</text>
              <input v-model="form.name" placeholder="请输入收货人姓名" class="modal-input" />
            </view>
            <view class="input-group">
              <text class="input-label">手机号</text>
              <input v-model="form.phone" placeholder="请输入手机号码" class="modal-input" type="number" />
            </view>
            <view class="input-group">
              <text class="input-label">详细地址</text>
              <textarea v-model="form.detail" placeholder="请输入详细地址" class="modal-textarea" @input="onDetailInput" />
            </view>
          </view>
          <view class="tag-section">
            <text class="section-title">地址标签</text>
            <view class="tag-options">
              <view 
                v-for="tag in tags" 
                :key="tag"
                :class="['tag-option', form.tag === tag ? 'selected' : '']"
                @click="form.tag = tag"
              >
                {{ tag }}
              </view>
            </view>
          </view>
          <view class="default-section">
            <text class="default-title">设为默认地址</text>
            <switch 
              :checked="form.isDefault" 
              @change="form.isDefault = $event.detail.value"
              color="#1890ff"
            />
          </view>
          <view class="modal-actions">
            <button class="modal-btn cancel" @click="showAdd = false">取消</button>
            <button class="modal-btn confirm" @click="saveAddress">保存</button>
          </view>
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
      userLat: 39.908823,
      userLng: 116.397470,
      allMarkers: [],
      selectedAddress: null,
      addressList: [],
      showAdd: false,
      form: { name: '', phone: '', detail: '', tag: '家', isDefault: false, lat: '', lng: '', address: '' },
      editIdx: -1,
      tags: ['家', '公司', '学校'],
      chooseMode: false,
      userId: null,
      userInfo: null,
      mapScale: 14, // 新增缩放级别
      highlightMarkerId: null, // 高亮marker
      // 弹窗地图相关
      modalMapLat: 39.908823,
      modalMapLng: 116.397470,
      modalMapScale: 16,
      modalMapMarkers: [],
      modalHighlightMarkerId: 'form',
      addressMarker: [], // 自定义蓝点marker
    };
  },
  onLoad() {
    this.getUserInfo();
    this.getUserLocation();
    this.getAddressList();
    this.testBackendConnection();
  },
  onShow() {
    this.checkLoginStatus();
    this.getAddressList();
    // 兼容switchTab跳转参数
    const pages = getCurrentPages();
    const current = pages[pages.length - 1];
    if (current.options && current.options.choose) this.chooseMode = true;
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
    // 获取地址列表
    async getAddressList() {
      if (!this.userId) {
        console.log('用户ID为空，跳过获取地址列表');
        this.addressList = [];
        return;
      }
      
      try {
        console.log('开始获取地址列表，用户ID:', this.userId);
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/address/user/${this.userId}`,
          method: 'GET',
          timeout: 10000
        });
        
        console.log('地址列表响应:', { error, res });
        
        // 检查是否有错误
        if (error) {
          console.error('请求错误:', error);
          this.addressList = [];
          uni.showToast({ 
            title: '网络请求失败', 
            icon: 'none',
            duration: 2000
          });
          return;
        }
        
        // 检查响应状态
        if (res && res.statusCode === 200 && res.data) {
          this.addressList = res.data;
          console.log('地址列表获取成功，数量:', this.addressList.length);
        } else {
          console.error('获取地址失败，状态码:', res?.statusCode, '响应:', res?.data);
          this.addressList = [];
          uni.showToast({ 
            title: '获取地址列表失败', 
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        console.error('获取地址失败:', error);
        this.addressList = [];
        
        // 检查是否是网络错误
        if (error.errMsg && error.errMsg.includes('timeout')) {
          uni.showToast({ 
            title: '网络超时，请检查网络连接', 
            icon: 'none',
            duration: 2000
          });
        } else {
          uni.showToast({ 
            title: '获取地址列表失败', 
            icon: 'none',
            duration: 2000
          });
        }
      }
      this.updateAllMarkers();
    },
    async chooseThis(idx) {
      try {
        const address = this.addressList[idx];
        const [error, res] = await uni.request({
          url: `http://localhost:3000/api/address/${address.id}/default`,
          method: 'PUT',
          data: { user_id: this.userId }
        });
        
        if (error) {
          console.error('设置默认地址请求错误:', error);
          uni.showToast({ title: '设置默认地址失败', icon: 'none' });
          return;
        }
        
        if (res && res.statusCode === 200) {
          uni.navigateBack();
        } else {
          uni.showToast({ title: '设置默认地址失败', icon: 'none' });
        }
      } catch (error) {
        console.error('设置默认地址失败:', error);
        uni.showToast({ title: '设置默认地址失败', icon: 'none' });
      }
    },
    getLocation() {
      uni.showLoading({ title: '定位中...' });
      
      uni.getLocation({
        type: 'gcj02', // 使用gcj02坐标系统，与百度地图兼容
        success: (res) => {
          this.form.lat = res.latitude;
          this.form.lng = res.longitude;
          
          // 根据坐标获取地址信息
          this.reverseGeocode(res.latitude, res.longitude, true);
          
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
    
    // 逆地理编码 - 根据坐标获取地址
    async reverseGeocode(latitude, longitude, updateForm = false) {
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
        
        const [error, res] = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET',
          timeout: 10000
        });
        
        if (!error && res.data && res.data.result) {
          const result = res.data.result;
          if (updateForm) {
            this.form.address = result.formatted_address || '未知地址';
            // 如果详细地址为空，使用解析的地址
            if (!this.form.detail) {
              this.form.detail = result.formatted_address || '未知地址';
            }
          }
          this.selectedAddress = {
            name: '新选位置',
            address: result.formatted_address,
            lat: latitude,
            lng: longitude
          };
        } else {
          if (updateForm) this.form.address = '未知地址';
        }
      } catch (error) {
        if (updateForm) this.form.address = '未知地址';
      }
    },
    
    // 打开地图选择页面
    openBaiduMap() {
      uni.navigateTo({
        url: '/pkg_user/address/baiduMapSelect'
      });
    },
    
    // 从地图页面更新位置信息
    updateLocationFromMap(addressInfo) {
      this.form.lat = addressInfo.latitude;
      this.form.lng = addressInfo.longitude;
      this.form.address = addressInfo.address;
      // 如果详细地址为空，使用地图返回的地址
      if (!this.form.detail) {
        this.form.detail = addressInfo.address;
      }
      uni.showToast({ title: '位置已选择', icon: 'success' });
    },
    async saveAddress() {
      if (!this.form.name || !this.form.phone || !this.form.detail) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      try {
        const addressData = {
          user_id: this.userId,
          name: this.form.name,
          phone: this.form.phone,
          address: this.form.detail,
          tag: this.form.tag,
          is_default: this.form.isDefault,
          lat: this.form.lat,
          lng: this.form.lng
        };
        
        let url, method;
        if (this.editIdx === -1) {
          // 新增地址
          url = 'http://localhost:3000/api/address';
          method = 'POST';
        } else {
          // 编辑地址
          const address = this.addressList[this.editIdx];
          url = `http://localhost:3000/api/address/${address.id}`;
          method = 'PUT';
        }
        
        const [error, res] = await uni.request({
          url: url,
          method: method,
          data: addressData
        });
        
        if (error) {
          console.error('保存地址请求错误:', error);
          uni.showToast({ title: '保存地址失败', icon: 'none' });
          return;
        }
        
        if (res && res.statusCode === 200) {
          uni.showToast({ title: '地址保存成功', icon: 'success' });
          this.showAdd = false; // 关闭弹窗
          this.getAddressList(); // 刷新地址列表
        } else {
          uni.showToast({ title: '保存地址失败', icon: 'none' });
        }
      } catch (error) {
        console.error('保存地址失败:', error);
        uni.showToast({ title: '保存地址失败', icon: 'none' });
      }
    },
    editAddress(idx) {
      const address = this.addressList[idx];
      this.form = {
        name: address.name,
        phone: address.phone,
        detail: address.address,
        tag: address.tag,
        isDefault: address.is_default,
        lat: address.lat,
        lng: address.lng,
        address: address.address
      };
      this.editIdx = idx;
      this.showAdd = true;
    },
    async deleteAddress(idx) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个地址吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const address = this.addressList[idx];
              const [error, res] = await uni.request({
                url: `http://localhost:3000/api/address/${address.id}`,
                method: 'DELETE',
                data: { user_id: this.userId }
              });
              
              if (error) {
                console.error('删除地址请求错误:', error);
                uni.showToast({ title: '删除失败', icon: 'none' });
                return;
              }
              
              if (res && res.statusCode === 200) {
                this.addressList.splice(idx, 1);
                uni.showToast({ title: '删除成功', icon: 'success' });
              } else {
                console.error('删除地址失败，状态码:', res?.statusCode, '响应:', res?.data);
                uni.showToast({ title: '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除地址失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    // 测试后端连接
    async testBackendConnection() {
      try {
        console.log('测试后端连接...');
        const res = await uni.request({
          url: 'http://localhost:3000/api/address/user/1',
          method: 'GET',
          timeout: 5000
        });
        console.log('后端连接测试成功:', res.statusCode);
      } catch (error) {
        console.error('后端连接测试失败:', error);
        uni.showModal({
          title: '连接提示',
          content: '无法连接到后端服务器，请确保服务器已启动',
          showCancel: false,
          confirmText: '我知道了'
        });
      }
    },
    
    // 获取用户当前位置
    getUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.userLat = res.latitude;
          this.userLng = res.longitude;
          this.updateAllMarkers();
        },
        fail: () => {
          // 定位失败时默认北京
          this.userLat = 39.908823;
          this.userLng = 116.397470;
          this.updateAllMarkers();
        }
      });
    },
    // 地图点击选点
    onMapTap(e) {
      const { latitude, longitude } = e.detail;
      if (!latitude || !longitude) return;
      this.form.lat = latitude;
      this.form.lng = longitude;
      this.reverseGeocode(latitude, longitude, true);
      this.userLat = latitude;
      this.userLng = longitude;
      this.mapScale = 16;
      this.highlightMarkerId = 'form';
      this.updateAllMarkers();
      uni.showToast({ title: '已选中地图位置', icon: 'success' });
    },
    // marker点击高亮
    onMapMarkerTap(e) {
      const markerId = e.detail.markerId;
      this.highlightMarkerId = markerId;
      if (markerId === -1) {
        this.selectedAddress = {
          name: '当前位置',
          address: '',
          lat: this.userLat,
          lng: this.userLng
        };
      } else if (this.addressList && this.addressList[markerId]) {
        this.selectedAddress = this.addressList[markerId];
        // 地图中心跳转到该地址
        if (this.selectedAddress.lat && this.selectedAddress.lng) {
          this.userLat = Number(this.selectedAddress.lat);
          this.userLng = Number(this.selectedAddress.lng);
        }
      } else if (markerId === 'form' && this.form.lat && this.form.lng) {
        this.selectedAddress = {
          name: '新选位置',
          address: this.form.address,
          lat: this.form.lat,
          lng: this.form.lng
        };
        this.userLat = Number(this.form.lat);
        this.userLng = Number(this.form.lng);
      }
      this.updateAllMarkers();
    },
    // 更新所有marker，支持高亮
    updateAllMarkers() {
      const markers = [];
      // 用户当前位置marker
      markers.push({
        id: -1,
        latitude: this.userLat,
        longitude: this.userLng,
        iconPath: this.highlightMarkerId === -1 ? '/static/images/map-marker.png' : '/static/images/map-marker.png',
        width: 44,
        height: 44,
        callout: {
          content: '当前位置',
          color: this.highlightMarkerId === -1 ? '#1890ff' : '#333',
          fontSize: 14,
          borderRadius: 8,
          bgColor: '#fff',
          padding: 8,
          display: 'ALWAYS'
        }
      });
      // 地址列表marker
      if (Array.isArray(this.addressList)) {
        this.addressList.forEach((addr, idx) => {
          if (addr.lat && addr.lng) {
            markers.push({
              id: idx,
              latitude: Number(addr.lat),
              longitude: Number(addr.lng),
              iconPath: this.highlightMarkerId === idx ? '/static/images/map-marker.png' : '/static/images/map-marker.png',
              width: this.highlightMarkerId === idx ? 48 : 40,
              height: this.highlightMarkerId === idx ? 48 : 40,
              callout: {
                content: addr.name + '\n' + addr.address,
                color: this.highlightMarkerId === idx ? '#1890ff' : '#333',
                fontSize: 14,
                borderRadius: 8,
                bgColor: '#fff',
                padding: 8,
                display: 'ALWAYS'
              }
            });
          }
        });
      }
      // 新选点marker（表单）
      if (this.form.lat && this.form.lng) {
        markers.push({
          id: 'form',
          latitude: Number(this.form.lat),
          longitude: Number(this.form.lng),
          iconPath: this.highlightMarkerId === 'form' ? '/static/images/map-marker.png' : '/static/images/map-marker.png',
          width: this.highlightMarkerId === 'form' ? 48 : 40,
          height: this.highlightMarkerId === 'form' ? 48 : 40,
          callout: {
            content: '新选位置',
            color: this.highlightMarkerId === 'form' ? '#1890ff' : '#333',
            fontSize: 14,
            borderRadius: 8,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        });
      }
      this.allMarkers = markers;
    },
    // 逆地理编码API封装
    async reverseGeocode(latitude, longitude, updateForm = false) {
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
        const [error, res] = await uni.request({
          url: `${url}?${queryString}`,
          method: 'GET',
          timeout: 10000
        });
        if (!error && res.data && res.data.result) {
          const result = res.data.result;
          if (updateForm) {
            this.form.address = result.formatted_address || '未知地址';
            if (!this.form.detail) {
              this.form.detail = result.formatted_address || '未知地址';
            }
          }
          this.selectedAddress = {
            name: '新选位置',
            address: result.formatted_address,
            lat: latitude,
            lng: longitude
          };
        } else {
          if (updateForm) this.form.address = '未知地址';
        }
      } catch (error) {
        if (updateForm) this.form.address = '未知地址';
      }
    },
    // 详细地址输入实时定位，蓝点marker实时跳转
    async onDetailInput(e) {
      this.form.detail = e.detail.value;
      if (!this.form.detail) return;
      // 调用百度地理编码API
      const url = `${baiduMapConfig.baseUrl}/geocoding/v3`;
      const params = {
        address: this.form.detail,
        output: 'json',
        ak: baiduMapConfig.ak,
        ret_coordtype: 'gcj02ll'
      };
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      const [error, res] = await uni.request({
        url: `${url}?${queryString}`,
        method: 'GET',
        timeout: 10000
      });
      if (!error && res.data && res.data.result && res.data.result.location) {
        const { lat, lng } = res.data.result.location;
        // 实时更新地图中心点和表单经纬度，蓝点marker自动跳转
        this.modalMapLat = lat;
        this.modalMapLng = lng;
        this.form.lat = lat;
        this.form.lng = lng;
        this.addressMarker = [{
          id: 1,
          latitude: lat,
          longitude: lng,
          iconPath: 'circle',
          width: 32,
          height: 32,
          color: '#1890ff',
          borderWidth: 2,
          borderColor: '#fff',
          alpha: 1
        }];
      }
    },
    // 新增/编辑弹窗打开时地图跳转并精准定位
    showAddModal(isEdit = false, idx = -1) {
      if (isEdit && idx >= 0) {
        this.editAddress(idx);
        if (this.form.lat && this.form.lng) {
          this.modalMapLat = Number(this.form.lat);
          this.modalMapLng = Number(this.form.lng);
          this.addressMarker = [{
            id: 1,
            latitude: Number(this.form.lat),
            longitude: Number(this.form.lng),
            iconPath: 'circle',
            width: 32,
            height: 32,
            color: '#1890ff',
            borderWidth: 2,
            borderColor: '#fff',
            alpha: 1
          }];
        } else {
          this.getModalUserLocation();
        }
      } else {
        this.form = { name: '', phone: '', detail: '', tag: '家', isDefault: false, lat: '', lng: '', address: '' };
        this.editIdx = -1;
        this.getModalUserLocation();
      }
      this.modalMapScale = 16;
      this.modalHighlightMarkerId = 'form';
      this.updateModalMapMarkers();
      this.showAdd = true;
    },
    // 新增按钮事件
    onAddBtnClick() {
      this.showAddModal(false);
    },
    // 编辑按钮事件
    onEditBtnClick(idx) {
      this.showAddModal(true, idx);
    },
    // 弹窗地图精准定位
    getModalUserLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.modalMapLat = res.latitude;
          this.modalMapLng = res.longitude;
          this.form.lat = res.latitude;
          this.form.lng = res.longitude;
          this.reverseGeocode(res.latitude, res.longitude, true);
          this.addressMarker = [{
            id: 1,
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: 'circle',
            width: 32,
            height: 32,
            color: '#1890ff',
            borderWidth: 2,
            borderColor: '#fff',
            alpha: 1
          }];
        },
        fail: () => {
          this.modalMapLat = 39.908823;
          this.modalMapLng = 116.397470;
          this.addressMarker = [{
            id: 1,
            latitude: 39.908823,
            longitude: 116.397470,
            iconPath: 'circle',
            width: 32,
            height: 32,
            color: '#1890ff',
            borderWidth: 2,
            borderColor: '#fff',
            alpha: 1
          }];
        }
      });
    },
    // 弹窗地图点击选点
    onModalMapTap(e) {
      const { latitude, longitude } = e.detail;
      if (!latitude || !longitude) return;
      this.form.lat = latitude;
      this.form.lng = longitude;
      this.modalMapLat = latitude;
      this.modalMapLng = longitude;
      this.reverseGeocode(latitude, longitude, true);
      this.addressMarker = [{
        id: 1,
        latitude: latitude,
        longitude: longitude,
        iconPath: 'circle',
        width: 32,
        height: 32,
        color: '#1890ff',
        borderWidth: 2,
        borderColor: '#fff',
        alpha: 1
      }];
      uni.showToast({ title: '已选中地图位置', icon: 'success' });
    },
    // 弹窗marker点击高亮
    onModalMapMarkerTap(e) {
      const markerId = e.detail.markerId;
      this.modalHighlightMarkerId = markerId;
      this.updateModalMapMarkers();
    },
    // 弹窗地图marker渲染
    updateModalMapMarkers() {
      const markers = [];
      if (this.form.lat && this.form.lng) {
        markers.push({
          id: 'form',
          latitude: Number(this.form.lat),
          longitude: Number(this.form.lng),
          iconPath: this.modalHighlightMarkerId === 'form' ? '/static/images/map-marker.png' : '/static/images/map-marker.png',
          width: this.modalHighlightMarkerId === 'form' ? 56 : 44,
          height: this.modalHighlightMarkerId === 'form' ? 56 : 44,
          callout: {
            content: '选中位置',
            color: this.modalHighlightMarkerId === 'form' ? '#1890ff' : '#333',
            fontSize: 16,
            borderRadius: 8,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        });
      }
      this.modalMapMarkers = markers;
    },
  }
};
</script>

<style scoped>
.address-page { 
  min-height: 100vh; 
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0 24rpx 40rpx 24rpx; 
}

.address-header {
  padding: 40rpx 0 32rpx 0;
  text-align: center;
}

.header-title {
  font-size: 42rpx;
  font-weight: bold;
  color: #2c3e50;
  display: block;
  margin-bottom: 8rpx;
}

.header-subtitle {
  font-size: 26rpx;
  color: #7f8c8d;
  display: block;
}

.address-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  opacity: 0.3;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #95a5a6;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #bdc3c7;
}

.address-list {
  margin-bottom: 32rpx;
}

.address-item { 
  background: #fff; 
  border-radius: 20rpx; 
  margin-bottom: 24rpx; 
  padding: 32rpx 24rpx; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.1);
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.address-item:active {
  transform: scale(0.98);
  border-color: #1890ff;
}

.address-info { 
  flex: 1; 
  margin-right: 24rpx;
}

.address-header-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: flex-start; 
  margin-bottom: 16rpx; 
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.address-name { 
  font-size: 32rpx; 
  font-weight: bold; 
  color: #2c3e50; 
  margin-bottom: 4rpx;
}

.address-phone {
  font-size: 26rpx;
  color: #7f8c8d;
}

.address-tags { 
  display: flex; 
  gap: 8rpx; 
  flex-shrink: 0;
}

.default-tag { 
  background: linear-gradient(135deg, #1890ff, #40a9ff); 
  color: #fff; 
  font-size: 20rpx; 
  padding: 6rpx 12rpx; 
  border-radius: 12rpx; 
  font-weight: bold;
}

.tag-tag { 
  background: #f0f8ff; 
  color: #1890ff; 
  font-size: 20rpx; 
  padding: 6rpx 12rpx; 
  border-radius: 12rpx; 
  border: 1rpx solid #d6e4ff;
}

.address-detail { 
  font-size: 28rpx; 
  color: #34495e; 
  line-height: 1.5;
}

.address-actions { 
  display: flex; 
  flex-direction: column; 
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.9);
}

.edit-btn {
  background: #e6f7ff;
  color: #1890ff;
}

.del-btn {
  background: #fff2f0;
  color: #ff4d4f;
}

.action-icon {
  font-size: 24rpx;
  margin-bottom: 4rpx;
}

.action-text {
  font-size: 22rpx;
  font-weight: bold;
}

.add-btn { 
  width: 100%; 
  background: linear-gradient(135deg, #1890ff, #40a9ff); 
  color: #fff; 
  border-radius: 20rpx; 
  text-align: center; 
  padding: 32rpx 0; 
  font-size: 32rpx; 
  font-weight: bold; 
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.add-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
}

.add-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
  font-weight: bold;
}

.add-text {
  font-weight: bold;
}

.address-modal-mask { 
  position: fixed; 
  left: 0; 
  right: 0; 
  top: 0; 
  bottom: 0; 
  background: rgba(0,0,0,0.4); 
  z-index: 1000; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  backdrop-filter: blur(4rpx);
}

.address-modal { 
  background: #fff; 
  border-radius: 24rpx; 
  padding: 0; 
  width: 85vw; 
  max-width: 650rpx; 
  max-height: 85vh; 
  overflow-y: auto;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 32rpx 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title { 
  font-size: 36rpx; 
  font-weight: bold; 
  color: #2c3e50;
}

.modal-close {
  font-size: 48rpx;
  color: #95a5a6;
  cursor: pointer;
  padding: 8rpx;
}

.form-section {
  padding: 32rpx;
}

.input-group {
  margin-bottom: 32rpx;
}

.input-label {
  font-size: 28rpx;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 12rpx;
  display: block;
}

.modal-input { 
  width: 100%; 
  border: 2rpx solid #e8e8e8; 
  border-radius: 12rpx; 
  padding: 20rpx 16rpx; 
  font-size: 28rpx; 
  background: #fafafa;
  transition: all 0.3s ease;
}

.modal-input:focus {
  border-color: #1890ff;
  background: #fff;
}

.modal-textarea {
  width: 100%;
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 20rpx 16rpx;
  font-size: 28rpx;
  background: #fafafa;
  min-height: 120rpx;
  transition: all 0.3s ease;
}

.modal-textarea:focus {
  border-color: #1890ff;
  background: #fff;
}

.tag-section { 
  padding: 0 32rpx 32rpx 32rpx;
}

.section-title { 
  font-size: 28rpx; 
  color: #2c3e50; 
  font-weight: bold;
  margin-bottom: 20rpx; 
  display: block; 
}

.tag-options { 
  display: flex; 
  gap: 16rpx; 
}

.tag-option { 
  padding: 16rpx 24rpx; 
  border: 2rpx solid #e8e8e8; 
  border-radius: 12rpx; 
  font-size: 26rpx; 
  color: #7f8c8d; 
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.tag-option.selected { 
  background: linear-gradient(135deg, #1890ff, #40a9ff); 
  color: #fff; 
  border-color: #1890ff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
}

.default-section { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 32rpx 32rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.default-title { 
  font-size: 28rpx; 
  color: #2c3e50;
  font-weight: bold;
}

.modal-actions { 
  display: flex; 
  justify-content: space-between;
  padding: 32rpx;
  gap: 24rpx;
}

.modal-btn { 
  flex: 1;
  padding: 24rpx 0; 
  border-radius: 12rpx; 
  font-size: 30rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.cancel { 
  background: #f5f5f5; 
  color: #7f8c8d;
}

.cancel:active {
  background: #e8e8e8;
}

.confirm { 
  background: linear-gradient(135deg, #1890ff, #40a9ff); 
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
}

.confirm:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(24, 144, 255, 0.3);
}

.location-section {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.location-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e8e8e8;
  background: #fafafa;
  transition: all 0.3s ease;
}

.location-btn:active {
  transform: scale(0.98);
  border-color: #1890ff;
}

.location-icon {
  font-size: 28rpx;
  margin-bottom: 4rpx;
}

.location-text {
  font-size: 24rpx;
  color: #7f8c8d;
}

.location-info {
  margin-top: 16rpx;
  padding: 16rpx 24rpx;
  background: #f0f8ff;
  border-radius: 12rpx;
  border: 1rpx solid #d6e4ff;
}

.location-coords {
  font-size: 24rpx;
  color: #1890ff;
  margin-bottom: 8rpx;
}

.location-address {
  font-size: 26rpx;
  color: #34495e;
  line-height: 1.5;
}

.address-map-wrapper {
  width: 100vw;
  height: 400rpx;
  position: relative;
}
.address-map {
  width: 100vw;
  height: 400rpx;
}
.map-address-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.95);
  padding: 24rpx 20rpx;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
  z-index: 10;
  text-align: left;
}
.map-address-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}
.map-address-detail {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}
.map-address-coord {
  font-size: 22rpx;
  color: #999;
}
.address-modal-flex {
  display: flex;
  flex-direction: column;
  width: 100vw;
  max-width: 100vw;
  height: 90vh;
  max-height: 90vh;
  padding: 0;
}
.modal-map-wrapper {
  width: 100vw;
  height: 50vh;
  min-height: 300px;
  max-height: 60vh;
  background: #f0f8ff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}
.modal-map {
  width: 100vw;
  height: 100%;
}
.modal-form-section {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
  padding-bottom: 24rpx;
}
</style> 