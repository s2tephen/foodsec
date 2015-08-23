(function() {
  var G_PER_LB = 453.592;

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

  // main datastore: marketgroup # -> foodgroup # -> cost per 100g
  var qfahd;

  // defaults, call drawMap on change
  var selected_age = '19-50';
  var selected_sex = 'Female';

  queue(1) // serial queue
    .defer(d3.json, 'data/us.json') // load shapefile
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
      tfp_f.set(d['foodgroup'], {
        '12-13': parseFloat(d['12-13 years']),
        '14-18': parseFloat(d['14-18 years']),
        '19-50': parseFloat(d['19-50 years']),
        '51-70': parseFloat(d['51-70 years']),
        '71+': parseFloat(d['71+ years'])
      });
    })
    .defer(d3.csv, 'data/tfp_males.csv', function(d) { // load TFP for males
      tfp_m.set(d['foodgroup'], {
        '12-13 years': parseFloat(d['12-13 years']),
        '14-18 years': parseFloat(d['14-18 years']),
        '19-50 years': parseFloat(d['19-50 years']),
        '51-70 years': parseFloat(d['51-70 years']),
        '71+ years': parseFloat(d['71+ years'])
      });
    })
    .defer(d3.csv, 'data/fips2mg.csv', function(d) { // load marketgroups
      mg.set(d.fips, d.marketgroup);
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
    d3.csv('data/qfahd_recent.csv', function(csv) {
      qfahd = d3.nest()
                  .key(function(d) { return d.marketgroup; })
                  .rollup(function(values) {
                    return {
                      monthlyCost: function(age, sex) { // calculate all the things
                        return _.reduce(foodgroups, function(memo, value, key) {
                          var relevantValues = values.filter(function(d) {
                            return _.contains(value, parseInt(d.foodgroup));
                          });
                          var lbsPerWeek;
                          if (sex === 'm')
                            lbsPerWeek = tfp_m.get(key)[age];
                          else
                            lbsPerWeek = tfp_f.get(key)[age];
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

      var width = 960,
          height = 600;

      var costs = _.map(marketgroups, function(mg) {
                    return qfahd[mg].monthlyCost(selected_age, selected_sex);
                  });
      costs.sort();

      console.log(costs);

      var quantile = d3.scale.quantile()
                             .domain(costs)
                             .range(d3.range(5).map(function(i) {
                               return 'q' + i + '-5';
                            }));

      var projection = d3.geo.albersUsa()
                             .scale(1280)
                             .translate([width / 2, height / 2]);

      var path = d3.geo.path()
          .projection(projection);

      var svg = d3.select('body').append('svg')
          .attr('width', width)
          .attr('height', height);

      svg.append('g')
         .attr('class', 'counties')
         .selectAll('path')
         .data(topojson.feature(us, us.objects.counties).features)
         .enter().append('path')
         .attr('class', function(d) {
           if (calcCost(d.id, selected_age, selected_sex))
             return quantile(calcCost(d.id, selected_age, selected_sex));
           else
             return null;
         })
         .attr('d', path);

      svg.append('path')
         .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
         .attr('class', 'states')
         .attr('d', path);
    });
  }
})();