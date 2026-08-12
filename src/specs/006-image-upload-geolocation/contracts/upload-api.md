# Upload API Contract

## Endpoints

### 1. Upload Avatar
- **POST** `/api/upload/avatar`
- **Auth**: Bearer JWT
- **Body**: `{ "imageData": "data:image/jpeg;base64,..." }`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "url": "http://localhost:3000/uploads/avatars/uuid.jpg"
    }
  }
  ```

### 2. Upload Photos Gallery
- **POST** `/api/upload/photos`
- **Auth**: Bearer JWT
- **Body**: `{ "photos": ["data:image/jpeg;base64,...", "..."] }`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "urls": [
        "http://localhost:3000/uploads/photos/uuid1.jpg",
        "http://localhost:3000/uploads/photos/uuid2.jpg"
      ]
    }
  }
  ```
