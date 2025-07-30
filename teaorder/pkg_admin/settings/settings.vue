<template>
  <view class="settings-container">
    <!-- 基本设置 -->
    <view class="settings-section">
      <view class="section-title">基本设置</view>
      <view class="setting-item">
        <text class="setting-label">店铺名称</text>
        <input class="setting-input" v-model="settings.shopName" placeholder="请输入店铺名称" />
      </view>
      <view class="setting-item">
        <text class="setting-label">联系电话</text>
        <input class="setting-input" v-model="settings.phone" placeholder="请输入联系电话" />
      </view>
      <view class="setting-item">
        <text class="setting-label">营业时间</text>
        <input class="setting-input" v-model="settings.businessHours" placeholder="如：09:00-22:00" />
      </view>
      <view class="setting-item">
        <text class="setting-label">店铺地址</text>
        <input class="setting-input" v-model="settings.address" placeholder="请输入店铺地址" />
      </view>
    </view>

    <!-- 订单设置 -->
    <view class="settings-section">
      <view class="section-title">订单设置</view>
      <view class="setting-item">
        <text class="setting-label">自动接单</text>
        <switch :checked="settings.autoAccept" @change="onAutoAcceptChange" />
      </view>
      <view class="setting-item">
        <text class="setting-label">订单超时时间（分钟）</text>
        <input class="setting-input" type="number" v-model="settings.orderTimeout" placeholder="30" />
      </view>
      <view class="setting-item">
        <text class="setting-label">最小起送金额</text>
        <input class="setting-input" type="number" v-model="settings.minOrderAmount" placeholder="0" />
      </view>
    </view>

    <!-- 通知设置 -->
    <view class="settings-section">
      <view class="section-title">通知设置</view>
      <view class="setting-item">
        <text class="setting-label">新订单通知</text>
        <switch :checked="settings.newOrderNotification" @change="onNewOrderNotificationChange" />
      </view>
      <view class="setting-item">
        <text class="setting-label">订单状态变更通知</text>
        <switch :checked="settings.orderStatusNotification" @change="onOrderStatusNotificationChange" />
      </view>
      <view class="setting-item">
        <text class="setting-label">系统消息通知</text>
        <switch :checked="settings.systemNotification" @change="onSystemNotificationChange" />
      </view>
    </view>

    <!-- 安全设置 -->
    <view class="settings-section">
      <view class="section-title">安全设置</view>
      <view class="setting-item">
        <text class="setting-label">修改密码</text>
        <button class="setting-btn" @click="showChangePassword = true">修改</button>
      </view>
      <view class="setting-item">
        <text class="setting-label">登录日志</text>
        <button class="setting-btn" @click="viewLoginLogs">查看</button>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="settings-section">
      <view class="section-title">数据管理</view>
      <view class="setting-item">
        <text class="setting-label">数据备份</text>
        <button class="setting-btn" @click="backupData">备份</button>
      </view>
      <view class="setting-item">
        <text class="setting-label">清除缓存</text>
        <button class="setting-btn" @click="clearCache">清除</button>
      </view>
    </view>

    <!-- 保存按钮 -->
    <view class="save-section">
      <button class="save-btn" @click="saveSettings">保存设置</button>
    </view>

    <!-- 修改密码弹窗 -->
    <view class="modal" v-if="showChangePassword">
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">修改密码</text>
          <text class="modal-close" @click="showChangePassword = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">当前密码</text>
            <input class="form-input" type="password" v-model="passwordForm.oldPassword" placeholder="请输入当前密码" />
          </view>
          <view class="form-item">
            <text class="form-label">新密码</text>
            <input class="form-input" type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" />
          </view>
          <view class="form-item">
            <text class="form-label">确认新密码</text>
            <input class="form-input" type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="showChangePassword = false">取消</button>
          <button class="modal-btn confirm" @click="changePassword">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      settings: {
        shopName: '茶饮店',
        phone: '13800138000',
        businessHours: '09:00-22:00',
        address: '某某街道某某号',
        autoAccept: true,
        orderTimeout: 30,
        minOrderAmount: 0,
        newOrderNotification: true,
        orderStatusNotification: true,
        systemNotification: true
      },
      showChangePassword: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },
  onLoad() {
    this.loadSettings();
  },
  methods: {
    // 加载设置
    async loadSettings() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/settings',
          method: 'GET'
        });
        if (res.data.success) {
          this.settings = { ...this.settings, ...res.data.settings };
        }
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    },

    // 保存设置
    async saveSettings() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/settings',
          method: 'POST',
          data: this.settings
        });
        if (res.data.success) {
          uni.showToast({ title: '设置保存成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.data.message, icon: 'none' });
        }
      } catch (error) {
        console.error('保存设置失败:', error);
        uni.showToast({ title: '保存失败', icon: 'none' });
      }
    },

    // 开关事件处理
    onAutoAcceptChange(e) {
      this.settings.autoAccept = e.detail.value;
    },

    onNewOrderNotificationChange(e) {
      this.settings.newOrderNotification = e.detail.value;
    },

    onOrderStatusNotificationChange(e) {
      this.settings.orderStatusNotification = e.detail.value;
    },

    onSystemNotificationChange(e) {
      this.settings.systemNotification = e.detail.value;
    },

    // 修改密码
    async changePassword() {
      if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }

      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' });
        return;
      }

      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/change-password',
          method: 'POST',
          data: {
            oldPassword: this.passwordForm.oldPassword,
            newPassword: this.passwordForm.newPassword
          }
        });

        if (res.data.success) {
          uni.showToast({ title: '密码修改成功', icon: 'success' });
          this.showChangePassword = false;
          this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
        } else {
          uni.showToast({ title: res.data.message, icon: 'none' });
        }
      } catch (error) {
        console.error('修改密码失败:', error);
        uni.showToast({ title: '修改失败', icon: 'none' });
      }
    },

    // 查看登录日志
    viewLoginLogs() {
      uni.showToast({ title: '功能开发中', icon: 'none' });
    },

    // 数据备份
    async backupData() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/backup',
          method: 'POST'
        });
        if (res.data.success) {
          uni.showToast({ title: '数据备份成功', icon: 'success' });
        } else {
          uni.showToast({ title: res.data.message, icon: 'none' });
        }
      } catch (error) {
        console.error('数据备份失败:', error);
        uni.showToast({ title: '备份失败', icon: 'none' });
      }
    },

    // 清除缓存
    clearCache() {
      uni.showModal({
        title: '确认清除',
        content: '确定要清除缓存吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync();
            uni.showToast({ title: '缓存清除成功', icon: 'success' });
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.settings-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 28rpx;
  color: #333;
}

.setting-input {
  flex: 1;
  margin-left: 20rpx;
  padding: 10rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.setting-btn {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.save-section {
  padding: 40rpx 0;
}

.save-btn {
  width: 100%;
  background: #667eea;
  color: #fff;
  border: none;
  padding: 30rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: bold;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16rpx;
  width: 80%;
  max-width: 600rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  padding: 20rpx;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.modal-btn.cancel {
  background: #f8f9fa;
  color: #333;
}

.modal-btn.confirm {
  background: #667eea;
  color: #fff;
}
</style> 