# Chức Năng Đăng Bài Mới

## Tổng Quan
Đã tạo lại hoàn toàn chức năng đăng bài với 2 loại:

1. **Đăng bài đơn giản** (`/api/Post/user`) - Cho user thường
2. **Đăng bài cho thuê/bán** (`/api/Post/landlord`) - Cho chủ nhà

## Cấu Trúc Mới

### API Functions (`apis/posts.ts`)
- `fetchUtilities()` - Lấy danh sách tiện ích
- `fetchBuildings()` - Lấy danh sách tòa nhà  
- `createLandlordPost()` - Tạo bài đăng cho chủ nhà
- `createUserPost()` - Tạo bài đăng đơn giản

### Forms
- **`app/(tabs)/explore.tsx`** - Form đăng bài cho chủ nhà (chi tiết)
- **`app/create-user-post.tsx`** - Form đăng bài đơn giản cho user

## Tính Năng

### Form Chủ Nhà (Landlord)
- ✅ Tiêu đề và mô tả
- ✅ Giá thuê/bán
- ✅ Chọn tòa nhà từ API
- ✅ Thông tin căn hộ (mã, tầng, diện tích, loại, số phòng ngủ)
- ✅ Chọn tiện ích từ API (checkbox)
- ✅ Validation đầy đủ
- ✅ UI đẹp với Material Design

### Form User Đơn Giản
- ✅ Tiêu đề và mô tả
- ✅ Validation cơ bản
- ✅ UI đơn giản, dễ sử dụng

## API Endpoints Sử Dụng

### GET `/api/Utility`
```json
{
  "currentPage": 1,
  "totalPages": 1,
  "totalItems": 8,
  "items": [
    {
      "utilityId": 1,
      "name": "Máy giặt",
      "createdAt": "2025-10-04T18:08:23.443"
    }
  ]
}
```

### GET `/api/Building`
```json
{
  "currentPage": 1,
  "totalPages": 1,
  "totalItems": 5,
  "items": [
    {
      "buildingId": 1,
      "name": "Tòa A",
      "address": "123 Đường ABC"
    }
  ]
}
```

### POST `/api/Post/landlord`
```json
{
  "title": "Cho thuê căn hộ sinh viên",
  "description": "Chỉ cho nữ",
  "price": 5000000,
  "status": "available",
  "utilityIds": [1],
  "apartment": {
    "buildingId": 1,
    "apartmentCode": "2209",
    "floor": 22,
    "area": 100,
    "apartmentType": "studio",
    "status": "available",
    "numberOfBedrooms": 1
  }
}
```

### POST `/api/Post/user`
```json
{
  "title": "Tìm phòng trọ",
  "description": "Tìm phòng trọ gần trường đại học"
}
```

## Cách Sử Dụng

1. **Truy cập tab "Đăng bài"**
2. **Chọn loại đăng bài:**
   - "Đăng bài đơn giản" → Form đơn giản cho user
   - "Đăng bài cho thuê/bán" → Form chi tiết cho chủ nhà
3. **Điền thông tin và submit**

## Lưu Ý

- Cần đảm bảo API Base URL được cấu hình đúng
- Cần có token authentication để gọi API
- Form có validation đầy đủ để tránh lỗi
- UI responsive và user-friendly

## Test Data

Sử dụng curl command đã test thành công:
```bash
curl -X 'POST' \
  'http://vlivingapi-prod.eba-3t3ifafu.ap-southeast-1.elasticbeanstalk.com/api/Post/landlord' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Cho thuê căn hộ sinh viên",
    "description": "Chỉ cho nữ",
    "price": 5000000,
    "status": "available",
    "utilityIds": [1],
    "apartment": {
      "buildingId": 1,
      "apartmentCode": "2209",
      "floor": 22,
      "area": 100,
      "apartmentType": "studio",
      "status": "available",
      "numberOfBedrooms": 1
    }
  }'
```
