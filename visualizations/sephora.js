
d3.select('body')
    .attr('id', 'sephora');


// create 2 charts and keep track of width, margins, scales, and axes in objects
var width = {main: d3.select('#sephora-container').node().clientWidth,
                bar: 0,
                dot: 0
            };

var margin = {};

if (width['main'] > 900) {
    margin['bar'] = {top: 120, right: 40, bottom: 20, left: 230};
    margin['dot'] = {top: 120, right: 40, bottom: 20, left: 10};
} else if (width['main'] < 400) {
    margin['bar'] = {top: 120, right: 20, bottom: 20, left: 150};
    margin['dot'] = {top: 120, right: 20, bottom: 20, left: 150};
} else {
    margin['bar'] = {top: 120, right: 40, bottom: 20, left: 230};
    margin['dot'] = {top: 120, right: 40, bottom: 20, left: 230};
}

var height = 600 - margin.bar.top - margin.bar.bottom;

var chart_types = d3.keys(margin);

// keep track of xscale and yscale for each chart type in object
var xscale = { bar: d3.scale.linear(),
                dot: d3.scale.linear()
            };

var yscale = { bar: d3.scale.ordinal(),
                dot: d3.scale.ordinal(),
            };

// keep track of axes for each chart type in objects
var xaxes = { bar: d3.svg.axis(),
                dot: d3.svg.axis()
            }

var yaxes = { bar: d3.svg.axis(),
                dot: d3.svg.axis()
            }

// create svgs for each chart and set initial scale and axes properties
chart_types.forEach(function (d) {
    var chart = d3.select('#chart-' + d),
        w = chart.node().clientWidth - margin[d].left - margin[d].right;
        width[d] = w;
    
    chart.append('svg')
        .attr('width', w + margin[d].left + margin[d].right)
        .attr('height', height + margin[d].top + margin[d].bottom)
        .attr('class', 'svg-' + chart)
      .append("g")
        .attr("transform", "translate(" + margin[d].left + "," + margin[d].top + ")")
        .attr('class', function () { return 'g-' + d});

    xscale[d].range([0, width[d]]);
    xaxes[d].scale(xscale[d])
            .orient('top')
            .tickSize(-height)
            .tickPadding(10)
            .ticks(6);

    yscale[d].rangeBands([height, 0], 0.3);
    yaxes[d].scale(yscale[d])
        .tickSize(-width[d])
        .tickPadding(10)
        .orient('left');
})

if (width['main'] < 400) {
    yaxes.bar.ticks(4)
}

// set initial values for sort variable
var sort_by = 'rating';

// load the data
d3.csv('sephora.csv', make_charts);

