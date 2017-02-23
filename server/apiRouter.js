const fetch = require('node-fetch');
const parse = require('./parser');
const Router = require('express').Router;
const Redis = require('ioredis');

const router = Router();
const redisClient = new Redis();

const {
  CONDITIONS_KEY,
  ROADS_KEY,
  UPDATE_KEY,
  UPDATE_INTERVAL,
  FETCH_URL
} = require('./config');

function fetchAndSave() {
  return new Promise((resolve, reject) => {
    fetch(FETCH_URL)
      .then(res => res.text())
      .then(res => parse(res.split("\n")))
      .then(parsed => Promise.all([
        redisClient.set(CONDITIONS_KEY, JSON.stringify(parsed.conditions)),
        redisClient.set(ROADS_KEY, JSON.stringify(parsed.roads)),
        redisClient.set(UPDATE_KEY, Date.now())
      ]))
      .then(resolve)
      .catch(reject);
  });
}

router.get('/everything', (req, res) => {
  Promise.all([
    redisClient.get(CONDITIONS_KEY),
    redisClient.get(ROADS_KEY),
    redisClient.get(UPDATE_KEY)
  ]).then(([conditions, roads, lastUpdate]) => {
    try {
      conditions = JSON.parse(conditions);
      roads = JSON.parse(roads);
    } catch(e) {
      throw 'update is needed';
    }
    res.status(200).json({ 
      conditions, 
      roads, 
      lastUpdate,
      updateInterval: UPDATE_INTERVAL
    });
  }).catch(e => console.log(e) && res.status(500).json({ e }));
});

router.get('/update', (req, res) => {
  redisClient.get(UPDATE_KEY)
    .then(update => {
      const shouldUpdate = Date.now() - update > UPDATE_INTERVAL;
      if (shouldUpdate) {
        fetchAndSave().then(() => res.status(200).json({ done : true }));
      } else {
        res.status(200).json({ err: 'too often' });
      }
    })
    .catch(err => res.status(500).json({ err }));
});

module.exports = router;
