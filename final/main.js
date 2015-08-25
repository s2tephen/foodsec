// (function() {
  // setup map, key
  var width = 960,
      height = 600,
      bar_width = 64,
      bar_height = 10;

  var svg = d3.select('svg')
              .attr('width', width)
              .attr('height', height);

  var key = svg.append('g')
               .attr('class', 'key');

  for (var i = 0; i < 5; i++) {
    key.append('text')
       .attr('class', 'key-label')
       .attr('x', width * 0.535 + bar_width * i)
       .attr('y', bar_height * 5);
    key.append('rect')
       .attr('class', 'q' + i + '-5')
       .attr('width', bar_width)
       .attr('height', bar_height)
       .attr('x', width * 0.55 + bar_width * i)
       .attr('y', bar_height * 2.5);
  }

  key.append('text')
      .attr('class', 'key-label')
      .attr('x', width * 0.535 + bar_width * i)
      .attr('y', bar_height * 5);

  key.append('text')
     .attr('class', 'key-title')
     .attr('x', width * 0.55)
     .attr('y', bar_height * 1.75);

  var snap = key.append('g')
                .attr('class', 'snap');

  // setup selectors
  var selected_age = '19-50';
  var selected_sex = 'f';

  d3.select('.selector-sex')
    .on('click', function() {
      if (selected_sex === 'm') {
        d3.select(this).text('female');
        selected_sex = 'f';
        redrawMap();
      } else {
        d3.select(this).text('male');
        selected_sex = 'm';
        redrawMap();
      }
    });

  d3.select('.selector-age--closed')
    .on('click', function() {
      d3.select(this).attr('class', 'selector-age selector-age--open');
    });

  d3.selectAll('.selector-age > .selector-age-item')
    .on('click', function() {
      var selector = d3.select('.selector-age');
      if (selector.classed('selector-age--open')) {
        var target = d3.select(this);
        selected_age = target.text();
        d3.select('.selector-age-item--active').attr('class', 'selector-age-item');
        target.attr('class', 'selector-age-item selector-age-item--active');
        selector.attr('class','selector-age selector-age--closed');
        d3.event.stopPropagation();
        redrawMap();
      }
    });

  // initialize data variables
  var G_PER_LB = 453.592;
  var SNAP_MAX = 194;

  // all marketgroups
  var marketgroups = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19',
                      '20','21','22','23','24','25','26','91','92','93','94','95','96','97','98','99'];

  // map simplified TFP to QFAHD food groups
  var foodgroups = {
    'Whole Fruit': [1,2],
    'Fruit Juice': [3],
    'Dark Green Vegetables': [4,5],
    'Orange Vegetables': [6,7],
    'All Potatoes': [8,9],
    'Other Vegetables': [10,11,12,13],
    'Beans & Legumes': [14,15],
    'Whole Grains': [16,17,18],
    'Refined Grains': [19,20,21,45,47,50],
    'Low-fat Milk, Yogurt': [22,24],
    'Whole Milk, Yogurt': [25,27],
    'Milk Dessert': [44],
    'Cheese': [23,26],
    'Beef, Pork, etc.': [28,29,30],
    'Poultry': [31,32],
    'Fish': [33,34],
    'Nuts': [35,36],
    'Eggs': [37],
    'Fats & Oils': [38,39],
    'Soft Drinks': [41,42,53,54],
    'Sweets': [40,46],
    'Frozen Entree': [48,51,52],
    'Soups': [49]
  };

  // simplified foodgroup -> year -> CPI
  var cpi = d3.map();

  // simplified foodgroup -> age range -> TFP suggested lbs/week
  var tfp_f = d3.map();
  var tfp_m = d3.map();

  // fips -> marketgroup
  var mg = d3.map();

  // fips -> county name
  var counties = d3.map();

  // main datastore: marketgroup # -> foodgroup # -> cost per 100g
  var qfahd;

  queue(1) // load data
    .defer(d3.json, 'data/us.json')
    .defer(d3.csv, 'data/historical_cpi.csv', function(d) { // load CPI data
      cpi.set(d['item'], {
        '2008': parseFloat(d['2008']),
        '2009': parseFloat(d['2009']),
        '2010': parseFloat(d['2010']),
        '2011': parseFloat(d['2011']),
        '2012': parseFloat(d['2012']),
        '2013': parseFloat(d['2013']),
        '2014': parseFloat(d['2014'])
      });
    })
    .defer(d3.csv, 'data/tfp_children.csv', function(d) { // load TFP for children
      tfp_f.set(d['foodgroup'], {
        '1': parseFloat(d['1 year']),
        '2-3': parseFloat(d['2-3 years']),
        '4-5': parseFloat(d['4-5 years']),
        '6-8': parseFloat(d['6-8 years']),
        '9-11': parseFloat(d['9-11 years'])
      });
      tfp_m.set(d['foodgroup'], {
        '1': parseFloat(d['1 year']),
        '2-3': parseFloat(d['2-3 years']),
        '4-5': parseFloat(d['4-5 years']),
        '6-8': parseFloat(d['6-8 years']),
        '9-11': parseFloat(d['9-11 years'])
      });
    })
    .defer(d3.csv, 'data/tfp_females.csv', function(d) { // load TFP for females
      var entry = tfp_f.get(d['foodgroup']);
      entry['12-13'] = parseFloat(d['12-13 years']);
      entry['14-18'] = parseFloat(d['14-18 years']);
      entry['19-50'] = parseFloat(d['19-50 years']);
      entry['51-70'] = parseFloat(d['51-70 years']);
      entry['71+'] = parseFloat(d['71+ years']);
    })
    .defer(d3.csv, 'data/tfp_males.csv', function(d) { // load TFP for males
      var entry = tfp_m.get(d['foodgroup']);
      entry['12-13'] = parseFloat(d['12-13 years']);
      entry['14-18'] = parseFloat(d['14-18 years']);
      entry['19-50'] = parseFloat(d['19-50 years']);
      entry['51-70'] = parseFloat(d['51-70 years']);
      entry['71+'] = parseFloat(d['71+ years']);
    })
    .defer(d3.csv, 'data/counties.csv', function(d) { // load marketgroups, county names
      mg.set(d.fips, d.marketgroup);
      counties.set(d.fips, d.name);
    })
    .await(drawMap);

  // returns the monthly TFP cost
  function calcCost(fips, age, sex) {
    var mkt = mg.get(fips);
    if (mkt) {
      return qfahd[mkt].monthlyCost(age, sex);
    }
    else
      return null;
  }

  // draws the map
  function drawMap(error, us) {
    // calculate monthly cost
    d3.csv('data/qfahd_recent.csv', function(csv) {
      qfahd = d3.nest()
                  .key(function(d) { return d.marketgroup; })
                  .rollup(function(values) {
                    return {
                      monthlyCost: function(age, sex) { // returns monthly cost for given age, sex
                        return _.reduce(foodgroups, function(memo, value, key) {
                          var relevantValues = values.filter(function(d) {
                            return _.contains(value, parseInt(d.foodgroup));
                          });
                          var lbsPerWeek;
                          if (sex === 'm') {
                            lbsPerWeek = tfp_m.get(key)[age];
                          }
                          else {
                            lbsPerWeek = tfp_f.get(key)[age];
                          }
                          var pricePerHectogram = d3.min(relevantValues, function(d) {
                            var pctInflation = 1;
                            for (var year = parseInt(d.year); year < 2015; year++) {
                              pctInflation *= (1 + cpi.get(key)[year]/100); // adjusting for inflation
                            }
                            return parseFloat(d.price) * pctInflation;
                          });
                          return memo += pricePerHectogram / 100 * G_PER_LB * lbsPerWeek * 4;
                        }, 0);
                      }
                    };
                  })
                  .map(csv);

      // draw key
      d3.select('.key-title')
        .text('Monthly cost');

      var costs = _.map(marketgroups, function(mg) {
                    return qfahd[mg].monthlyCost(selected_age, selected_sex);
                  });
      costs.sort();

      var quantile = d3.scale.quantile()
                             .domain(costs)
                             .range(d3.range(5).map(function(i) {
                               return 'q' + i + '-5';
                             }));

      var thresholds = _.flatten([_.min(costs), quantile.quantiles(), _.max(costs)]);

      d3.selectAll('.key-label')
        .text(function(d, i) {
          return '$' + thresholds[i].toFixed(0);
        });

      var snap_ratio,
          snap_percentile;
      var snap_nearest = _.findIndex(costs, function(value) {
                           return SNAP_MAX < value;
                         });

      if (snap_nearest === -1) {
        snap_percentile = 0;
        snap_ratio = 5; // mark at end of key
        d3.select('.summary-pct')
          .text((snap_percentile * 100).toFixed(0) + '%');
      }
      else {
        snap_percentile = (35 - snap_nearest) / 35; // % of counties over SNAP max
        snap_ratio = 5 * (1 - snap_percentile);
        d3.select('.summary-pct')
          .text((snap_percentile * 100).toFixed(0) + '%');
      }

      d3.selectAll('.key-label')
        .text(function(d, i) {
          return '$' + thresholds[i].toFixed(0);
        });

      snap.append('rect')
        .attr('class', 'snap-line')
        .attr('width', 2)
        .attr('height', bar_height * 1.5)
        .attr('x', width * 0.55 + bar_width * snap_ratio)
        .attr('y', bar_height * 2.25);

      snap.append('text')
          .attr('class', 'snap-label')
          .attr('x', width * 0.535 + bar_width * snap_ratio)
          .attr('y', bar_height * 1.75);

      snap.append('text')
          .attr('class', 'snap-title')
          .attr('x', width * 0.565 + bar_width * snap_ratio)
          .attr('y', bar_height * 1.75);

      d3.select('.snap-label')
        .text('$' + SNAP_MAX);

      d3.select('.snap-title')
        .text('SNAP maximum');

      // create map
      var projection = d3.geo.albersUsa()
                             .scale(1280)
                             .translate([width / 2, height / 2]);

      var path = d3.geo.path()
                       .projection(projection);

      // draw counties
      svg.append('g')
         .attr('class', 'counties')
         .selectAll('path')
         .data(topojson.feature(us, us.objects.counties).features)
         .enter().append('path')
         .attr('class', function(d) {
           if (calcCost(d.id, selected_age, selected_sex))
             return 'county ' + quantile(calcCost(d.id, selected_age, selected_sex));
           else
             return 'county';
         })
         .attr('d', path);

      // draw state boundaries
      svg.append('path')
         .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
         .attr('class', 'states')
         .attr('d', path);
    });
  }

  // redraws map after selector change
  function redrawMap() {
    // recolor map
    var costs = _.map(marketgroups, function(mg) {
                  return qfahd[mg].monthlyCost(selected_age, selected_sex);
                });
    costs.sort();

    var quantile = d3.scale.quantile()
                           .domain(costs)
                           .range(d3.range(5).map(function(i) {
                              return 'q' + i + '-5';
                           }));

    var thresholds = _.flatten([_.min(costs), quantile.quantiles(), _.max(costs)]);
    d3.selectAll('.county')
      .attr('class', function(d) {
        if (calcCost(d.id, selected_age, selected_sex))
          return 'county ' + quantile(calcCost(d.id, selected_age, selected_sex));
        else
          return 'county';
      });

    // update key
    var snap_ratio,
        snap_percentile;
    var snap_nearest = _.findIndex(costs, function(value) {
                         return SNAP_MAX < value;
                       });

    if (snap_nearest === -1) {
      snap_percentile = 0;
      snap_ratio = 5; // mark at end of key
      d3.select('.summary-pct')
        .text((snap_percentile * 100).toFixed(0) + '%');
    }
    else {
      snap_percentile = (35 - snap_nearest) / 35; // % of counties over SNAP max
      snap_ratio = 5 * (1 - snap_percentile);
      d3.select('.summary-pct')
        .text((snap_percentile * 100).toFixed(0) + '%');
    }

    d3.selectAll('.key-label')
      .text(function(d, i) {
        return '$' + thresholds[i].toFixed(0);
      });

    d3.select('.snap-line')
      .attr('x', width * 0.55 + bar_width * snap_ratio)
      .attr('y', bar_height * 2.25);

    d3.select('.snap-label')
        .attr('x', width * 0.535 + bar_width * snap_ratio)
        .attr('y', bar_height * 1.75);

    d3.select('.snap-title')
        .attr('x', width * 0.565 + bar_width * snap_ratio)
        .attr('y', bar_height * 1.75);
  }
// })();