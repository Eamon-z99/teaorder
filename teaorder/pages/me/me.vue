<template>
  <view class="me-container">
    <view class="user-info" @click="handleUserClick">
      <image class="avatar" :src="userInfo ? userInfo.avatar : ($oss + 'button/我的.png')" mode="aspectFit"></image>
      <view class="user-details">
        <text class="user-name">{{ userInfo ? userInfo.nickname : '未登录' }}</text>
        <text class="user-phone" v-if="userInfo && userInfo.phone">{{ userInfo.phone }}</text>
        <text class="user-signature" v-if="userInfo && userInfo.signature">{{ userInfo.signature }}</text>
        <text class="login-hint" v-if="!userInfo">点击登录享受会员福利</text>
      </view>
      <text class="arrow">&gt;</text>
    </view>
    
    <view class="menu-list">
      <view class="menu-item" @click="navigateTo('myOrder')">
        <text>我的订单</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <view class="menu-item" @click="navigateTo('points')">
        <text>积分兑好礼</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <view class="menu-item" @click="navigateTo('settings')">
        <text>设置</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <!-- 新增注册骑手入口 -->
      <view class="menu-item" @click="showRiderModal = true">
        <text>注册骑手</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
    </view>
    <view class="address-manage-entry" @click="goToAddress">
      <text>地址管理</text>
      <text class="arrow">&gt;</text>
    </view>
    
    <!-- 登录状态显示退出按钮 -->
    <view class="logout-section" v-if="userInfo">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>

    <!-- 注册骑手弹窗 -->
    <view v-if="showRiderModal" class="modal-mask">
      <view class="modal-content">
        <view class="modal-title">注册骑手</view>
        <view class="modal-form">
          <input v-model="riderForm.name" placeholder="姓名" class="modal-input" />
          <input v-model="riderForm.phone" placeholder="手机号" class="modal-input" />
          <input v-model="riderForm.id_card" placeholder="身份证号" class="modal-input" />
          <!-- 可选：上传照片功能，可后续完善 -->
        </view>
        <view class="modal-actions">
          <button class="modal-btn" @click="submitRider">提交</button>
          <button class="modal-btn cancel" @click="showRiderModal = false">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: null,
      showRiderModal: false,
      riderForm: {
        name: '',
        phone: '',
        id_card: ''
      }
    };
  },
  onShow() {
    this.checkLoginStatus();
  },
  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync('userInfo');
      const token = uni.getStorageSync('token');
      if (userInfo && token) {
        this.userInfo = userInfo;
      } else {
        this.userInfo = null;
      }
    },
    handleUserClick() {
      if (!this.userInfo) {
        // 未登录，跳转到登录页
        uni.navigateTo({
          url: '/pkg_user/login/login'
        });
      } else {
        // 跳转到用户信息编辑页
        uni.navigateTo({
          url: '/pkg_user/editUser/editUser'
        });
      }
    },
    navigateTo(page) {
      if (page === 'myOrder') {
        uni.switchTab({
          url: '/pages/myOrder/myOrder'
        });
      } else if (page === 'points') {
        uni.navigateTo({
          url: '/pkg_user/points/points'
        });
      } else if (page === 'settings') {
        uni.showToast({
          title: '设置功能开发中',
          icon: 'none'
        });
      }
    },
    goToAddress() {
      uni.navigateTo({ url: '/pkg_user/address/address' });
    },
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除登录信息
            uni.removeStorageSync('userInfo');
            uni.removeStorageSync('token');
            this.userInfo = null;
            
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          }
        }
      });
    },
    async submitRider() {
      if (!this.riderForm.name || !this.riderForm.phone || !this.riderForm.id_card) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      try {
        const userInfo = uni.getStorageSync('userInfo');
        const res = await uni.request({
          url: 'http://localhost:3000/api/user/register-rider',
          method: 'POST',
          data: {
            user_id: userInfo.id,
            name: this.riderForm.name,
            phone: this.riderForm.phone,
            id_card: this.riderForm.id_card
          }
        });
        if (res.data.success) {
          uni.showToast({ title: '注册成功', icon: 'success' });
          this.showRiderModal = false;
          // 更新本地用户信息
          userInfo.is_rider = 1;
          uni.setStorageSync('userInfo', userInfo);
          this.userInfo = userInfo;
        } else {
          uni.showToast({ title: res.data.message || '注册失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    }
  }
}
</script>

<style scoped>
.me-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  cursor: pointer;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.user-phone {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.user-signature {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
  display: block;
  word-break: break-all;
}

.login-hint {
  font-size: 24rpx;
  color: #667eea;
}

.menu-list {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  font-size: 32rpx;
  color: #333;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.iconfont {
  font-size: 32rpx;
  color: #999;
}
.address-manage-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 32rpx 24rpx;
  border-radius: 16rpx;
  margin: 24rpx 0;
  font-size: 30rpx;
  color: #333;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  cursor: pointer;
}
.arrow {
  color: #bbb;
  font-size: 32rpx;
}

.logout-section {
  margin-top: 40rpx;
  padding: 0 30rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #ff4757;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.modal-mask {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 30rpx;
  width: 80vw;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.12);
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
  text-align: center;
}
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 32rpx;
}
.modal-input {
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
}
.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}
.modal-btn {
  flex: 1;
  background: linear-gradient(90deg, #667eea, #64b5f6);
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 30rpx;
  padding: 20rpx 0;
  margin: 0 8rpx;
}
.modal-btn.cancel {
  background: #eee;
  color: #333;
}
</style>
