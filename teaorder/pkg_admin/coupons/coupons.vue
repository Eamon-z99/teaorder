<template>
  <view class="coupons-container">
    <!-- 顶部操作栏 -->
    <view class="header-section">
      <view class="header-title">优惠券管理</view>
      <view class="header-actions">
        <button class="action-btn batch-btn" @click="openBatchModal">批量发放</button>
        <button class="add-btn" @click="showAddModal">发放优惠券</button>
      </view>
    </view>

    <!-- 统计信息 -->
    <view v-if="selectedUser" class="stats-section">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">{{ stats.total }}</text>
          <text class="stat-label">总优惠券</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.unused }}</text>
          <text class="stat-label">未使用</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.used }}</text>
          <text class="stat-label">已使用</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ stats.expired }}</text>
          <text class="stat-label">已过期</text>
        </view>
      </view>
    </view>

    <!-- 用户选择/搜索 -->
    <view class="user-filter-section">
      <view class="user-selector">
        <text class="section-label">选择用户</text>
        <picker :key="userList.length" :range="userList" range-key="nickname" @change="onUserChange" class="user-picker">
          <view class="picker-display">
            <text>{{ selectedUser ? selectedUser.nickname + (selectedUser.phone ? '（' + selectedUser.phone + '）' : '') : '请选择用户' }}</text>
            <text class="picker-arrow">▼</text>
          </view>
        </picker>
      </view>
      <view class="user-search">
        <input 
          v-model="userKeyword" 
          placeholder="搜索用户手机号" 
          class="user-search-input"
          @confirm="onUserSearch"
          @input="onUserSearchInput"
        />
        <button class="search-btn" @click="onUserSearch">搜索</button>
        <button v-if="userKeyword" class="clear-search-btn" @click="clearUserSearch">清空</button>
      </view>
    </view>

    <!-- 用户信息展示 -->
    <view v-if="selectedUser" class="user-info-section">
      <view class="user-info">
        <text class="user-name">{{ selectedUser.nickname }}</text>
        <text class="user-phone">{{ selectedUser.phone }}</text>
        <text class="coupon-count">共 {{ coupons.length }} 张优惠券</text>
      </view>
    </view>

    <!-- 优惠券列表 -->
    <view class="coupons-list">
      <view v-for="(coupon, index) in coupons" :key="coupon.id" class="coupon-item">
        <view class="coupon-header">
          <view class="coupon-main">
            <view class="coupon-name">{{ coupon.type }}（面值：¥{{ coupon.value }}）</view>
            <view :class="['coupon-status', getStatusClass(coupon.status)]">{{ getStatusText(coupon.status) }}</view>
          </view>
        </view>
        <view class="coupon-details">
          <view class="detail-row">
            <text class="detail-label">领取时间：</text>
            <text class="detail-value">{{ formatDate(coupon.created_at) }}</text>
          </view>
          <view v-if="coupon.used_at" class="detail-row">
            <text class="detail-label">使用时间：</text>
            <text class="detail-value">{{ formatDate(coupon.used_at) }}</text>
          </view>
        </view>
        <view class="coupon-actions">
          <button v-if="coupon.status === 'unused'" class="action-btn upgrade-btn" @click="showUpgradeModal(coupon)">升级</button>
          <button class="action-btn delete-btn" @click="deleteCoupon(coupon.id)">删除</button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="selectedUser && coupons.length === 0" class="empty-state">
      <text class="empty-text">该用户暂无优惠券</text>
      <button class="empty-action-btn" @click="showAddModal">立即发放</button>
    </view>
    <view v-if="!selectedUser" class="empty-state">
      <text class="empty-text">请先选择用户</text>
    </view>

    <!-- 发放优惠券弹窗 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">发放优惠券</text>
          <text class="modal-close" @click="closeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">选择用户</text>
            <picker :key="userList.length" :range="userList" range-key="nickname" @change="onModalUserChange">
              <view class="picker-text">{{ modalUser ? modalUser.nickname + (modalUser.phone ? '（' + modalUser.phone + '）' : '') : '请选择用户' }}</view>
            </picker>
          </view>
          <view class="form-group">
            <text class="form-label">优惠券类型</text>
            <picker :range="couponTypes" range-key="label" @change="onTypeChange" class="form-picker">
              <view class="picker-text">{{ couponTypes[typeIndex].label }}</view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeModal">取消</button>
          <button class="modal-btn confirm-btn" @click="submitGrantCoupon">确定</button>
        </view>
      </view>
    </view>

    <!-- 升级优惠券弹窗 -->
    <view v-if="showUpgrade" class="modal-overlay" @click="closeUpgradeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">升级优惠券</text>
          <text class="modal-close" @click="closeUpgradeModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">新类型</text>
            <picker :range="couponTypes" range-key="label" @change="onUpgradeTypeChange" class="form-picker">
              <view class="picker-text">{{ couponTypes[upgradeTypeIndex].label }}</view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeUpgradeModal">取消</button>
          <button class="modal-btn confirm-btn" @click="submitUpgradeCoupon">确定</button>
        </view>
      </view>
    </view>

    <!-- 批量发放弹窗 -->
    <view v-if="showBatchModal" class="modal-overlay" @click="closeBatchModal">
      <view class="modal-content batch-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">批量发放优惠券</text>
          <text class="modal-close" @click="closeBatchModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">选择用户（可多选）</text>
            <view class="user-selection-area">
              <view class="user-list">
                <view 
                  v-for="(user, index) in userList" 
                  :key="user.id"
                  :class="['user-item', { selected: selectedUsers.includes(user.id) }]"
                  @click="toggleUserSelection(user.id)"
                >
                  <view class="user-info">
                    <text class="user-name">{{ user.nickname }}</text>
                    <text class="user-phone">{{ user.phone || '无手机号' }}</text>
                  </view>
                  <view class="selection-indicator">
                    <text v-if="selectedUsers.includes(user.id)" class="selected-icon">✓</text>
                  </view>
                </view>
              </view>
              <view class="selection-summary">
                <text class="summary-text">已选择 {{ selectedUsers.length }} 个用户</text>
                <button class="clear-btn" @click="clearUserSelection">清空选择</button>
              </view>
            </view>
          </view>
          <view class="form-group">
            <text class="form-label">优惠券类型</text>
            <picker :range="couponTypes" range-key="label" @change="onBatchTypeChange" class="form-picker">
              <view class="picker-text">{{ couponTypes[batchTypeIndex].label }}</view>
            </picker>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="closeBatchModal">取消</button>
          <button class="modal-btn confirm-btn" @click="submitBatchGrant" :disabled="selectedUsers.length === 0">确定发放</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      coupons: [],
      userList: [],
      selectedUser: null,
      userKeyword: '',
      showModal: false,
      modalUser: null,
      couponTypes: [
        { label: '5元', value: '5元' },
        { label: '10元', value: '10元' },
        { label: '20元', value: '20元' }
      ],
      typeIndex: 0,
      showUpgrade: false,
      upgradeCoupon: null,
      upgradeTypeIndex: 0,
      showBatchModal: false,
      selectedUsers: [],
      batchTypeIndex: 0,
      stats: {
        total: 0,
        unused: 0,
        used: 0,
        expired: 0
      }
    }
  },
  onLoad() {
    this.loadUserList();
  },
  methods: {
    async loadUserList() {
      const res = await uni.request({ url: 'http://localhost:3000/api/admin/users', method: 'GET' });
      if (res.data.success) {
        this.userList = res.data.users;
      }
    },
    async onUserChange(e) {
      this.selectedUser = this.userList[e.detail.value];
      this.loadCoupons();
      this.loadStats();
    },
    async onUserSearch() {
      console.log('搜索按钮被点击，关键词:', this.userKeyword);
      
      if (!this.userKeyword.trim()) {
        console.log('搜索关键词为空，重新加载所有用户');
        // 如果搜索关键词为空，重新加载所有用户
        await this.loadUserList();
        return;
      }
      
      try {
        console.log('开始搜索，URL:', `http://localhost:3000/api/admin/users?keyword=${encodeURIComponent(this.userKeyword.trim())}`);
        const res = await uni.request({ 
          url: `http://localhost:3000/api/admin/users?keyword=${encodeURIComponent(this.userKeyword.trim())}`, 
          method: 'GET' 
        });
        console.log('搜索响应:', res);
        if (res.data.success) {
          this.userList = res.data.users;
          console.log('搜索结果用户数量:', res.data.users.length);
          
          if (res.data.users.length === 0) {
            uni.showToast({ title: '未找到匹配的手机号', icon: 'none' });
            // 清空当前选中的用户
            this.selectedUser = null;
            this.coupons = [];
            this.stats = { total: 0, unused: 0, used: 0, expired: 0 };
          } else {
            // 自动选择第一个搜索结果
            this.selectedUser = res.data.users[0];
            // 加载该用户的优惠券信息
            await this.loadCoupons();
            await this.loadStats();
            
            uni.showToast({ title: `已选择用户：${this.selectedUser.nickname}`, icon: 'success' });
          }
        }
      } catch (error) {
        console.error('搜索失败:', error);
        uni.showToast({ title: '搜索失败', icon: 'none' });
      }
    },
    onUserSearchInput() {
      // 实时搜索（可选，如果觉得太频繁可以注释掉）
      // this.onUserSearch();
    },
    clearUserSearch() {
      this.userKeyword = '';
      this.loadUserList();
      // 清空当前选中的用户和相关数据
      this.selectedUser = null;
      this.coupons = [];
      this.stats = { total: 0, unused: 0, used: 0, expired: 0 };
      uni.showToast({ title: '已清空搜索', icon: 'success' });
    },
    async loadCoupons() {
      if (!this.selectedUser) {
        this.coupons = [];
        return;
      }
      const res = await uni.request({ url: 'http://localhost:3000/api/admin/coupons?userId=' + this.selectedUser.id, method: 'GET' });
      if (res.data.success) {
        this.coupons = res.data.coupons;
      }
    },
    async loadStats() {
      if (!this.selectedUser) {
        this.stats = { total: 0, unused: 0, used: 0, expired: 0 };
        return;
      }
      const res = await uni.request({ url: `http://localhost:3000/api/admin/coupons/stats?userId=${this.selectedUser.id}`, method: 'GET' });
      if (res.data.success) {
        this.stats = res.data.stats;
      }
    },
    showAddModal() {
      this.showModal = true;
      this.modalUser = this.selectedUser;
      this.typeIndex = 0;
    },
    onModalUserChange(e) {
      this.modalUser = this.userList[e.detail.value];
    },
    onTypeChange(e) {
      this.typeIndex = e.detail.value;
    },
    async submitGrantCoupon() {
      if (!this.modalUser) {
        uni.showToast({ title: '请选择用户', icon: 'none' });
        return;
      }

      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/coupons',
          method: 'POST',
          data: {
            user_id: this.modalUser.id,
            type: this.couponTypes[this.typeIndex].value
          }
        });
        
        if (res.data.success) {
          uni.showToast({ title: '优惠券发放成功', icon: 'success' });
          this.closeModal();
          this.loadCoupons();
          this.loadStats();
        } else {
          uni.showToast({ title: res.data.message || '发放失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '发放失败', icon: 'none' });
      }
    },
    showUpgradeModal(coupon) {
      this.showUpgrade = true;
      this.upgradeCoupon = coupon;
      this.upgradeTypeIndex = 0;
    },
    onUpgradeTypeChange(e) {
      this.upgradeTypeIndex = e.detail.value;
    },
    async submitUpgradeCoupon() {
      if (!this.upgradeCoupon) {
        uni.showToast({ title: '优惠券信息错误', icon: 'none' });
        return;
      }

      try {
        const res = await uni.request({
          url: `http://localhost:3000/api/admin/coupons/${this.upgradeCoupon.id}/upgrade`,
          method: 'PUT',
          data: {
            type: this.couponTypes[this.upgradeTypeIndex].value
          }
        });
        
        if (res.data.success) {
          uni.showToast({ title: '优惠券升级成功', icon: 'success' });
          this.closeUpgradeModal();
          this.loadCoupons();
          this.loadStats();
        } else {
          uni.showToast({ title: res.data.message || '升级失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '升级失败', icon: 'none' });
      }
    },
    closeModal() {
      this.showModal = false;
      this.modalUser = null;
    },
    closeUpgradeModal() {
      this.showUpgrade = false;
      this.upgradeCoupon = null;
    },
    openBatchModal() {
      this.showBatchModal = true;
      this.selectedUsers = [];
      this.batchTypeIndex = 0;
    },
    closeBatchModal() {
      this.showBatchModal = false;
      this.selectedUsers = [];
      this.batchTypeIndex = 0;
    },
    toggleUserSelection(userId) {
      const index = this.selectedUsers.indexOf(userId);
      if (index > -1) {
        this.selectedUsers.splice(index, 1);
      } else {
        this.selectedUsers.push(userId);
      }
    },
    clearUserSelection() {
      this.selectedUsers = [];
    },
    onBatchTypeChange(e) {
      this.batchTypeIndex = e.detail.value;
    },
    async submitBatchGrant() {
      if (this.selectedUsers.length === 0) {
        uni.showToast({ title: '请选择用户', icon: 'none' });
        return;
      }

      try {
        const promises = this.selectedUsers.map(userId => 
          uni.request({
            url: 'http://localhost:3000/api/admin/coupons',
            method: 'POST',
            data: {
              user_id: userId,
              type: this.couponTypes[this.batchTypeIndex].value
            }
          })
        );
        
        const results = await Promise.all(promises);
        const successCount = results.filter(res => res.data.success).length;
        
        if (successCount === this.selectedUsers.length) {
          uni.showToast({ title: `成功发放给${successCount}个用户`, icon: 'success' });
        } else {
          uni.showToast({ title: `部分发放成功（${successCount}/${this.selectedUsers.length}）`, icon: 'none' });
        }
        
        this.closeBatchModal();
        if (this.selectedUser && this.selectedUsers.includes(this.selectedUser.id)) {
          this.loadCoupons();
          this.loadStats();
        }
      } catch (error) {
        uni.showToast({ title: '批量发放失败', icon: 'none' });
      }
    },
    getStatusClass(status) {
      const statusMap = {
        unused: 'status-active',
        used: 'status-inactive',
        expired: 'status-expired'
      };
      return statusMap[status] || 'status-inactive';
    },
    getStatusText(status) {
      const statusMap = {
        unused: '未使用',
        used: '已使用',
        expired: '已过期'
      };
      return statusMap[status] || '未知';
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },
    async deleteCoupon(couponId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该优惠券吗？',
        success: async (res) => {
          if (res.confirm) {
            const res = await uni.request({
              url: `http://localhost:3000/api/admin/coupons/${couponId}`,
              method: 'DELETE'
            });
            if (res.data.success) {
              uni.showToast({ title: '删除成功', icon: 'success' });
              this.loadCoupons();
              this.loadStats();
            } else {
              uni.showToast({ title: res.data.message || '删除失败', icon: 'none' });
            }
          }
        }
      });
    }
  }
}
</script>

