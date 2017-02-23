'use strict';

let _vm;

const API = '/api/';
const CHECKED_ROADS_KEY = 'checked_roads';

const VM = function VM() {
  this.isLoading = ko.observable(false);
  this.isError = ko.observable(false);
  this.roads = ko.observableArray([]);
  this.conditions = ko.observableArray([]);

  this.checkedRoads = ko.observableArray([]);

  this.highlight = str => ( 
    str
      .replace(/\s\/[^\d]+\/\s/g, found => 
        ' <span class="place">' 
        + found.replace(/^\s+/, '').replace(/\s+$/, '') 
        + '</span> ')
      .replace(/CLOSED/g, '<span class="red">CLOSED</span>')
      .replace(/REOPENED/g, '<span class="green">REOPENED</span>')
      .replace(/CHAINS ARE REQUIRED/g, '<span class="pink">CHAINS ARE REQUIRED</span>')
      .replace(/NO TRAFFIC RESTRICTIONS/g, '<span class="green">NO TRAFFIC RESTRICTIONS</span>')
  );

  this.isVisible = ko.computed(() => !this.isLoading(), this);

  this.filteredConditions = ko.computed(() => {
    const count = this.checkedRoads().length;
    return this.conditions().filter(c => {
      if (count == 0) return true;
      return this.checkedRoads().includes(c.name);
    });
  }, this);

  this.checkedRoads.subscribe(val => {
    localStorage.setItem(CHECKED_ROADS_KEY, JSON.stringify(val));
  });


  this.start = () => {
    this.isLoading(true);
    fetch(API + 'update')
      .then(fetch.bind(null, API + 'everything'))
      .then(response => response.json())
      .then(result => {
        this.roads(result.roads);
        this.conditions(result.conditions);
        const checkedRoads = localStorage.getItem(CHECKED_ROADS_KEY);
        try {
          this.checkedRoads(JSON.parse(checkedRoads));
        } catch(e) {
          this.checkedRoads([]);
        } 
        this.isLoading(false);
      })
      .catch(e => {
        console.log('err=', e);
        this.isError(true);
      });
  };
};

ko.applyBindings(window._vm = _vm =  new VM());
_vm.start();
