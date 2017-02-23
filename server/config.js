
module.exports = {
  PORT: 8807,
  STATIC_FILES: '../public',
  CONDITIONS_KEY: 'CALTRANS_CONDITIONS',
  ROADS_KEY: 'CALTRANS_ROADS',
  UPDATE_KEY: 'CALTRANS_UPDATE',
  UPDATE_INTERVAL: 1000 * 60 * 5, // 5 mins
  FETCH_URL: 'http://www.dot.ca.gov/hq/roadinfo/Hourly'
};
