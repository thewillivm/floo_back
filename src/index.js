const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const pushRoutes = require('./routes/pushRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);


app.get('/', (req, res) => {
  res.send('FLOO API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