function make_charts (error, data) {
    if (error) throw "error loading data";

    // format data as numbers
    data.forEach(function (d) {
        d.rating = +d.rating;
        d.num_reviews = +d.num_reviews;
        d.bayesian_est = +d.bayesian_est;
    })

    // sort data descending by sort variable
    data.sort(function (a, b) {
        return a[sort_by] - b[sort_by];
    });

    // get list of all products
    var brands = data.map(function (d) {
        return d.brand + ' ' + d.name.split(' ')[0]; });

    // set xscale domains
    xscale.bar.domain([0, d3.max(data, function (d) { return d.num_reviews; })]).nice()
    xscale.dot.domain([0, 5])

    // create all charts
    chart_types.forEach(function (chart) {

        yscale[chart].domain(brands)

        var svg = d3.select('.g-' + chart);

        svg.append('text')
            .attr('class', 'chart-title chart-title-' + chart)
            .attr('y', function () {
                if (width['main'] < 400) {
                    return -40;
                } else {
                    return -60;
                }
            })
            .text('');

        svg.append('g')
            .attr('class', 'x axis axis-' + chart)
            .call(xaxes[chart]);

        svg.append('g')
            .attr('class', 'y axis axis-' + chart)
            .call(yaxes[chart]);

        var group = svg.selectAll('.g-' + chart + 'group')
            .data(data)
          .enter().append('g')
            .attr('class', function (d) {
                return 'g-' + chart + 'group ' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
            })
            .attr("transform", function (d) {
                return "translate(0," + yscale[chart](d.brand + ' ' + d.name.split(' ')[0]) + ")";
            });

        if (chart === 'bar') {
            group.append('rect')
                .attr('width', function (d) {
                    return xscale.bar(d.num_reviews);
                })
                .attr('height', yscale.bar.rangeBand())
                .attr('class', function (d) {
                        return 'bar g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                });

        } else {
            group.append('circle')
                .attr("transform", function (d) {
                    return "translate(" + xscale.dot(d.rating) + "," 
                        + yscale.dot.rangeBand()/2 + ")";
                })
                .attr('class', function (d) {
                    return 'dot rating g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                })
                .attr('r', 8);

            group.append('circle')
                .attr("transform", function (d) {
                    return "translate(" + xscale.dot(d.bayesian_est) + "," 
                        + yscale.dot.rangeBand()/2 + ")";
                })
                .attr('class', function (d) {
                    return 'dot bayes g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                })
                .attr('r', 8);
        }

        // add listener shape for highlighting row
        group.append('rect')
            .attr('width', width[chart] + margin[chart].left + margin[chart].right)
            .attr('height', yscale.bar.rangeBand())
            .attr('class', function (d) {
                return 'isolate-row row-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
            })
            .attr('transform', 'translate(' + (-margin[chart].left) + ',0)');

    })

    // add chart titles
    d3.select('.chart-title-bar').text('Number of Reviews')
    d3.select('.chart-title-dot').text(function () {
        if (width['main'] > 900) {
            return 'Sephora Rating v Bayesian Estimate'
        }
    });

    if (width['main'] < 900) {
        d3.select('.chart-title-dot').text('Sephora Rating v')
            .attr('y', -60)
            .append('tspan')
            .attr('y', -35)
            .attr('x', 0)
            .text('Bayesian Estimate')
    }

    var sort_values = [{value: 'num_reviews',
                        text: 'Number of Reviews'
                    },
                        {value: 'rating',
                        text: 'Sephora Rating' 
                    },
                        {value: 'bayesian_est',
                        text: 'Bayesian Estimate'
                    }];

    d3.select('svg')
        .append('text')
        .attr('class', 'sort-by-text')
        .attr('transform', 'translate(10, 30)')
        .text('Sorted by:')

    var sort_buttons = d3.select('svg').selectAll('.sort-buttons')
        .data(sort_values)
      .enter().append('g')
        .attr('class', function (d) {
            if (d.value === sort_by) {
                return 'sort-buttons active-sort'
            } else {
                return 'sort-buttons'
            }
        })
        .attr('transform', function (d, i) {
            return 'translate(10,' + (40 + 22 * i) + ')';
        });

    sort_buttons.append('rect')
        .attr({
            height: 20,
            width: 130,
            rx: 6,
            ry: 6
        })
        .attr('class', function (d) {
            return 'sort-button-rect ' + d.value;
        });

    sort_buttons.append('text')
        .attr('class', function (d) {
            return 'sort-button-text ' + d.value;
        })
        .attr('x', 6)
        .attr('y', function () {
            if (width['main'] < 400) {
                return 12;
            } else {
                return 14;
            }
        })
        .text(function (d) { return d.text; });

    sort_buttons.on('click', function (d) {
        d3.select('.active-sort')
            .classed('active-sort', false)
        d3.select(this)
            .classed('active-sort', true)
        sort_by = d.value;
        update_charts();
    });

    // isolate row on row click
    d3.selectAll('.isolate-row')
        .on('click', function (d) {
            isolate_row(d.brand.split(' ')[0] + ' ' + d.name.split(' ')[0]);
        });

    function isolate_row (brand) {

        if (d3.selectAll('.row-inactive')[0].length > 1 && d3.select('.g-' + brand.split(' ')[0] + '-' + brand.split(' ')[1]).classed('highlight-row')) {

            d3.selectAll('.row-inactive')
                .classed('row-inactive', false);
            d3.selectAll('.highlight-row')
                .classed('highlight-row', false);

            d3.selectAll('.highlight-text')
                .remove();

        } else {

            d3.selectAll('.highlight-row')
                .classed('highlight-row', false);
            d3.selectAll('.highlight-text')
                .remove();

            chart_types.forEach(function (chart) {
                d3.selectAll('.' + chart)
                    .classed('row-inactive', true);

                d3.selectAll('.' + chart + '.g-' + brand.split(' ')[0] + '-' + brand.split(' ')[1])
                    .classed('row-inactive', false);
                d3.selectAll('.' + chart + '.g-' + brand.split(' ')[0] + '-' + brand.split(' ')[1])
                    .classed('highlight-row', true);

                d3.select('.g-' + chart + 'group.' + brand.split(' ')[0] + '-' + brand.split(' ')[1])
                    .append('text', '.' + chart + '.g-' + brand.split(' ')[0] + '-' + brand.split(' ')[1])
                    .attr('transform', function (d) {
                        if (chart === 'bar') {
                            return 'translate(' + (xscale[chart](d.num_reviews) + 5)
                                + ',' + (yscale[chart].rangeBand()/2 + 5) + ')';
                        } else {
                            return 'translate(' + (xscale[chart](d.bayesian_est) + 10)
                                + ',' + (yscale[chart].rangeBand()/2 + 5) + ')';
                        }                     
                    })
                    .attr('class', 'highlight-text')
                    .text(function (d) {
                        if (chart === 'bar') {
                            return d.num_reviews
                        } else {
                            return d.bayesian_est.toFixed(2)
                        }
                    });

            })
        }
    }


    function update_charts () {

        d3.selectAll('.highlight-text')
            .remove();

        var duration = 750;

        // sort data descending
        data.sort(function (a, b) {
            return a[sort_by] - b[sort_by];
        });

        // get list of all sources
        brands = data.map(function (d) {
            return d.brand + ' ' + d.name.split(' ')[0]; });

        chart_types.forEach(function (chart) {

            // update yscale and recall y axes
            yscale[chart].domain(brands);

            d3.select('.y.axis.axis-' + chart)
                .transition()
                .duration(duration)
                .call(yaxes[chart]);

            // update chart data
            var group = d3.selectAll('.g-' + chart + 'group')
                .data(data)
                .attr('class', function (d) {
                    return 'g-' + chart + 'group ' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                })
                .attr("transform", function (d) {
                    return "translate(0," + yscale[chart](d.brand + ' ' + d.name.split(' ')[0]) + ")";
                });

            group.select('.isolate-row')
                .attr('class', function (d) {
                        return 'isolate-row row-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                });
            

            // reset width of bars and position of circles w/ new data
            if (chart === 'bar') {
                group.select('.bar')
                    .transition()
                    .duration(duration)
                    .attr('width', function (d) {
                        return xscale.bar(d.num_reviews);
                    })
                    .attr('class', function (d) {
                        return 'bar g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                    });

            } else {
                group.select('.dot.rating')
                    .transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + xscale.dot(d.rating) + "," 
                            + yscale.dot.rangeBand()/2 + ")";
                    })
                    .attr('class', function (d) {
                        return 'dot rating g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                    });

                group.select('.dot.bayes')
                    .transition()
                    .duration(duration)
                    .attr("transform", function (d) {
                        return "translate(" + xscale.dot(d.bayesian_est) + "," 
                            + yscale.dot.rangeBand()/2 + ")";
                    })
                    .attr('class', function (d) {
                        return 'dot bayes g-' + d.brand.split(' ')[0] + '-' + d.name.split(' ')[0];
                    });
            }
            
        });

    }

    d3.select(window).on('resize', resized);

    function resized () {
        width['main'] = d3.select('#sephora-container').node().clientWidth
        
        if (width['main'] > 900) {
            margin['bar'] = {top: 120, right: 40, bottom: 20, left: 230};
            margin['dot'] = {top: 120, right: 40, bottom: 20, left: 10};

            d3.select('.chart-title-dot').text('Sephora Rating v Bayesian Estimate')

            d3.selectAll('.legend-text')
                .text(function (d) { 
                    return d;
                });

            d3.selectAll('.sort-button-text')
                .attr('y', 14);

        } else if (width['main'] < 400) {
            margin['bar'] = {top: 120, right: 15, bottom: 20, left: 150};
            margin['dot'] = {top: 120, right: 15, bottom: 20, left: 150};

            yaxes.bar.ticks(4);

            d3.selectAll('.sort-button-text')
                .attr('y', 12);

            d3.select('.chart-title-dot').text('Sephora Rating v')
                .attr('y', -60)
                .append('tspan')
                .attr('y', -35)
                .attr('x', 0)
                .text('Bayesian Estimate')

            d3.selectAll('.legend-text')
                .text(function (d) { 
                    return d.split(' ')[0];
                });

        } else if (width['main'] < 700) {
            d3.select('.chart-title-dot').text('Sephora Rating v')
                .attr('y', -60)
                .append('tspan')
                .attr('y', -35)
                .attr('x', 0)
                .text('Bayesian Estimate');

            d3.selectAll('.sort-button-text')
                .attr('y', 14);

        } else {
            margin['bar'] = {top: 120, right: 40, bottom: 20, left: 230};
            margin['dot'] = {top: 120, right: 40, bottom: 20, left: 230};

            d3.selectAll('.sort-button-text')
                .attr('y', 14);
        }

        chart_types.forEach(function (chart) {
            var chart_group = d3.select('#chart-' + chart),
                w = chart_group.node().clientWidth - margin[chart].left - margin[chart].right,
                h = 600 - margin[chart].top - margin[chart].bottom;
            
            width[chart] = w;

            chart_group.select('svg')
                .attr('width', width[chart] + margin[chart].left + margin[chart].right);

            xscale[chart]
                .range([0, width[chart]]);

            yscale[chart]
                .rangeBands([h, 0], 0.3);

            xaxes[chart]
                .tickSize(-h);

            yaxes[chart]
                .tickSize(-width[chart]);

            d3.select('.x.axis-' + chart)
                .call(xaxes[chart]);

            d3.select('.y.axis-' + chart)
                .call(yaxes[chart]);

            var group = d3.selectAll('.g-' + chart + 'group');

            d3.select('.g-' + chart)
                .attr('transform', 'translate(' + margin[chart].left + ',' + margin[chart].top + ')')

            if (chart === 'bar') {
                group.select('.bar')
                    .attr('width', function (d) {
                        return xscale.bar(d.num_reviews);
                    });

                group.select('.highlight-text')
                    .attr('transform', function (d) {
                        return 'translate(' + (xscale[chart](d.num_reviews) + 5)
                            + ',' + (yscale[chart].rangeBand()/2 + 5) + ')';
                    });

            } else {
                group.select('.dot.rating')
                    .attr("transform", function (d) {
                        return "translate(" + xscale.dot(d.rating) + "," 
                            + yscale.dot.rangeBand()/2 + ")";
                    });

                group.select('.dot.bayes')
                    .attr("transform", function (d) {
                        return "translate(" + xscale.dot(d.bayesian_est) + "," 
                            + yscale.dot.rangeBand()/2 + ")";
                    });

                group.select('.highlight-text')
                    .attr('transform', function (d) {
                        return 'translate(' + (xscale[chart](d.bayesian_est) + 10)
                            + ',' + (yscale[chart].rangeBand()/2 + 5) + ')';
                    });
            }

        });
    }

    // add legend to dot chart
    var dot_legend = d3.select('.g-dot');

    var legendgroup = dot_legend.selectAll('.g-legend')
        .data(['Sephora Rating', 'Bayesian Estimate'])
      .enter().append('g')
        .attr('transform', function (d, i) { 
            return 'translate(20,' + (18 + i * 18) + ')'
        });

    legendgroup.append('circle')
        .attr('r', 5)
        .style('fill', function (d) {
            return d === 'Sephora Rating' ? 'rgba(105, 105, 105, 0.75)' : 'rgba(245, 54, 108, 0.75)';
        });

    legendgroup.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .attr('class', 'legend-text')
        .text(function (d) { 
            if (width['main'] > 400) {
                return d; 
            } else {
                return d.split(' ')[0];
            }
        });

}

// load the data
d3.csv('sephora-table.csv', make_table);

function make_table (error, data) {
    if (error) throw "error loading data";

    data.forEach(function (d) {
        d.bayesian_est = +d.bayesian_est;
        d.rating = +d.rating;
    })
    
    var table = d3.select('#sephora-table')
        .append('table');

    var table_cells = ['brand', 'name', 'num_reviews', 'rating', 'bayesian_est'];

    table.selectAll('header-cells')
        .data(['rank', 'brand', 'product', 'number of reviews', 'sephora rating', 'bayesian estimate'])
      .enter().append('th')
        .attr('class', function (d) {
            if (d === 'product') {
                return 'header-cells product-cell';
            } else {
                return 'header-cells';
            }
        })
        .text(function (d) {
            return d;
        });

    var table_rows = table.selectAll('.table-rows')
        .data(data)
      .enter().append('tr')
        .attr('class', 'table-rows');

    table_rows.append('td')
        .attr('class', 'table-cells product-rank')
        .text(function (d, i) {
            return i + 1;
        })

    table_cells.forEach(function (cell) {
        table_rows.append('td')
            .attr('class', function (d) {
                if (cell === 'name') {
                    return 'table-cells product-cell'
                } else {
                    return 'table-cells'
                }
            })
            .text(function (d) {
                if (cell === 'rating' || cell === 'bayesian_est') {
                    return d[cell].toFixed(2);
                }
                return d[cell];
            });
    })

    table_rows.style('background', function (d, i) {
        if (i % 2 === 0) {
            return '#efefef';
        }
    })

}


