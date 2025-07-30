<template>
  <view class="edit-product-container">
    <view class="form-container">
      <view class="form-group">
        <text class="form-label">商品名称 *</text>
        <input class="form-input" v-model="productForm.name" placeholder="请输入商品名称" maxlength="50" />
      </view>
      <view class="form-group">
        <text class="form-label">商品分类 *</text>
        <picker class="form-picker" :value="categoryIndex" :range="categories" @change="onCategoryChange">
          <view class="picker-text">{{ categories[categoryIndex] || '请选择分类' }}</view>
        </picker>
      </view>
      <view class="form-group">
        <text class="form-label">商品价格 *</text>
        <input class="form-input" type="digit" v-model="productForm.price" placeholder="请输入价格" />
      </view>
      <view class="form-group">
        <text class="form-label">商品描述</text>
        <textarea class="form-textarea" v-model="productForm.description" placeholder="请输入商品描述" maxlength="200" />
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
        <switch :checked="productForm.status" @change="onStatusChange" color="#667eea" />
        <text class="status-text">{{ productForm.status ? '上架' : '下架' }}</text>
      </view>
    </view>
    <view class="action-buttons">
      <button class="action-btn cancel" @click="goBack">取消</button>
      <button class="action-btn submit" @click="submitForm" :disabled="!isFormValid">保存修改</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      productId: null,
      productForm: {
        name: '',
        category: '',
        price: '',
        description: '',
        image_url: '',
        status: true
      },
      categories: ['招牌奶茶', '真鲜果茶', '酸奶奶昔', '小料区', '保温袋区'],
      categoryIndex: -1
    };
  },
  computed: {
    isFormValid() {
      return this.productForm.name.trim() &&
        this.productForm.category &&
        this.productForm.price &&
        !isNaN(parseFloat(this.productForm.price));
    }
  },
  onLoad(options) {
    if (options.productId) {
      this.productId = options.productId;
      this.loadProduct();
    }
  },
  methods: {
    // 加载商品信息
    loadProduct() {
      uni.request({
        url: `http://localhost:3000/api/admin/products?page=1&limit=1000`, // 简单拉取全部，实际可优化为单个商品接口
        method: 'GET',
        header: { 'Content-Type': 'application/json' },
        success: (res) => {
          if (res.data && res.data.success) {
            const product = res.data.products.find(p => p.id == this.productId);
            if (product) {
              this.productForm = {
                name: product.name,
                category: product.category,
                price: product.price,
                description: product.description,
                image_url: product.image_url,
                status: !!product.status
              };
              this.categoryIndex = this.categories.indexOf(product.category);
            }
          }
        }
      });
    },
    onCategoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.productForm.category = this.categories[this.categoryIndex];
    },
    onStatusChange(e) {
      this.productForm.status = e.detail.value;
    },
    submitForm() {
      if (!this.isFormValid) {
        uni.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
      uni.request({
        url: `http://localhost:3000/api/admin/products/${this.productId}`,
        method: 'PUT',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          name: this.productForm.name.trim(),
          category: this.productForm.category,
          price: parseFloat(this.productForm.price),
          description: this.productForm.description.trim(),
          image_url: this.productForm.image_url.trim(),
          status: this.productForm.status ? 1 : 0
        },
        success: (res) => {
          if (res.data && res.data.success) {
            uni.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
              uni.navigateBack();
            }, 1200);
          } else {
            uni.showToast({ title: res.data.message || '保存失败', icon: 'none' });
          }
        },
        fail: () => {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    },
    goBack() {
      uni.navigateBack();
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
    }
  }
};
</script>

<style scoped>
.edit-product-container { min-height: 100vh; background: #f5f5f5; padding: 20rpx; }
.form-container { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 40rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1); }
.form-group { margin-bottom: 30rpx; }
.form-label { display: block; font-size: 28rpx; color: #333; margin-bottom: 16rpx; font-weight: 500; }
.form-input { width: 100%; height: 80rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; background: #f8f9fa; box-sizing: border-box; }
.form-input:focus { border-color: #667eea; background: #fff; }
.form-picker { width: 100%; height: 80rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; background: #f8f9fa; display: flex; align-items: center; padding: 0 20rpx; }
.picker-text { font-size: 28rpx; color: #333; }
.form-textarea { width: 100%; height: 120rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; background: #f8f9fa; box-sizing: border-box; resize: none; }
.form-textarea:focus { border-color: #667eea; background: #fff; }
.form-group:last-child { display: flex; align-items: center; gap: 20rpx; }
.status-text { font-size: 28rpx; color: #666; }
.action-buttons { display: flex; gap: 20rpx; }
.action-btn { flex: 1; height: 88rpx; border-radius: 12rpx; font-size: 32rpx; font-weight: 500; border: none; }
.action-btn.cancel { background: #fff; color: #666; border: 2rpx solid #e5e5e5; }
.action-btn.submit { background: #667eea; color: #fff; }
.action-btn.submit:disabled { background: #ccc; }

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
</style> 