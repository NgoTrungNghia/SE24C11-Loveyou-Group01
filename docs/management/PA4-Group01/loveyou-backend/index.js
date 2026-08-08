const dotenv = require('dotenv');
dotenv.config();

const app = require('./src/app');
const config = require('./src/config');

if (!config.EMAIL_USER || !config.EMAIL_APP_PASSWORD) {
  console.warn('Warning: EMAIL_USER or EMAIL_APP_PASSWORD is not set');
}

const port = config.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
