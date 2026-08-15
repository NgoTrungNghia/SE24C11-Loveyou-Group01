# Research & Decisions: 006 Image Upload & Geolocation

## Local Storage vs Cloud Storage (Cloudinary/S3)
- **Decision**: Local filesystem storage (`public/uploads`) for local development and demonstration.
- **Rationale**: Avoids requiring external API keys or paid cloud subscriptions while allowing full demonstration of image upload, deletion, and public URL serving.

## Base64 Transfer vs Multipart Form Data
- **Decision**: Base64 JSON payload with client-side canvas compression (max 600px, 0.7 quality).
- **Rationale**: Reduces payload size from ~5MB to ~50KB per image, simplifies API handling without complex multipart stream parsing middleware errors.
