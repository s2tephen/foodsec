(function() {
  var foodgroups = ['Fresh/Frozen fruit','Canned Fruit','Fruit Juice','Fresh/Frozen dark green vegetables','Canned dark green vegetables','Fresh/Frozen orange vegetables','Canned orange vegetables','Fresh/Frozen starchy vegetables','Canned starchy vegetables','Fresh/Frozen select nutrient vegetables','Canned select nutrients','Fresh/Frozen other vegetables','Canned other vegetables','Frozen/Dried Legumes','Canned Legumes'];

  d3.csv('data/fruitveg.csv', function(data) {
    for (var i = 0; i < foodgroups.length; i++) {
      drawChart(data.filter(function(d) {
        return d.foodgroup === foodgroups[i];
      }));
    }
  });

  function getMax(data, field) {
    var arr = data.map(function(d) {
      return d.field;
    }).reduce(function(values, current) {
      return values.concat(current);
    }, []);

    return d3.max(arr);
  }

  function formatDate(year, quarter) {
    var outYear = year.toString(),
        outMonth = ('0' + (quarter * 3 - 2).toString()).slice(-2),
        outDay = '01';

    return new Date(outYear + '\/' + outMonth + '\/' + outDay);
  }

  var margin = {top: 30, right: 40, bottom: 30, left: 40};
  var width = 350 - margin.left - margin.right,
      height = 270 - margin.top - margin.bottom;

  var body = d3.select('body');

  function drawChart(data) {
    var svg = body.append('svg')
                .attr('height', height + margin.top + margin.bottom)
                .attr('width', width + margin.left + margin.right);
    var chart = svg.append('g')
                   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.time.scale()
                   .domain([new Date('2004\/01\/01'), new Date('2010\/10\/01')])
                   .range([0, width]),
        y = d3.scale.linear()
                   .domain([0, 100])
                   .range([height, 0])
                   .nice();

    var xAxis = d3.svg.axis()
                      .scale(x)
                      .orient('bottom')
                      .ticks(d3.time.months, 3)
                      .tickFormat(d3.time.format('\'%y')),
        yAxis = d3.svg.axis()
                      .scale(y)
                      .orient('left')
                      .ticks(4);

    var line = d3.svg.line()
                     .x(function(d) {
                       return x(formatDate(d.year, d.quarter));
                     })
                     .y(function(d) {
                       return y(d.price*100);
                     });

    chart.append('g')
         .attr('class', 'x axis')
         .attr('transform', 'translate(0, ' + height + ')')
         .call(xAxis);

    chart.append('g')
       .attr('class', 'y axis')
       .call(yAxis);

    var grid = chart.append('g')
                    .attr('class', 'grid');

    grid.selectAll('.grid .x')
        .data(x.ticks(7))
        .enter().append('line')
                .attr('class', 'x')
                .attr('x1', x)
                .attr('x2', x)
                .attr('y1', 0)
                .attr('y2', height);

    grid.selectAll('.grid .y')
        .data(y.ticks(5))
        .enter().append('line')
                .attr('class', 'y')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', y)
                .attr('y2', y);

    chart.append('path')
         .datum(data)
         .attr('class', 'line')
         .attr('d', line);

    chart.append('text')
         .attr('class', 'value')
         .attr('x', width)
         .attr('y', y(data.slice(-1)[0].price * 100))
         .attr('dx', '0.25em')
         .attr('dy', '0.25em')
         .text(Math.round(data.slice(-1)[0].price * 100).toString() + '\xA2');

    chart.append('text')
         .attr('class', 'title')
         .text(data[0].foodgroup)
         .attr('dy', '-0.5em');
  }
})();