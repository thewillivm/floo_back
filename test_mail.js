require('dotenv').config();
const { sendEmail } = require('./src/config/mailService');

async function test() {
  console.log('Testing email to william.kouakinimo@gmail.com...');
  const res = await sendEmail('william.kouakinimo@gmail.com', 'Test FLOO', '<h1>Test</h1><p>Ceci est un test de notification email.</p>');
  if (res) {
    console.log('Email test success:', res.messageId);
  } else {
    console.log('Email test failed.');
  }
}

test();
