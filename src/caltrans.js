'use strict';

let _vm;

const API = '/api/';
const CHECKED_ROADS_KEY = 'checked_roads';
const COMPACT_MODE_KEY = 'is_compact_mode';

const VM = function VM() {
  this.isLoading = ko.observable(false);
  this.isError = ko.observable(false);
  this.lastUpdate = ko.observable(0);
  this.updateInterval = ko.observable();
  this.roads = ko.observableArray([]);
  this.conditions = ko.observableArray([]);
  this.checkedRoads = ko.observableArray([]);

  this.showAll = () => {
    this.checkedRoads([]);
  };

  this.highlight = str => ( 
    str
      .replace(/\s\/[^\d]+\/\s/g, found => ` <span class="place">${found.trim()}</span> `)
      .replace(/CLOSED/g, '<span class="red">CLOSED</span>')
      .replace(/REOPENED/g, '<span class="green">REOPENED</span>')
      .replace(/(CHAINS .* REQUIRED)/g, '<span class="pink">$1</span>')
      .replace(/NO TRAFFIC RESTRICTIONS/g, '<span class="green">NO TRAFFIC RESTRICTIONS</span>')
  );

  this.isVisible = ko.computed(() => !this.isLoading(), this);
  this.isCompactMode = ko.observable(false);

  this.lastUpdateReadable = ko.computed(() => {
    const d = new Date(+this.lastUpdate());
    let h = d.getHours(),
      m = d.getMinutes();

    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    return h + ':' + m;
  }, this);
  this.updateIntervalReadable = ko.computed(() => (this.updateInterval() / 1000 / 60) + ' min', this)

  this.filteredConditions = ko.computed(() => {
    const count = this.checkedRoads().length;
    if (count === 0) {
      return this.conditions();
    }
    const checked = new Set(this.checkedRoads());
    return this.conditions().filter(c => checked.has(c.name));
  }, this);

  this.checkedRoads.subscribe(val => {
    localStorage.setItem(CHECKED_ROADS_KEY, JSON.stringify(val));
    if (val.length > 0) {
      location.hash = '#' + val.map(cr => cr.replace(/\D/g, ''))
                               .sort((a, b) => a - b)
                               .join(',');
    }
    else {
      location.hash = '';
    }
  });

  this.isCompactMode.subscribe(value => localStorage.setItem(COMPACT_MODE_KEY, value));

  this.startReloadTimer = () => {
    if (this.timeout) { setTimeout(this.timeout); }
    setTimeout(this.start.bind(this), this.updateInterval());
  };

  this.getCheckedRoads = () => {
    if (location.hash.match(/^#[\d,]*$/)) {
      const regexp = new RegExp(
        location.hash
          .substr(1)
          .split(',')
          .map(cr => cr.match(/^\d+$/) ? `^[A-Z]+ ${cr}$` : `^${cr}$`)
          .join('|')
      );
      return this.roads().filter(r => r.name.match(regexp)).map(r => r.name);
    }
    const fromStorage = localStorage.getItem(CHECKED_ROADS_KEY);
    if (fromStorage) {
      try {
        return JSON.parse(fromStorage);
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  this.updateCheckedRoads = () => {
    this.checkedRoads(this.getCheckedRoads());
  };

  this.toggleCompactMode = () => {
    this.isCompactMode(!this.isCompactMode());
  };

  this.onRoadClick = (road, ev) => {
    const target = ev.target;
    this.isCompactMode(false);
    target.scrollIntoView();
  }

  this.start = () => {
    this.isLoading(true);
    // local storage can not save boolean values
    this.isCompactMode(localStorage.getItem(COMPACT_MODE_KEY) === "true" || false);
    fetch(API + 'update')
      .then(() => fetch(API + 'everything'))
      .then(response => response.json())
      .then(result => {
        ['conditions', 'lastUpdate', 'updateInterval'].forEach(fn => {
          this[fn](result[fn]);
        });
        this.roads(
          result.roads.map(x => ({ 
            name: x, 
            modifier: x.split(' ')[0], 
            number: +x.split(' ')[1] 
          }))
          .sort((a, b) => a.number > b.number ? 1 : -1)
        );
        this.updateCheckedRoads();
        this.isLoading(false);
        this.startReloadTimer();
      })
      .catch(e => {
        console.log('err=', e);
        this.isError(true);
      });
  };
};

ko.applyBindings(window._vm = _vm =  new VM());
window.addEventListener('hashchange',() => _vm.updateCheckedRoads());

_vm.start();

