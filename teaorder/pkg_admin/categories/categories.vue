<template>
  <view class="categories-container">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <text class="page-title">商品分类管理</text>
      <button class="add-btn" @click="showAddModal">添加分类</button>
    </view>

    <!-- 分类列表 -->
    <view class="categories-list">
      <view 
        class="category-item" 
        v-for="category in categories" 
        :key="category.id"
      >
        <view class="category-info">
          <view class="category-name">{{ category.name }}</view>
          <view class="category-description">{{ category.description || '暂无描述' }}</view>
          <view class="category-meta">
            <text class="meta-item">排序: {{ category.sort_order }}</text>
            <text class="meta-item">状态: {{ category.status ? '启用' : '禁用' }}</text>
            <text class="meta-item">商品数: {{ category.product_count || 0 }}</text>
          </view>
        </view>
        
        <view class="category-actions">
          <button class="action-btn edit" @click="editCategory(category)">编辑</button>
          <button 
            class="action-btn toggle" 
            :class="category.status ? 'off' : 'on'"
            @click="toggleCategoryStatus(category)"
          >
            {{ category.status ? '禁用' : '启用' }}
          </button>
          <button 
            class="action-btn delete" 
            @click="deleteCategory(category.id)"
            :disabled="category.product_count > 0"
          >
            删除
          </button>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="categories.length === 0 && !loading">
      <text class="empty-text">暂无分类</text>
      <button class="empty-btn" @click="showAddModal">添加第一个分类</button>
    </view>

    <!-- 添加/编辑分类弹窗 -->
    <view class="modal-overlay" v-if="showModal" @click="hideModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEditing ? '编辑分类' : '添加分类' }}</text>
          <text class="modal-close" @click="hideModal">×</text>
        </view>
        
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">分类名称 *</text>
            <input 
              class="form-input" 
              v-model="categoryForm.name" 
              placeholder="请输入分类名称"
              maxlength="50"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">分类描述</text>
            <textarea 
              class="form-textarea" 
              v-model="categoryForm.description" 
              placeholder="请输入分类描述"
              maxlength="200"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">排序顺序</text>
            <input 
              class="form-input" 
              type="number" 
              v-model="categoryForm.sort_order" 
              placeholder="数字越小越靠前"
            />
          </view>
          
          <view class="form-group">
            <text class="form-label">状态</text>
            <switch 
              :checked="categoryForm.status" 
              @change="onStatusChange"
              color="#667eea"
            />
            <text class="status-text">{{ categoryForm.status ? '启用' : '禁用' }}</text>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="hideModal">取消</button>
          <button class="modal-btn submit" @click="submitCategory" :disabled="!isFormValid">
            {{ isEditing ? '保存' : '添加' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: [],
      loading: false,
      showModal: false,
      isEditing: false,
      editingId: null,
      categoryForm: {
        name: '',
        description: '',
        sort_order: 0,
        status: true
      }
    };
  },
  computed: {
    isFormValid() {
      return this.categoryForm.name.trim() && this.categoryForm.name.length <= 50;
    }
  },
  onLoad() {
    this.loadCategories();
  },
  methods: {
    // 加载分类列表
    async loadCategories() {
      this.loading = true;
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/categories',
          method: 'GET',
          header: { 'Content-Type': 'application/json' }
        });
        
        if (res.data && res.data.success) {
          this.categories = res.data.categories;
        } else {
          uni.showToast({ title: '加载分类失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    // 显示添加弹窗
    showAddModal() {
      this.isEditing = false;
      this.editingId = null;
      this.resetForm();
      this.showModal = true;
    },
    
    // 编辑分类
    editCategory(category) {
      this.isEditing = true;
      this.editingId = category.id;
      this.categoryForm = {
        name: category.name,
        description: category.description || '',
        sort_order: category.sort_order,
        status: category.status
      };
      this.showModal = true;
    },
    
    // 隐藏弹窗
    hideModal() {
      this.showModal = false;
      this.resetForm();
    },
    
    // 重置表单
    resetForm() {
      this.categoryForm = {
        name: '',
        description: '',
        sort_order: 0,
        status: true
      };
    },
    
    // 状态切换
    onStatusChange(e) {
      this.categoryForm.status = e.detail.value;
    },
    
    // 提交分类
    async submitCategory() {
      if (!this.isFormValid) {
        uni.showToast({ title: '请填写分类名称', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: this.isEditing ? '保存中...' : '添加中...' });
      
      try {
        const url = this.isEditing 
          ? `http://localhost:3000/api/admin/categories/${this.editingId}`
          : 'http://localhost:3000/api/admin/categories';
        
        const method = this.isEditing ? 'PUT' : 'POST';
        
        const res = await uni.request({
          url: url,
          method: method,
          header: { 'Content-Type': 'application/json' },
          data: this.categoryForm
        });
        
        uni.hideLoading();
        
        if (res.data && res.data.success) {
          uni.showToast({ 
            title: this.isEditing ? '保存成功' : '添加成功', 
            icon: 'success' 
          });
          this.hideModal();
          this.loadCategories();
        } else {
          uni.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    // 切换分类状态
    async toggleCategoryStatus(category) {
      try {
        const res = await uni.request({
          url: `http://localhost:3000/api/admin/categories/${category.id}`,
          method: 'PUT',
          header: { 'Content-Type': 'application/json' },
          data: {
            name: category.name,
            description: category.description,
            sort_order: category.sort_order,
            status: !category.status
          }
        });
        
        if (res.data && res.data.success) {
          uni.showToast({ 
            title: !category.status ? '已启用' : '已禁用', 
            icon: 'success' 
          });
          this.loadCategories();
        } else {
          uni.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    
    // 删除分类
    deleteCategory(categoryId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个分类吗？删除后无法恢复。',
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await uni.request({
                url: `http://localhost:3000/api/admin/categories/${categoryId}`,
                method: 'DELETE',
                header: { 'Content-Type': 'application/json' }
              });
              
              if (result.data && result.data.success) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                this.loadCategories();
              } else {
                uni.showToast({ title: result.data.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              uni.showToast({ title: '网络错误', icon: 'none' });
            }
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.categories-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.top-bar {
  background: #fff;
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #e5e5e5;
}

.page-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.add-btn {
  padding: 16rpx 24rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.categories-list {
  padding: 32rpx;
}

.category-item {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  flex: 1;
}

.category-name {
  font-size: 34rpx;
  font-weight: bold;
  color: #222;
  margin-bottom: 10rpx;
}

.category-description {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.category-meta {
  display: flex;
  gap: 20rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #888;
  background: #f8f9fa;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}

.category-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-btn {
  border-radius: 12rpx;
  font-size: 26rpx;
  padding: 14rpx 28rpx;
  border: none;
  white-space: nowrap;
}

.action-btn.edit {
  background: #667eea;
  color: #fff;
}

.action-btn.toggle.on {
  background: #28a745;
  color: #fff;
}

.action-btn.toggle.off {
  background: #ffc107;
  color: #333;
}

.action-btn.delete {
  background: #dc3545;
  color: #fff;
}

.action-btn.delete:disabled {
  background: #ccc;
  color: #999;
}

.empty-state {
  padding: 120rpx 0 40rpx 0;
  text-align: center;
  color: #bbb;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
  display: block;
}

.empty-btn {
  padding: 20rpx 40rpx;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 20rpx;
  width: 80%;
  max-width: 600rpx;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background: #f8f9fa;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 120rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background: #f8f9fa;
  box-sizing: border-box;
  resize: none;
}

.form-group:last-child {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.status-text {
  font-size: 28rpx;
  color: #666;
}

.modal-footer {
  padding: 30rpx;
  border-top: 1rpx solid #e5e5e5;
  display: flex;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
}

.modal-btn.cancel {
  background: #fff;
  color: #666;
  border: 2rpx solid #e5e5e5;
}

.modal-btn.submit {
  background: #667eea;
  color: #fff;
}

.modal-btn.submit:disabled {
  background: #ccc;
}
</style> 