const express = require('express');
const path = require('path');
const apiRouter = require('./apiRouter');

const { PORT, STATIC_FILES } = require('./config');

const app = express();

process.on('unhandledException', e => {
  console.log('UNHANLED EXCEPTION:', e);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION: Promise=', p, 'reason=', reason);
});

app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, STATIC_FILES)));

app.listen(PORT);
