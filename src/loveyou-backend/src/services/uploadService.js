const path = require('path');
const fs = require('fs');
const { randomUUID: uuidv4 } = require('crypto');

const UPLOAD_BASE = path.join(__dirname, '../../public/uploads');

/**
 * Lưu Base64 image string thành file trên disk
 * @param {string} base64Data - data URL hoặc raw base64
 * @param {'avatars'|'photos'} folder
 * @returns {string} URL path kiểu /uploads/avatars/xxx.jpg
 */
function saveBase64Image(base64Data, folder = 'avatars') {
  // Strip data URL prefix nếu có
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  let ext = 'jpg';
  let raw = base64Data;
  if (matches) {
    ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    raw = matches[2];
  }

  const filename = `${uuidv4()}.${ext}`;
  const dir = path.join(UPLOAD_BASE, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, Buffer.from(raw, 'base64'));

  return `/uploads/${folder}/${filename}`;
}

/**
 * Xóa file upload cũ khỏi disk
 */
function deleteUploadedFile(urlPath) {
  if (!urlPath || !urlPath.startsWith('/uploads/')) return;
  const filepath = path.join(UPLOAD_BASE, '..', urlPath);
  try {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch { /* ignore */ }
}

module.exports = { saveBase64Image, deleteUploadedFile };
