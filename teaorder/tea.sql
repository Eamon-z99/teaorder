/*
 Navicat Premium Data Transfer

 Source Server         : locaohost
 Source Server Type    : MySQL
 Source Server Version : 80040
 Source Host           : localhost:3306
 Source Schema         : tea

 Target Server Type    : MySQL
 Target Server Version : 80040
 File Encoding         : 65001

 Date: 30/07/2025 04:20:41
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for addresses
-- ----------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '收货人姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '手机号',
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '详细地址',
  `tag` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '家' COMMENT '地址标签：家、公司、学校',
  `is_default` tinyint NULL DEFAULT 0 COMMENT '是否默认地址：1-是，0-否',
  `lat` decimal(10, 7) NULL DEFAULT NULL COMMENT '纬度',
  `lng` decimal(10, 7) NULL DEFAULT NULL COMMENT '经度',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '地址表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of addresses
-- ----------------------------
INSERT INTO `addresses` VALUES (3, 2, '阿松大', '15012967521', '啊沙发沙发是', '公司', 1, NULL, NULL, '2025-07-14 01:37:53', '2025-07-14 01:37:53');
INSERT INTO `addresses` VALUES (8, 3, 'abc', '15012942049', '云南省昆明市万达广场', '公司', 1, 24.9158421, 102.5044830, '2025-07-30 00:53:15', '2025-07-30 04:04:26');

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '管理员用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码（加密存储，建议 bcrypt）',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniq_admin_username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (1, 'admin', 'admin123', '超级管理员', NULL, NULL, 1, '2025-07-26 03:55:15', '2025-07-26 03:55:15');

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `quantity` int NOT NULL DEFAULT 1 COMMENT '数量',
  `spec` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '规格',
  `sweetness` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '甜度',
  `temperature` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '温度',
  `toppings` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '小料：JSON格式存储',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `price` decimal(10, 2) NULL DEFAULT 0.00 COMMENT '单杯含小料价',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_product`(`user_id` ASC, `product_id` ASC, `spec` ASC, `sweetness` ASC, `temperature` ASC, `toppings` ASC) USING BTREE,
  INDEX `product_id`(`product_id` ASC) USING BTREE,
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 58 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '购物车表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cart_items
-- ----------------------------
INSERT INTO `cart_items` VALUES (54, 2, 13, 1, '', '', '', '[]', '2025-07-18 22:11:03', '2025-07-18 22:11:03', 1.00);
INSERT INTO `cart_items` VALUES (55, 2, 6, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', '2025-07-18 22:11:10', '2025-07-18 22:11:10', 21.00);
INSERT INTO `cart_items` VALUES (56, 2, 2, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', '2025-07-27 00:48:48', '2025-07-27 00:48:48', 19.00);
INSERT INTO `cart_items` VALUES (57, 3, 17, 1, '大杯', '全糖', '正常冰', '[]', '2025-07-29 03:49:41', '2025-07-29 03:49:41', 7.00);

-- ----------------------------
-- Table structure for coupons
-- ----------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '所属用户ID',
  `type` enum('5元','10元','20元') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '优惠券类型',
  `value` decimal(10, 2) NOT NULL COMMENT '优惠券面值',
  `status` enum('unused','used','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'unused' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '优惠券表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of coupons
-- ----------------------------
INSERT INTO `coupons` VALUES (2, 2, '20元', 20.00, 'used', '2025-07-18 02:27:49', '2025-07-18 03:29:34');
INSERT INTO `coupons` VALUES (3, 2, '5元', 5.00, 'used', '2025-07-18 03:45:58', '2025-07-18 03:46:22');
INSERT INTO `coupons` VALUES (4, 2, '10元', 10.00, 'unused', '2025-07-27 02:07:07', NULL);

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT '订单ID',
  `product_id` int NOT NULL COMMENT '商品ID',
  `product_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品名称',
  `product_price` decimal(10, 2) NOT NULL COMMENT '商品单价',
  `quantity` int NOT NULL COMMENT '购买数量',
  `spec` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '规格：大杯、中杯',
  `sweetness` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '甜度：全糖、七分糖、五分糖',
  `temperature` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '温度：正常冰、少冰、常温、热',
  `toppings` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '小料：JSON格式存储',
  `total_price` decimal(10, 2) NOT NULL COMMENT '小计金额',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id` ASC) USING BTREE,
  INDEX `product_id`(`product_id` ASC) USING BTREE,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 40 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单详情表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------
INSERT INTO `order_items` VALUES (2, 2, 2, '蓝莓椰语', 17.00, 1, '大杯', '全糖', '正常冰', '[]', 17.00, '2025-07-14 01:45:27');
INSERT INTO `order_items` VALUES (3, 2, 3, '抹茶红豆恋', 18.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 18.00, '2025-07-14 01:45:27');
INSERT INTO `order_items` VALUES (4, 2, 13, '精美保温袋', 5.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 5.00, '2025-07-14 01:45:27');
INSERT INTO `order_items` VALUES (5, 3, 6, '芋泥波波', 19.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-14 01:47:50');
INSERT INTO `order_items` VALUES (6, 3, 6, '芋泥波波', 19.00, 1, '大杯', '全糖', '正常冰', '[]', 19.00, '2025-07-14 01:47:50');
INSERT INTO `order_items` VALUES (7, 3, 13, '精美保温袋', 5.00, 1, '大杯', '全糖', '正常冰', '[]', 5.00, '2025-07-14 01:47:50');
INSERT INTO `order_items` VALUES (8, 4, 6, '芋泥波波', 19.00, 2, '大杯', '全糖', '正常冰', '[]', 38.00, '2025-07-14 01:57:59');
INSERT INTO `order_items` VALUES (9, 5, 6, '芋泥波波', 19.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-14 01:59:39');
INSERT INTO `order_items` VALUES (10, 6, 8, '柠檬养乐多', 16.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 16.00, '2025-07-14 02:10:19');
INSERT INTO `order_items` VALUES (11, 7, 6, '芋泥波波', 19.00, 1, '大杯', '全糖', '正常冰', '[]', 19.00, '2025-07-14 02:13:05');
INSERT INTO `order_items` VALUES (12, 8, 10, '芒果酸奶奶昔', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:15:58');
INSERT INTO `order_items` VALUES (13, 9, 10, '芒果酸奶奶昔', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:18:11');
INSERT INTO `order_items` VALUES (14, 10, 10, '芒果酸奶奶昔', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:24:32');
INSERT INTO `order_items` VALUES (15, 11, 9, '草莓酸奶奶昔', 22.00, 2, '中杯', '全糖', '少冰', '[]', 44.00, '2025-07-14 02:26:25');
INSERT INTO `order_items` VALUES (16, 12, 5, '经典珍珠奶茶', 15.00, 1, '大杯', '全糖', '正常冰', '[]', 15.00, '2025-07-14 02:28:55');
INSERT INTO `order_items` VALUES (17, 12, 6, '芋泥波波', 19.00, 1, '大杯', '全糖', '正常冰', '[]', 19.00, '2025-07-14 02:28:55');
INSERT INTO `order_items` VALUES (18, 12, 9, '草莓酸奶奶昔', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:28:55');
INSERT INTO `order_items` VALUES (19, 12, 10, '芒果酸奶奶昔', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:28:55');
INSERT INTO `order_items` VALUES (20, 13, 4, '芒椰西米露', 17.00, 1, '大杯', '全糖', '正常冰', '[]', 17.00, '2025-07-14 02:36:56');
INSERT INTO `order_items` VALUES (21, 14, 9, '草莓酸奶', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 02:41:17');
INSERT INTO `order_items` VALUES (22, 15, 9, '草莓酸奶', 22.00, 1, '大杯', '全糖', '正常冰', '[]', 22.00, '2025-07-14 17:08:08');
INSERT INTO `order_items` VALUES (23, 15, 10, '芒果酸奶奶昔', 24.00, 1, '大杯', '全糖', '正常冰', '[\"椰果\"]', 24.00, '2025-07-14 17:08:08');
INSERT INTO `order_items` VALUES (24, 16, 4, '芒椰西米露', 19.00, 1, '大杯', '全糖', '正常冰', '[\"椰果\"]', 19.00, '2025-07-14 17:10:04');
INSERT INTO `order_items` VALUES (25, 17, 4, '芒椰西米露', 19.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-14 17:11:33');
INSERT INTO `order_items` VALUES (26, 18, 4, '芒椰西米露', 19.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-14 17:13:07');
INSERT INTO `order_items` VALUES (27, 19, 4, '芒椰西米露', 19.00, 1, '大杯', '全糖', '正常冰', '[\"椰果\"]', 19.00, '2025-07-14 17:16:04');
INSERT INTO `order_items` VALUES (28, 20, 4, '芒椰西米露', 19.00, 1, '大杯', '全糖', '正常冰', '[\"椰果\"]', 19.00, '2025-07-14 17:25:14');
INSERT INTO `order_items` VALUES (29, 26, 1, '粉莓芝心', 16.00, 1, '大杯', '全糖', '正常冰', '[]', 16.00, '2025-07-18 03:01:23');
INSERT INTO `order_items` VALUES (30, 26, 2, '蓝莓椰语', 19.00, 2, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 38.00, '2025-07-18 03:01:23');
INSERT INTO `order_items` VALUES (31, 27, 2, '蓝莓椰语', 19.00, 1, '大杯', '七分糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-18 03:29:34');
INSERT INTO `order_items` VALUES (32, 28, 2, '蓝莓椰语', 19.00, 1, '大杯', '七分糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-18 03:46:22');
INSERT INTO `order_items` VALUES (33, 29, 6, '芋泥波波', 21.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 21.00, '2025-07-18 22:11:18');
INSERT INTO `order_items` VALUES (34, 29, 13, '保温袋', 1.00, 1, '', '', '', '[]', 1.00, '2025-07-18 22:11:18');
INSERT INTO `order_items` VALUES (35, 30, 2, '蓝莓椰语', 19.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 19.00, '2025-07-27 00:48:55');
INSERT INTO `order_items` VALUES (36, 30, 6, '芋泥波波', 21.00, 1, '大杯', '全糖', '正常冰', '[\"珍珠\"]', 21.00, '2025-07-27 00:48:55');
INSERT INTO `order_items` VALUES (37, 30, 13, '保温袋', 1.00, 1, '', '', '', '[]', 1.00, '2025-07-27 00:48:55');
INSERT INTO `order_items` VALUES (38, 31, 17, '牛乳', 7.00, 1, '大杯', '全糖', '正常冰', '[]', 7.00, '2025-07-29 03:49:48');
INSERT INTO `order_items` VALUES (39, 32, 17, '牛乳', 7.00, 1, '大杯', '全糖', '正常冰', '[]', 7.00, '2025-07-30 04:06:58');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '订单号',
  `user_id` int NOT NULL COMMENT '用户ID',
  `order_type` enum('self','delivery') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'self' COMMENT '订单类型：self-自取，delivery-外卖',
  `total_amount` decimal(10, 2) NOT NULL COMMENT '订单总金额',
  `status` enum('pending','paid','preparing','ready','delivering','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '订单状态',
  `address_id` int NULL DEFAULT NULL COMMENT '外卖地址ID',
  `coupon_id` int NULL DEFAULT NULL COMMENT '使用的优惠券ID',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '订单备注',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `address_id`(`address_id` ASC) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 33 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (2, 'TEA1752428727886A4PT2', 2, 'self', 40.00, 'pending', NULL, NULL, '', '2025-07-14 01:45:27', '2025-07-14 01:45:27');
INSERT INTO `orders` VALUES (3, 'TEA17524288700471ADN9', 2, 'self', 43.00, 'pending', NULL, NULL, '', '2025-07-14 01:47:50', '2025-07-14 01:47:50');
INSERT INTO `orders` VALUES (4, 'TEA1752429479442QFROB', 2, 'self', 38.00, 'pending', NULL, NULL, '', '2025-07-14 01:57:59', '2025-07-14 01:57:59');
INSERT INTO `orders` VALUES (5, 'TEA1752429579843FE7P0', 2, 'self', 19.00, 'pending', NULL, NULL, '', '2025-07-14 01:59:39', '2025-07-14 01:59:39');
INSERT INTO `orders` VALUES (6, 'TEA1752430219953OHQ87', 2, 'self', 16.00, 'pending', NULL, NULL, '', '2025-07-14 02:10:19', '2025-07-14 02:10:19');
INSERT INTO `orders` VALUES (7, 'TEA17524303856447AHS2', 2, 'self', 19.00, 'pending', NULL, NULL, '', '2025-07-14 02:13:05', '2025-07-14 02:13:05');
INSERT INTO `orders` VALUES (8, 'TEA17524305583559T36V', 2, 'self', 22.00, 'pending', NULL, NULL, '', '2025-07-14 02:15:58', '2025-07-14 02:15:58');
INSERT INTO `orders` VALUES (9, 'TEA1752430691570SMA03', 2, 'self', 22.00, 'pending', NULL, NULL, '', '2025-07-14 02:18:11', '2025-07-14 02:18:11');
INSERT INTO `orders` VALUES (10, 'TEA1752431072602398EO', 2, 'self', 22.00, 'pending', NULL, NULL, '', '2025-07-14 02:24:32', '2025-07-14 02:24:32');
INSERT INTO `orders` VALUES (11, 'TEA1752431185813TRKCW', 2, 'delivery', 44.00, 'pending', 3, NULL, '', '2025-07-14 02:26:25', '2025-07-14 02:26:25');
INSERT INTO `orders` VALUES (12, 'TEA1752431335753HV1H3', 2, 'delivery', 78.00, 'pending', 3, NULL, '', '2025-07-14 02:28:55', '2025-07-14 02:28:55');
INSERT INTO `orders` VALUES (13, 'TEA1752431816658Q298H', 2, 'delivery', 17.00, 'pending', 3, NULL, '', '2025-07-14 02:36:56', '2025-07-14 02:36:56');
INSERT INTO `orders` VALUES (14, 'TEA1752432077734J2STD', 2, 'delivery', 22.00, 'pending', 3, NULL, '', '2025-07-14 02:41:17', '2025-07-14 02:41:17');
INSERT INTO `orders` VALUES (15, 'TEA1752484088402GRMP7', 2, 'self', 46.00, 'pending', NULL, NULL, '', '2025-07-14 17:08:08', '2025-07-14 17:08:08');
INSERT INTO `orders` VALUES (16, 'TEA1752484204395LDFVJ', 2, 'self', 19.00, 'pending', NULL, NULL, '', '2025-07-14 17:10:04', '2025-07-14 17:10:04');
INSERT INTO `orders` VALUES (17, 'TEA175248429370958TL5', 2, 'self', 19.00, 'paid', NULL, NULL, '', '2025-07-14 17:11:33', '2025-07-29 01:11:29');
INSERT INTO `orders` VALUES (18, 'TEA1752484387505B66Y9', 2, 'self', 19.00, 'preparing', NULL, NULL, '', '2025-07-14 17:13:07', '2025-07-29 01:11:34');
INSERT INTO `orders` VALUES (19, 'TEA17524845643453J1E0', 2, 'self', 19.00, 'completed', NULL, NULL, '', '2025-07-14 17:16:04', '2025-07-28 02:49:34');
INSERT INTO `orders` VALUES (20, 'TEA1752485114777JXBYI', 2, 'self', 19.00, 'completed', NULL, NULL, '', '2025-07-14 17:25:14', '2025-07-29 01:30:15');
INSERT INTO `orders` VALUES (26, 'TEA175277888315827WYU', 2, 'self', 49.00, 'completed', NULL, 1, '', '2025-07-18 03:01:23', '2025-07-29 01:11:54');
INSERT INTO `orders` VALUES (27, 'TEA1752780574010ZSI0Q', 2, 'delivery', 0.00, 'completed', 3, 2, '', '2025-07-18 03:29:34', '2025-07-28 02:42:15');
INSERT INTO `orders` VALUES (28, 'TEA1752781582382HFDKP', 2, 'delivery', 14.00, 'completed', 3, 3, '', '2025-07-18 03:46:22', '2025-07-27 00:57:41');
INSERT INTO `orders` VALUES (29, 'TEA1752847878524L327B', 2, 'self', 22.00, 'completed', NULL, NULL, '', '2025-07-18 22:11:18', '2025-07-27 00:37:24');
INSERT INTO `orders` VALUES (30, 'TEA1753548535670BZW5K', 2, 'self', 41.00, 'completed', NULL, NULL, '', '2025-07-27 00:48:55', '2025-07-27 00:57:12');
INSERT INTO `orders` VALUES (31, 'TEA17537321884565AXP4', 3, 'self', 7.00, 'pending', NULL, NULL, '', '2025-07-29 03:49:48', '2025-07-29 03:49:48');
INSERT INTO `orders` VALUES (32, 'TEA1753819618365RSTW0', 3, 'self', 7.00, 'pending', NULL, NULL, '', '2025-07-30 04:06:58', '2025-07-30 04:06:58');

-- ----------------------------
-- Table structure for product_categories
-- ----------------------------
DROP TABLE IF EXISTS `product_categories`;
CREATE TABLE `product_categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类描述',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序顺序',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_category_name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品分类表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of product_categories
-- ----------------------------
INSERT INTO `product_categories` VALUES (1, '招牌奶茶', '经典奶茶系列', 1, 1, '2025-07-29 03:22:15', '2025-07-29 03:22:15');
INSERT INTO `product_categories` VALUES (2, '真鲜果茶', '新鲜水果茶系列', 2, 1, '2025-07-29 03:22:15', '2025-07-29 03:22:15');
INSERT INTO `product_categories` VALUES (3, '酸奶奶昔', '酸奶饮品系列', 3, 1, '2025-07-29 03:22:15', '2025-07-29 03:22:15');
INSERT INTO `product_categories` VALUES (4, '小料区', '各种小料', 5, 1, '2025-07-29 03:22:15', '2025-07-29 03:48:56');
INSERT INTO `product_categories` VALUES (5, '保温袋区', '保温袋等配件', 6, 1, '2025-07-29 03:22:15', '2025-07-29 03:49:01');
INSERT INTO `product_categories` VALUES (6, '醇香牛奶', '', 4, 1, '2025-07-29 03:46:00', '2025-07-29 03:48:50');

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品名称',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '商品分类',
  `price` decimal(10, 2) NOT NULL COMMENT '商品价格',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '商品描述',
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '商品图片URL',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：1-上架，0-下架',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, '粉莓芝心', '招牌奶茶', 15.00, '粉色草莓与绵密芝士的甜蜜碰撞。', '/static/images/1.png', 1, '2025-07-14 00:17:49', '2025-07-28 02:11:53');
INSERT INTO `products` VALUES (2, '蓝莓椰语', '真鲜果茶', 17.00, '蓝莓的酸甜与椰果的 Q 弹共舞。', '/static/images/2.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (3, '抹茶红豆恋', '招牌奶茶', 18.00, '抹茶的微苦与红豆的软糯交织。', '/static/images/3.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (4, '芒椰西米露', '真鲜果茶', 17.00, '芒果的阳光甜香融入椰奶。', '/static/images/4.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (5, '经典珍珠奶茶', '招牌奶茶', 15.00, '浓郁茶香与Q弹珍珠的完美邂逅。', '/static/images/5.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (6, '芋泥波波', '招牌奶茶', 19.00, '绵密芋泥包裹着Q弹波波，香甜软糯。', '/static/images/6.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (7, '四季春茶', '真鲜果茶', 12.00, '茶汤清澈，花香四溢，口感甘醇。', '/static/images/7.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (8, '柠檬养乐多', '真鲜果茶', 16.00, '酸甜柠檬与活性乳酸菌的奇妙组合。', '/static/images/8.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (9, '草莓酸奶', '酸奶奶昔', 22.00, '新鲜草莓与浓醇酸奶的丝滑相遇。', '/static/images/9.png', 1, '2025-07-14 00:17:49', '2025-07-14 02:39:25');
INSERT INTO `products` VALUES (10, '芒果酸奶奶昔', '酸奶奶昔', 22.00, '热带芒果风情，补充活力。', '/static/images/10.png', 1, '2025-07-14 00:17:49', '2025-07-14 00:17:49');
INSERT INTO `products` VALUES (11, '珍珠', '小料区', 1.00, 'Q弹有嚼劲', '/static/images/11.png', 1, '2025-07-14 00:17:49', '2025-07-18 21:42:34');
INSERT INTO `products` VALUES (12, '椰果', '小料区', 1.00, '清甜爽口', '/static/images/12.png', 1, '2025-07-14 00:17:49', '2025-07-18 21:42:38');
INSERT INTO `products` VALUES (13, '保温袋', '保温袋区', 1.00, '为您的饮品保驾护航', '/static/images/13.png', 1, '2025-07-14 00:17:49', '2025-07-18 21:42:30');
INSERT INTO `products` VALUES (16, '薄荷抹茶红豆', '招牌奶茶', 15.00, '抹茶清香配上红豆风味，一口回味无穷', 'http://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/images/1753731007742_6799.png', 1, '2025-07-29 03:30:56', '2025-07-29 03:32:04');
INSERT INTO `products` VALUES (17, '牛乳', '醇香牛奶', 7.00, '醇香牛乳茶', 'http://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/images/1753732083200_7239.png', 1, '2025-07-29 03:48:08', '2025-07-29 03:48:08');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '微信openid',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` datetime NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `points` int NULL DEFAULT 0 COMMENT '用户积分',
  `signature` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '个性签名',
  `is_rider` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为骑手：0-否，1-是',
  `rider_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '骑手实名',
  `rider_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '骑手手机号',
  `rider_id_card` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '骑手身份证号',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `openid`(`openid` ASC) USING BTREE,
  INDEX `idx_users_phone`(`phone` ASC) USING BTREE,
  INDEX `idx_users_openid`(`openid` ASC) USING BTREE,
  INDEX `idx_users_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (2, NULL, 'asd', 'http://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/avatar/1753633794377_1938.png', '15012478621', '2025-07-14 01:36:17', '2025-07-29 02:27:50', '2025-07-29 02:27:50', '$2b$10$ROGGxQMvD5d0N/MKbPZ/guoWY7Lzmaom1KO.cH7PslJlAPR6HUs.2', 126, '一个测试账号', 0, NULL, NULL, NULL);
INSERT INTO `users` VALUES (3, NULL, 'abc', 'http://tea-uniapp.oss-cn-shenzhen.aliyuncs.com/static/avatar/1753633510113_5436.png', '15012942049', '2025-07-27 21:08:40', '2025-07-30 04:06:58', '2025-07-29 03:49:28', '$2b$10$n1aIT1qn.7OnGtmcbqxxOubbCmYbsuN0kAActBPmEu3hDgGq.ezu2', 14, 'ceshi', 0, NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
