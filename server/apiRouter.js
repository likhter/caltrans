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

async function fetchAndSave() {
    const response = await fetch(FETCH_URL);
    const unparsed = await response.text();
    const parsed = parse(unparsed.split("\n"));
    return await Promise.all([
      redisClient.set(CONDITIONS_KEY, JSON.stringify(parsed.conditions)),
      redisClient.sadd(ROADS_KEY, parsed.roads),
      redisClient.set(UPDATE_KEY, Date.now())
    ]);
}

router.get('/everything', async (req, res) => {
  try {
    const [conditionsString, roads, lastUpdate] = await Promise.all([
      redisClient.get(CONDITIONS_KEY),
      redisClient.smembers(ROADS_KEY),
      redisClient.get(UPDATE_KEY)
    ]);

    const conditions = JSON.parse(conditionsString);
    res.status(200).json({
      conditions,
      roads,
      lastUpdate,
      updateInterval: UPDATE_INTERVAL
    });
  } catch(err) {
    res.status(500).json({ err });
  }
});

router.get('/update', async (req, res) => {
    try {
      const lastUpdate = await redisClient.get(UPDATE_KEY);
      const shouldUpdate = Date.now() - lastUpdate > UPDATE_INTERVAL;
      if (shouldUpdate) {
        await fetchAndSave();
        res.status(200).json({ done: true });
      } else {
        res.status(200).json({ err: 'too often' });
      }
    } catch (err) {
      res.status(500).json({ err });
    }
});

module.exports = router;
