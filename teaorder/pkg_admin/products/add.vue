<template>
  <view class="add-product-container">
    <view class="form-container">
      <view class="form-group">
        <text class="form-label">商品名称 *</text>
        <input 
          class="form-input" 
          v-model="productForm.name" 
          placeholder="请输入商品名称"
          maxlength="50"
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">商品分类 *</text>
        <view class="category-selector">
          <view 
            class="category-option" 
            :class="{ active: categoryIndex === index }"
            v-for="(category, index) in categories" 
            :key="index"
            @click="selectCategory(index)"
          >
            {{ category }}
          </view>
        </view>
        <text class="category-status" v-if="categoryIndex >= 0">
          已选择: {{ categories[categoryIndex] }}
        </text>
        <text class="category-status" v-else style="color: #999;">
          请选择一个分类
        </text>
      </view>
      
      <view class="form-group">
        <text class="form-label">商品价格 *</text>
        <input 
          class="form-input" 
          type="digit" 
          v-model="productForm.price" 
          placeholder="请输入价格"
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">商品描述</text>
        <textarea 
          class="form-textarea" 
          v-model="productForm.description" 
          placeholder="请输入商品描述"
          maxlength="200"
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">商品图片</text>
        <view class="image-upload-section">
          <view class="image-preview" v-if="productForm.image_url">
            <image :src="productForm.image_url" mode="aspectFill" class="preview-image" />
            <view class="image-actions">
              <button class="image-btn change" @click="chooseImage">更换图片</button>
              <button class="image-btn delete" @click="removeImage">删除</button>
            </view>
          </view>
          <view class="upload-placeholder" v-else @click="chooseImage">
            <text class="upload-icon">📷</text>
            <text class="upload-text">点击上传图片</text>
            <text class="upload-tip">支持 JPG、PNG 格式</text>
          </view>
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">商品状态</text>
        <switch 
          :checked="productForm.status" 
          @change="onStatusChange"
          color="#667eea"
        />
        <text class="status-text">{{ productForm.status ? '上架' : '下架' }}</text>
      </view>
    </view>
    
    <view class="action-buttons">
      <button class="action-btn cancel" @click="goBack">取消</button>
      <button class="action-btn test" @click="testFormData">测试数据</button>
      <button class="action-btn submit" @click="submitForm" :disabled="!isFormValid">
        添加商品
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      productForm: {
        name: '',
        category: '',
        price: '',
        description: '',
        image_url: '',
        status: true
      },
      categories: [],
      categoryIndex: -1
    };
  },
  onLoad() {
    console.log('商品添加页面加载完成');
    this.loadCategories();
  },
  computed: {
    isFormValid() {
      const valid = this.productForm.name.trim() && 
             this.categoryIndex >= 0 && 
             this.productForm.category && 
             this.productForm.price && 
             !isNaN(parseFloat(this.productForm.price));
      console.log('表单验证结果:', valid, {
        name: this.productForm.name.trim(),
        categoryIndex: this.categoryIndex,
        category: this.productForm.category,
        price: this.productForm.price
      });
      return valid;
    }
  },
  methods: {
    // 分类选择
    selectCategory(index) {
      console.log('选择分类:', this.categories[index]); // 添加调试日志
      this.categoryIndex = index;
      this.productForm.category = this.categories[index];
      console.log('当前categoryIndex:', this.categoryIndex);
      console.log('当前选择的分类:', this.productForm.category);
      
      // 显示选择成功提示
      uni.showToast({ 
        title: `已选择: ${this.categories[index]}`, 
        icon: 'none',
        duration: 1000
      });
    },
    
    // 状态切换
    onStatusChange(e) {
      this.productForm.status = e.detail.value;
    },
    
    // 提交表单
    submitForm() {
      console.log('提交表单，表单数据:', this.productForm); // 添加调试日志
      console.log('表单验证结果:', this.isFormValid); // 添加调试日志
      
      // 详细验证提示
      if (!this.productForm.name.trim()) {
        uni.showToast({ title: '请输入商品名称', icon: 'none' });
        return;
      }
      
      if (this.categoryIndex < 0) {
        uni.showToast({ title: '请选择商品分类', icon: 'none' });
        return;
      }
      
      if (!this.productForm.price || isNaN(parseFloat(this.productForm.price))) {
        uni.showToast({ title: '请输入有效的价格', icon: 'none' });
        return;
      }
      
      if (!this.isFormValid) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      
      uni.showLoading({ title: '添加中...' }); // 添加加载提示
      
      uni.request({
        url: 'http://localhost:3000/api/admin/products',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          name: this.productForm.name.trim(),
          category: this.productForm.category,
          price: parseFloat(this.productForm.price),
          description: this.productForm.description.trim(),
          image_url: this.productForm.image_url.trim(),
          status: this.productForm.status // 添加商品状态到请求数据
        },
        success: (res) => {
          uni.hideLoading(); // 隐藏加载提示
          console.log('API响应:', res); // 添加调试日志
          if (res.data && res.data.success) {
            uni.showToast({ title: '商品添加成功', icon: 'success' });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: res.data.message || '添加失败', icon: 'none' });
          }
        },
        fail: (err) => {
          uni.hideLoading(); // 隐藏加载提示
          console.error('请求失败:', err); // 添加调试日志
          uni.showToast({ title: '网络错误，请检查后端服务是否启动', icon: 'none' });
        }
      });
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },

    // 测试数据
    testFormData() {
      console.log('设置测试数据...');
      this.productForm.name = '测试商品名称';
      this.productForm.category = '真鲜果茶';
      this.productForm.price = '15.00';
      this.productForm.description = '这是一条测试商品描述。';
      this.productForm.image_url = 'https://via.placeholder.com/150';
      this.productForm.status = true;
      this.categoryIndex = 1; // 选择真鲜果茶
      console.log('测试数据已设置:', this.productForm);
      console.log('categoryIndex:', this.categoryIndex);
      console.log('表单验证结果:', this.isFormValid);
      uni.showToast({ title: '测试数据已设置', icon: 'success' });
    },

    // 选择图片
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const filePath = res.tempFilePaths[0];
          this.uploadImage(filePath);
        },
        fail: () => {
          uni.showToast({ title: '选择图片失败', icon: 'none' });
        }
      });
    },

    // 上传图片
    uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' });
      
      uni.uploadFile({
        url: 'http://localhost:3000/api/admin/upload-product-image',
        filePath: filePath,
        name: 'file',
        success: (uploadRes) => {
          uni.hideLoading();
          const data = JSON.parse(uploadRes.data);
          if (data.success) {
            this.productForm.image_url = data.url;
            uni.showToast({ title: '上传成功', icon: 'success' });
          } else {
            uni.showToast({ title: data.message || '上传失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.hideLoading();
          uni.showToast({ title: '上传失败', icon: 'none' });
        }
      });
    },

    // 删除图片
    removeImage() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.productForm.image_url = '';
            uni.showToast({ title: '图片已删除', icon: 'success' });
          }
        }
      });
    },

    // 加载分类
    async loadCategories() {
      try {
        const res = await uni.request({
          url: 'http://localhost:3000/api/admin/categories',
          method: 'GET',
          header: { 'Content-Type': 'application/json' }
        });
        if (res.data && res.data.success) {
          this.categories = res.data.categories.map(item => item.name);
          console.log('成功加载分类:', this.categories);
        } else {
          uni.showToast({ title: res.data.message || '加载分类失败', icon: 'none' });
          console.error('加载分类失败:', res.data.message);
        }
      } catch (error) {
        console.error('加载分类失败:', error);
        uni.showToast({ title: '网络错误，无法加载分类', icon: 'none' });
      }
    }
  }
};
</script>

