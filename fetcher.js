const express = require('express');
const path = require('path');
const apiRouter = require('./apiRouter');

const { PORT } = require('./config');

const app = express();

process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION: Promise=', p, 'reason=', reason);
});

app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT);
