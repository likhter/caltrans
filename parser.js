const trimLine = line => line.replace(/^\s*/, '').replace(/\s*$/, '');
const isEmptyLine = line => /^\s*$/.test(line);
const isRoadName = line => /^(I|SR|US)\s+\d+$/.test(line);
const isRegionName = line => /^\[[^\]]+\]$/.test(line);

class InfoEntry {
  constructor(name) {
    this.name = name;
    this.entries = [];
  }
  addEntry(entry) {
    this.entries.push(entry);
  }
  serialize() {
    return { name: this.name, entries: this.entries };
  }
}

module.exports = function parse(lines) {
  const conditions = [];
  const roads = [];
  let stack = [];
  let currentRoad = null;
  let currentRegion = null;
  let gotEmptyLine = false;
  lines.map(trimLine).forEach(line => {
    console.log('LINE: ', line);
    if (isEmptyLine(line)) {
      if (currentRegion && stack.length) {
        console.log('COLLAPSING NEXT LINES:', stack);
        currentRegion.addEntry(stack.join(' '));
        stack = [];
      }
      gotEmptyLine = true;
      return;
    }
    if (gotEmptyLine) {
      gotEmptyLine = false;
      if (isRoadName(line)) {
        if (currentRoad) {
          if (currentRegion) {
            currentRoad.addEntry(currentRegion);
          }
          conditions.push(currentRoad);
        }
        console.log('>>> NEW ROAD CREATED:', line);
        currentRoad = new InfoEntry(line);
        roads.push(line);
        currentRegion = null;
        return;
      }
    }
    if (isRegionName(line)) {
      if (currentRegion) {
        currentRoad.addEntry(currentRegion);
      }
      currentRegion = new InfoEntry(line);
      console.log('>>> NEW REGION CREATED: ', line);
      return;
    }
    if (currentRegion) {
      stack.push(line);
    }
  });

  if (currentRoad) { 
    if (currentRegion) { 
      if (stack.length) {
        currentRegion.addEntry(stack.join(' '));
      }
      currentRoad.addEntry(currentRegion);
    }
    conditions.push(currentRoad);
  }
  return { conditions, roads };
};
