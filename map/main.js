(function() {
  var width = 960,
      height = 600;

  var marketgroup = d3.map(), // fips -> marketgroup
      price = d3.map(); // [marketgroup, foodgroup] -> price

  var weekly_prices = [];

  var tfp = [
    {
      name: 'Whole Fruit',
      weight: 2678.46,
      foodgroups: [1,2]
    },
    {
      name: 'Fruit Juice',
      weight: 503.49,
      foodgroups: [3]
    },
    {
      name: 'Dark Green Vegetables',
      weight: 573.79,
      foodgroups: [4,5]
    },
    {
      name: 'Orange Vegetables',
      weight: 492.15,
      foodgroups: [6,7]
    },
    {
      name: 'All Potatoes',
      weight: 1027.39,
      foodgroups: [8,9]
    },
    {
      name: 'Other Vegetables',
      weight: 1052.33,
      foodgroups: [10,11,12,13]
    },
    {
      name: 'Beans & Legumes',
      weight: 635.03,
      foodgroups: [14,15]
    }
  ];

  var quantize = d3.scale.quantize()
      .domain([20, 30])
      .range(d3.range(5).map(function(i) { return 'q' + i + '-5'; }));

  var projection = d3.geo.albersUsa()
      .scale(1280)
      .translate([width / 2, height / 2]);

  var path = d3.geo.path()
      .projection(projection);

  var svg = d3.select('body').append('svg')
      .attr('width', width)
      .attr('height', height);

  var div = d3.select('body').append('div')
                             .attr('class', 'tooltip')
                             .style('opacity', 0);

  queue()
      .defer(d3.json, 'data/us.json')
      .defer(d3.csv, 'data/fips2mg.csv', function(d) { marketgroup.set(d.FIPS, d.MARKETGROUP26); })
      .defer(d3.csv, 'data/qfahd.csv', function(d) { price.set([d.marketgroup, d.foodgroup], d.price); })
      .await(ready);

  function calcPrice(id) {
    var weekly_price = 0;
    var mg = marketgroup.get(id);

    for (var i = 0; i < tfp.length; i++) {
      var pr = 0,
          n = 0;
      for (var j = 0; j < tfp[i].foodgroups.length; j++) {
        if (price.get([mg, tfp[i].foodgroups[j]]) !== '') {
          pr += price.get([mg, tfp[i].foodgroups[j]]) * (tfp[i].weight/100);
          n++;
        }
      }
      weekly_price += pr/n;
    }

    return weekly_price;
  }

  function ready(error, us) {
    svg.append('g')
        .attr('class', 'counties')
      .selectAll('path')
        .data(topojson.feature(us, us.objects.counties).features)
      .enter().append('path')
        .attr('class', function(d) {
          return quantize(calcPrice(d.id));
        })
        .attr('d', path)
        .on('mouseover', function(d) {
          d3.select(this).transition().duration(300).style('opacity', 1);
          div.transition().duration(300).style('opacity', 1)
             .text('$' + calcPrice(d.id).toFixed(2) + '/week')
             .style("left", (d3.event.pageX) + "px")
             .style("top", (d3.event.pageY -30) + "px");
        })
        .on('mouseout', function() {
          d3.select(this).transition().duration(300).style('opacity', 0.8);
          div.transition().duration(300).style('opacity', 0);
        });

    svg.append('path')
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr('class', 'states')
        .attr('d', path);
  }

  d3.select(self.frameElement).style('height', height + 'px');
})();