<style scoped>
.coupons-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20rpx;
}

.header-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 15rpx;
}

.add-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.add-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.batch-btn {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: #fff;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
}

.batch-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
}

.stats-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.stat-item {
  text-align: center;
  padding: 30rpx 20rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
}

.stat-number {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.user-filter-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.user-selector {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-label {
  font-size: 28rpx;
  color: #333;
  margin-right: 20rpx;
  min-width: 120rpx;
  font-weight: 600;
}

.user-picker {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  background: #fff;
  transition: all 0.3s ease;
}

.user-picker:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999;
}

.user-search {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.user-search-input {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.user-search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.search-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  padding: 20rpx 30rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.search-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.clear-search-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: #fff;
  border: none;
  padding: 20rpx 30rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(255, 71, 87, 0.3);
  transition: all 0.3s ease;
}

.clear-search-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.3);
}

.user-info-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.user-phone {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.coupon-count {
  font-size: 28rpx;
  color: #999;
  font-weight: 500;
}

.coupons-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.coupon-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.coupon-item:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.15);
}

.coupon-header {
  margin-bottom: 20rpx;
}

.coupon-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coupon-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.coupon-status {
  padding: 12rpx 24rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.status-active {
  background: linear-gradient(135deg, #e8f5e8, #d4edda);
  color: #52c41a;
  box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
}

.status-inactive {
  background: linear-gradient(135deg, #fff2e8, #ffeaa7);
  color: #fa8c16;
  box-shadow: 0 2rpx 8rpx rgba(250, 140, 22, 0.2);
}

.status-expired {
  background: linear-gradient(135deg, #f5f5f5, #e9ecef);
  color: #999;
  box-shadow: 0 2rpx 8rpx rgba(153, 153, 153, 0.2);
}

.coupon-details {
  margin-bottom: 20rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.detail-label {
  font-size: 28rpx;
  color: #666;
  width: 160rpx;
  font-weight: 500;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.coupon-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  transform: translateY(2rpx);
}

.upgrade-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: #fff;
  box-shadow: 0 4rpx 15rpx rgba(255, 71, 87, 0.3);
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 20rpx;
}

.empty-action-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.empty-action-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24rpx;
  width: 90%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.batch-modal .modal-content {
  width: 95%;
  max-height: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #ff4757;
  transform: scale(1.1);
}

.modal-body {
  padding: 40rpx;
}

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: #fff;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.form-picker {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  background: #fff;
  transition: all 0.3s ease;
}

.form-picker:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.picker-text {
  padding: 20rpx;
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #333;
  background: #fff;
  transition: all 0.3s ease;
}

.picker-text:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3rpx rgba(102, 126, 234, 0.1);
}

.user-selection-area {
  border: 2rpx solid #e1e8ed;
  border-radius: 16rpx;
  padding: 20rpx;
  max-height: 300rpx;
  overflow-y: auto;
  background: #fff;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
}

.user-item:hover {
  background: #e9ecef;
  transform: translateX(4rpx);
}

.user-item.selected {
  background: linear-gradient(135deg, #e8f5e8, #d4edda);
  border: 2rpx solid #52c41a;
  box-shadow: 0 4rpx 15rpx rgba(82, 196, 26, 0.2);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.user-phone {
  font-size: 24rpx;
  color: #666;
}

.selection-indicator {
  width: 40rpx;
  text-align: center;
}

.selected-icon {
  font-size: 32rpx;
  color: #52c41a;
  font-weight: bold;
}

.selection-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 15rpx;
  border-top: 2rpx solid #f0f0f0;
}

.summary-text {
  font-size: 24rpx;
  color: #666;
  font-weight: 500;
}

.clear-btn {
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: #fff;
  border: none;
  padding: 12rpx 24rpx;
  border-radius: 50rpx;
  font-size: 24rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 15rpx rgba(255, 71, 87, 0.3);
  transition: all 0.3s ease;
}

.clear-btn:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.3);
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 40rpx;
  border-top: 2rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.modal-btn:active {
  transform: translateY(2rpx);
}

.modal-btn:disabled {
  background: #ccc;
  color: #888;
  cursor: not-allowed;
  box-shadow: none;
}

.cancel-btn {
  background: linear-gradient(135deg, #f5f5f5, #e9ecef);
  color: #666;
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
}
</style> 