<style scoped>
.add-product-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.form-container {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
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

.form-input:focus {
  border-color: #667eea;
  background: #fff;
}

.category-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
  padding: 10rpx 0;
}

.category-option {
  background-color: #f8f9fa;
  color: #333;
  padding: 16rpx 24rpx;
  border-radius: 25rpx;
  font-size: 28rpx;
  border: 2rpx solid #e5e5e5;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  min-width: 120rpx;
}

.category-option:active {
  transform: scale(0.95);
}

.category-option.active {
  background-color: #667eea;
  color: #fff;
  border-color: #667eea;
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
}

.category-status {
  font-size: 24rpx;
  color: #667eea;
  margin-top: 10rpx;
  display: block;
}

.image-upload-section {
  width: 100%;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 300rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f8f9fa;
  border: 2rpx solid #e5e5e5;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
}

.image-btn {
  flex: 1;
  height: 60rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
}

.image-btn.change {
  background: #667eea;
  color: #fff;
}

.image-btn.delete {
  background: #dc3545;
  color: #fff;
}

.upload-placeholder {
  width: 100%;
  height: 300rpx;
  border: 2rpx dashed #e5e5e5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-placeholder:active {
  background: #e9ecef;
  border-color: #667eea;
}

.upload-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
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

.form-textarea:focus {
  border-color: #667eea;
  background: #fff;
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

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
}

.action-btn.cancel {
  background: #fff;
  color: #666;
  border: 2rpx solid #e5e5e5;
}

.action-btn.test {
  background: #ff9800;
  color: #fff;
  border: 2rpx solid #ff9800;
}

.action-btn.submit {
  background: #667eea;
  color: #fff;
}

.action-btn.submit:disabled { background: #ccc; }
</style> 