const uploadService = require('../services/uploadService');
const { success } = require('./baseController');

async function uploadAvatar(req, res, next) {
  try {
    const { imageData } = req.body; // Base64 string
    if (!imageData) {
      return res.status(400).json({ success: false, error: { message: 'imageData (base64) is required' } });
    }
    const url = uploadService.saveBase64Image(imageData, 'avatars');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return success(res, { url: `${baseUrl}${url}` });
  } catch (err) { return next(err); }
}

async function uploadPhotos(req, res, next) {
  try {
    const { photos } = req.body; // Array of Base64 strings
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'photos array is required' } });
    }
    if (photos.length > 6) {
      return res.status(400).json({ success: false, error: { message: 'Maximum 6 photos allowed' } });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const urls = photos.map(p => `${baseUrl}${uploadService.saveBase64Image(p, 'photos')}`);
    return success(res, { urls });
  } catch (err) { return next(err); }
}

module.exports = { uploadAvatar, uploadPhotos };
