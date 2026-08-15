# Quickstart: 006 Image Upload & Geolocation

## Testing File Upload & Geolocation

1. Open `http://localhost:5173/onboarding`.
2. Proceed to Step 3 (Ảnh & Cài đặt tìm kiếm).
3. Click any 2x2 photo slot card to pick a local image file. The client will compress it to max 600px width/height JPEG.
4. Click **📡 Lấy vị trí GPS của tôi**. Approve browser location permission prompt.
5. Verification: Check `src/public/uploads/photos/` directory on disk for newly created `.jpg` file.
