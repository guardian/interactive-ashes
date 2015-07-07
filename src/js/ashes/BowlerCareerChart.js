var regression=require("../utils/regression");

function BowlerCareerChart(data,options) {

	//console.log("BowlerCareerChart",options)

	//console.log(numbers)
	
	/*data=data.sort(function(a,b){
		return +a.date - (+b.date);
	})*/
	data.forEach(function(d,i){
		d.index=i;
	});

	
	
	//console.log("REGRESSION",regression);


	var aggregates=options.aggregates.filter(function(agg){
		return data.some(function(match){
			return agg.key == match.Year;
		})
	});

	//console.log(options.info.name,"------>",aggregates)

	aggregates.forEach(function(agg){

		agg.values.forEach(function(match){
			//console.log("MATCH",match);

			match.mindex=null;

			var found=data.find(function(d){
				return (+d.date == +match.date);
			});
			
			if(found) {
				match.mindex=found.index;
			}
			/*
			if(!data.some(function(d){
				return +d.date == +match.date;
			})) {
				data.push(match)
			}
			*/	
		});

	})


	
	
	/*
	data.filter(function(d){
		if(options.only_ashes) {
			return !isNaN(+d.Overs) && d.rpo;
		}
		
		return !isNaN(+d.Overs) || d.rpo ;
	})*/

	var prev_runs=0,
		cumulative=0;
	var INDEX=options.only_ashes?"aindex":"index";
	data.forEach(function(d,i){
		//d.index=i;
		d.aindex = +d.aindex;
		//if(options.only_ashes) {
		//	d.index = +d.aindex;
		//}

		cumulative+=d.runs;
		d.cumulative=cumulative;

		d.prev_runs=prev_runs;
		prev_runs+=d.runs;

	});

	//console.log("BOWLER DATA",data)

	//console.log(aggregates)


	
	var years=d3.nest()
				.key(function(d){
					return d.Year || "any";
				})
				.key(function(d){
					return d.Year || d.date.getFullYear();
				})
				.rollup(function(leaves){
					return {
						runs:d3.sum(leaves,function(d){
							return d.runs;
						}),
						mean:d3.mean(leaves,function(d){
							return d.runs;
						}),
						econ:d3.mean(leaves,function(d){
							return d.econ;
						}),
						last:leaves[leaves.length-1],
						first:leaves[0],
						matches:leaves,
						prev_runs:leaves[0].prev_runs,
						last_runs:leaves[leaves.length-1].cumulative
					}
				})
				.entries(data);

	years.forEach(function(d){

		var values=d.values.map(function(year){
			return year.values.matches;
		})
		var flattened = values.reduce(function(a, b) {
		  return a.concat(b);
		}).filter(function(d){
			return +d.Overs > 0;
		});

		d.flattened=flattened;

	})


	//console.log("YEARS",years)
	
	function setExtents() {
		
		extents={
			date:[
				new Date(d3.min(years,function(year){
					return d3.min(year.values,function(d){
						return +d.key;
					})	
				}),0,1),
				new Date(d3.max(years,function(year){
					return d3.max(year.values,function(d){
						return +d.key;
					})	
				}),11,31)
			],
			econ:[
				0,
				d3.max(data,function(d){
					return d.econ;
				})
			],
			mean_econ:d3.mean(data,function(d){
				return d.econ;
			}),
			aindex2:d3.extent(data,function(d){
				return d.aindex;
			}),
			aindex:[
				d3.min(aggregates,function(agg){
					return d3.min(agg.values,function(match){
						return match.index;
					})
				}),
				d3.max(aggregates,function(agg){
					return d3.max(agg.values,function(match){
						return match.index;
					})
				})
			]
		};

		extents.date_gap=extents.date[1].getFullYear() - extents.date[0].getFullYear();
	};

	setExtents();

	//console.log("DATA",data);
	//console.log("OPTIONS.EXTENTS",options.extents);
	//console.log("EXTENTS",extents);
	
	//console.log("CONTAINER",options.container)

	var container=d3.select(options.container);

	var row=container.append("div")
					.attr("id",options.name)
    				.attr("class","career-row")
    				.on("click",function(d){
    					var selected=d3.select(this).classed("selected");

    					d3.select(this).classed("selected",!selected);
    				})

    var info=row.append("div")
    				.attr("class","info")
    				.on("click",function(){
    					return;
    					update({
    						only_ashes:!options.only_ashes
    					})
    				})

    info.append("h1")
    		.text(options.info.name+" ("+options.teams[options.info.country]+")")
    		//.text(options.info.name+" ("+extents.date.map(function(d){return d.getFullYear();}).join(",")+")")

	var viz=row.append("div")
					.attr("class","career-chart "+options.info.country);

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

   	//console.log(WIDTH,HEIGHT)

    var margins={
    	left:10,
    	right:10,
    	top:5,
    	bottom:20
    };

    var tooltip=new Tooltip({
    	container:viz.node(),
    	margins:margins,
    	info:options.info,
    	teams:options.teams
    });

    viz.append("div")
		.attr("class","match-legend");

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%"),
		defs=svg.append("defs"),
		career_g=svg.append("g")
					.attr("class","career")
					.attr("transform","translate("+(margins.left)+","+margins.top+")"),
		axes=svg.append("g")
					.attr("class","axes")
					.attr("transform","translate("+(margins.left)+","+margins.top+")"),
		ux=svg.append("g")
					.attr("class","ux")
					.attr("transform","translate("+0+","+0+")");
	ux.append("rect")
			.attr("x",0)
			.attr("y",0)
			.attr("width",WIDTH)
			.attr("height",HEIGHT)
			.on("mousemove",function(d){
				var coord=d3.mouse(this);
				//console.log(xscale.invert(coord[0]))
				//return;
				//console.log(coord[0],xscale.invert(coord[0]));

				var match=findBar(xscale.invert(coord[0]-margins.left))
				if(match) {
					//console.log(match)
					tooltip.show(match,xscale(match[INDEX]),yscale.range()[0]);
					highlightMatch(match);
				}
				

			})
			.on("mouseout",function(d){
				//console.log("out")
				highlightMatch();
				tooltip.hide();
			})

	function findBar(x) {
		
		var i=0,
			bar=data.find(function(d){
				return !isNaN(d[INDEX]) && d[INDEX]>x;
			});

		
		return bar;
	}

	/*var patterns=["AU-AU","AU-EN","EN-AU","EN-EN","EN-drawn","AU-drawn"];

	var pattern=defs.selectAll("pattern")
					.data(patterns)
					.enter()
						.append("pattern")
							.attr("id",function(d){
								return "diagonalHatch"+d;
							})
							.attr("class","diagonal")
							.attr({
									width:4,
									height:4,
									patternTransform:"rotate(45 0 0)",
									patternUnits:"userSpaceOnUse"	
								})

	pattern
		.append("rect")
		.attr("class",function(d){
			return "winner "+d.split("-")[1]
		})
		.attr({
			x:0,
			y:0,
			width:3,
			height:4
		})
		
	*/

	var gap=options.extents.y_gap - extents.date_gap,
		upper_year=new Date((extents.date[1].getFullYear() + (gap>0?gap:0)),11,31);
	//console.log("GAP",extents.date[1].getFullYear(),gap,upper_year)
	var xscale=d3.scale.linear().domain([extents.date[0],upper_year]).range([0,WIDTH-(margins.left+margins.right)]),
		yscale=d3.scale.linear().domain(options.only_ashes?[0,options.extents.econ[1]]:extents.econ).range([HEIGHT-(margins.top+margins.bottom),0]);
		//index_scale=d3.scale.linear().domain(extentss).range([HEIGHT-(margins.top+margins.bottom),0]);
	
	xscale.domain(options.extents.date);

	if(options.indexed) {
		xscale.domain([0,options.extents.n_matches[1]+5]);
	}
	if(options.only_ashes) {
		xscale.domain(options.extents.aindex);
	}

	var xscale_all=xscale.copy();

	xscale_all.domain([0,options.extents.n_matches[1]+5]);


	var regression_line=career_g.append("path")
		.attr("class","regression")
		.classed("hidden",options.only_ashes);

	var period=career_g.selectAll("g.period")
			.data(years)
			.enter()
			.append("g")
				.attr("class","period")
				.classed("any",function(d){
					return d.key == "any";
				})
				.attr("rel",function(d){
					return d.key;
				})

	var period_agg=career_g.selectAll("g.period-agg")
			.data(aggregates)
			.enter()
			.append("g")
				.attr("class","period-agg")
				.attr("rel",function(d){
					return d.key;
				})

	career_g.append("line")
			.attr("class","baseline main")
			.attr("x1",xscale.range()[0]-margins.left)
			.attr("y1",yscale.range()[0])
			.attr("x2",xscale.range()[1]+margins.right)
			.attr("y2",yscale.range()[0])

	
	var result = regression('polynomial', data.map(function(d){
		return [d.index,d.econ]
	}),2);
	//console.log(result)
	


	var line = d3.svg.line()
				    .x(function(d) { 
				    	//console.log(d)
				    	return xscale(options.indexed?d.index:d.date); 
				    })
				    .y(function(d) { 
				    	//console.log(d.runs,yscale(d.runs))
				    	return yscale(d.value); 
				    })
				    //.interpolate("basis");

	

	if(!options.only_ashes) {

		regression_line.attr("d",line(result.points.map(function(d){
					return {
						index:d[0],
						value:d[1]
					}
				})))
	}
	
	var area = d3.svg.area()
					    .x(function(d) { return xscale(options.indexed?d.index:d.date); })
					    .y0(yscale.range()[0])
					    .y1(function(d) { 
					    	//console.log(d.runs,yscale(d.runs))
					    	return yscale(d.value); 
					    })
					    //.interpolate("step-before");

	var matches=period
			.filter(function(d){
				return 1;
				if(options.only_ashes) {
					return d.key != "any";
				}
				return 1;
			})
			.append("g")
			.attr("class","matches")

	var match=matches.selectAll("g.match")
			.data(function(d){
				return d.flattened;
			})
			.enter()
			.append("g")
				.attr("class","match")
				.attr("rel",function(d){
					return d.date
				});
	match
		.filter(function(d){
			return !isNaN(d[INDEX])
		})
		.attr("transform",function(d){
			var x=xscale(options.indexed?d[INDEX]:d.date),
				y=0;
			return "translate("+x+","+y+")";
		});

	match
		.append("circle")
			.attr("class",function(d){
				return "marker "+options.info.country;
			})
			.attr("cx",0)
			.attr("cy",function(d){
				return yscale(d.econ);
			})
			.attr("r",3)

	function highlightMatch(__match) {
		match
			.classed("highlight",false);

		if(__match) {
			match
				.filter(function(d){
					return d[INDEX] == __match[INDEX];
				})
				.classed("highlight",true)
		}
	}
	
	// economy played matches
	//area
	if(options.type=="area") {
		period
				.filter(function(d){
					return d.key != "any";
				})
				.append("path")
					.attr("class","years econ area "+options.info.country)
					.attr("d", function(d){
						//console.log("@@@@@@@@@@@@@@@",d)
						/*
						var values=d.values.map(function(year){
							return year.values.matches;
						})
						var flattened = values.reduce(function(a, b) {
						  return a.concat(b);
						}).filter(function(d){
							return +d.Overs > 0;
						});
						*/
						//console.log("MATCHES",d,flattened);

						return area(d.flattened.map(function(d){
							return {
								date:d.date,
								index:d[INDEX],
								value:d.econ
							}
						}));
					})
					//.style("fill",function(d){
						
					//	return "url(#diagonalHatch"+options.info.country+"-"+d.values[0].values.first.Winner+")"
					//})
	}
	period_agg
		.append("text")
			.attr("class","labels")
			.attr("x",function(d){
				return d3.mean(d.values.filter(function(m){
						return m[options.only_ashes?"index":"mindex"]
					}),function(m){
						return xscale(m[options.only_ashes?"index":"mindex"]);
					});
			})
			.attr("y",function(d){
				return yscale.range()[0] + 12;
			})
			.text(function(d){
				//console.log(d)
				return d.key;
			})
	//avgs
	d3.range(3).forEach(function(avg_y){
		period
			.filter(function(d){
				return d.key != "any";
			})
			.append("line")
				.attr("class","average")
				.attr("x1",function(d){
					var matches=d.values[0].values.matches.filter(function(m){
						return m.Overs>-1;
					});
					var x= matches[0][options.indexed?INDEX:"date"];
					return xscale(x);
				})
				.attr("y1",yscale(avg_y+1))
				.attr("x2",function(d){
					var matches=d.values[0].values.matches.filter(function(m){
						return m.Overs>-1;
					});
					
					var x= matches[matches.length-1][options.indexed?INDEX:"date"];
					return xscale(x)
				})
				.attr("y2",yscale(avg_y+1))	
	})

	//line
	if(options.type=="area" || options.type=="line") {
		period
				.filter(function(d){
					return d.key != "any";
				})
				.append("path")
					.attr("class","years line econ "+options.info.country)
					.attr("d", function(d){
						/*
						var values=d.values.map(function(year){
							return year.values.matches;
						})
						var flattened = values.reduce(function(a, b) {
						  return a.concat(b);
						}).filter(function(d){
							return +d.Overs > 0;
						});
						*/
						//console.log("MATCHES",d,flattened);

						return line(d.flattened.map(function(d){
							return {
								date:d.date,
								index:d[INDEX],
								value:d.econ
							}
						}));
					})
	}


	//if(options.only_ashes) {
		//average line
	period_agg
		.append("path")
			.attr("class","years rpo")
			.attr("d", function(d){
				//console.log(d)
				

				var values=d.values.filter(function(d){
								return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
							}).map(function(d){
								//console.log(d.index,d.mindex,options.only_ashes?"d.index":"d.mindex")
								return {
									date:d.date,
									index:options.only_ashes?d.index:d.mindex,
									value:d.rpo
								}
							});
				//console.log("RPO",JSON.stringify(values));
				return 	line(values);
			});
	
	period_agg
		.append("line")
			.attr("class",function(d){
				//console.log("AREA",d)
				return "baseline "+d.values[0].series_winner
			})
			.attr("x1",function(d){
				var values=d.values.filter(function(d){
								return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
							});		
				return xscale(values[0][options.only_ashes?"index":"mindex"])-5
			})
			.attr("y1",function(d){
				return yscale.range()[0];
			})
			.attr("x2",function(d){
				var values=d.values.filter(function(d){
								return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
							});		
				return xscale(values[values.length-1][options.only_ashes?"index":"mindex"])+5
			})
			.attr("y2",function(d){
				return yscale.range()[0];
			});

	//dots for not-ashes matches
	period
			.filter(function(d){
				return d.key == "any";
			})
			.classed("hidden",function(d){
					return options.only_ashes;
			})
			.selectAll("circle")
			.data(function(d){
				/*
				var values=d.values.map(function(year){
					return year.values.matches;
				})
				var flattened = values.reduce(function(a, b) {
				  return a.concat(b);
				}).filter(function(d){
						return +d.Overs > 0;
					});
				s*/
				//console.log("MATCHES",d,flattened);

				return d.flattened;
			})
			.enter()
			.append("circle")
				.attr("class",options.info.country)
				.attr("cx",function(d){
					return xscale_all(options.indexed?d.index:d.date);
				})
				.attr("cy",function(d){
					return yscale(d.econ); 
				})
				.attr("r",1.5)

	if(options.type=="area" || options.type=="line") {
		//dots for tour with one match only
		var singles=period
				.filter(function(d){
					return d.key != "any";
				})
				.selectAll("g.singles")
				.data(function(d){
					return d.flattened.length>1?[]:d.flattened;
				})
				.enter()
				.append("g")
					.attr("class","singles")
				

						
		singles.append("circle")
					.attr("class","ashes "+options.info.country)
					.attr("cx",function(d){
						return xscale(options.indexed?d[INDEX]:d.date);
					})
					.attr("cy",function(d){
						return yscale(d.econ); 
					})
					.attr("r",2.5)
		singles.append("line")
					.attr("class","ashes "+options.info.country)
					.attr("x1",function(d){
						return xscale(options.indexed?d[INDEX]:d.date);
					})
					.attr("x2",function(d){
						return xscale(options.indexed?d[INDEX]:d.date);
					})
					.attr("y1",function(d){
						return yscale(d.econ); 
					})
					.attr("y2",function(d){
						return yscale.range()[0]; 
					})
	}

	if(options.type=="bars") {
	
		var match=matches.selectAll("g.match")
				.data(function(d){
					/*
					var values=d.values.map(function(year){
						return year.values.matches;
					})
					var flattened = values.reduce(function(a, b) {
					  return a.concat(b);
					});
					*/
					//console.log("MATCHES",d,flattened);
					return d.flattened;
				})
				.enter()
				.append("g")
					.attr("class",function(d){
						return "match "+d.Winner;
					})
					.attr("rel",function(d){
						return d.date
					})
					.attr("transform",function(d){
						var x=xscale(d.date),
							y=0;
						if(options.indexed) {
							x=xscale(d[INDEX])
						}
						return "translate("+x+","+y+")";
					})

		/*match.append("line")
				.attr("x1",0)
				.attr("y1",function(d){
					return yscale(d.econ);
				})
				.attr("x2",0)
				.attr("y2",function(d){
					return yscale.range()[0]
				})*/
		var w=3;//(xscale.range()[1]/(options.extents.n_matches[1]-1))-1;
		match.append("rect")
				.attr("class",function(d){
					return d.Winner;
				})
				.attr("x",-w/2)
				.attr("y",function(d){
					return yscale(d.econ);
				})
				.attr("width",w)
				.attr("height",function(d){
					return yscale.range()[0]-yscale(d.econ);
				})
	}
	//var lineChart=new LineChart();
	

	/*
	function tickFormat(d){
		//console.log("tickFormat",d)
    	return d3.time.format("%Y")(new Date(d));
    }

	var xAxis = d3.svg.axis()
				    .scale(xscale)
				    .orient("bottom")
				    .tickValues(function(){
				    	var start=new Date(xscale.domain()[0]).getFullYear(),
				    		end=new Date(xscale.domain()[1]).getFullYear(),
				    		years=(end-start)/10+1;
				    	var values=d3.range(years).map(function(d){
				    		//console.log("pppp",d,start-start%10,end-end%10)
				    		return +(new Date(start-start%10 + d*10,0,1));
				    	});

				    	//console.log("---->",values)

				    	return values;
				    }())
				    .tickFormat(tickFormat)
				    

	var axis=axes.append("g")
			      .attr("class", "x axis")
			      .attr("transform", "translate("+0+"," + yscale.range()[0] + ")")
			      .call(xAxis);
	*/
	
	//update();
	this.update=update;
	this.switchStatus=function(){
		update({
			only_ashes:!options.only_ashes,
			duration:1000
		})
	}
	
	function update(__options) {


		var DURATION=(__options && __options.duration?__options.duration:0);

		if(__options && (typeof __options.only_ashes != 'undefined')) {
			options.only_ashes=	__options.only_ashes;
		}
		INDEX=options.only_ashes?"aindex":"index";

		var size=viz.node().getBoundingClientRect(),
    		WIDTH = size.width;

    	console.log("bowler new width",WIDTH)

    	xscale.range([0,WIDTH-(margins.left+margins.right)]);
    	xscale_all.range([0,WIDTH-(margins.left+margins.right)]);

		yscale.domain(options.only_ashes?[0,options.extents.econ[1]]:extents.econ);
		
		xscale.domain(options.extents.date);
		if(options.indexed) {
			xscale.domain([0,options.extents.n_matches[1]+5]);
		}
		if(options.only_ashes) {
			xscale.domain(options.extents.aindex);
		}

		ux.select("rect")
			.attr("x",0)
			.attr("y",0)
			.attr("width",WIDTH);

		match
			.filter(function(d){
				return !isNaN(d[INDEX])
			})
			.attr("transform",function(d){
				var x=xscale(options.indexed?d[INDEX]:d.date),
					y=0;
				return "translate("+x+","+y+")";
			});
		

		career_g.select("line.baseline.main")
			.attr("x1",xscale.range()[0]-margins.left)
			.attr("y1",yscale.range()[0])
			.attr("x2",xscale.range()[1]+margins.right)
			.attr("y2",yscale.range()[0])

    	if(options.type=="area") {
			period
					.filter(function(d){
						return d.key != "any";
					})
					.transition()
						.duration(DURATION)
					.select("path.econ.area")
						.attr("d", function(d){
							/*
							var values=d.values.map(function(year){
								return year.values.matches;
							})
							var flattened = values.reduce(function(a, b) {
							  return a.concat(b);
							}).filter(function(d){
								return +d.Overs > 0;
							});
							*/
							//console.log("MATCHES",d,flattened);

							return area(d.flattened.map(function(d){
								return {
									date:d.date,
									index:d[INDEX],
									value:d.econ
								}
							}));
						})
		}

		//line
		if(options.type=="area" || options.type=="line") {
			period
					.filter(function(d){
						return d.key != "any";
					})
					.transition()
					.duration(DURATION)
					.select("path.econ.line")
						.attr("d", function(d){
							/*
							var values=d.values.map(function(year){
								return year.values.matches;
							})
							var flattened = values.reduce(function(a, b) {
							  return a.concat(b);
							}).filter(function(d){
								return +d.Overs > 0;
							});
							*/
							//console.log("MATCHES",d,flattened);

							return line(d.flattened.map(function(d){
								return {
									date:d.date,
									index:d[INDEX],
									value:d.econ
								}
							}));
						})
		}
		/*
		var aggregates=options.aggregates.filter(function(agg){
			return data.some(function(match){
				return agg.key == match.Year;
			})
		});

		//console.log(options.info.name,"------>",aggregates)
		*/
		aggregates.forEach(function(agg){

			agg.values.forEach(function(match){
				//console.log("MATCH",match);

				match.mindex=null;

				var found=data.find(function(d){
					return (+d.date == +match.date);
				});
				
				if(found) {
					match.mindex=found.index;
				}
				/*
				if(!data.some(function(d){
					return +d.date == +match.date;
				})) {
					data.push(match)
				}
				*/
			});

		})
		
		
		regression_line
			.classed("hidden",options.only_ashes)

		if(!options.only_ashes) {
			regression_line.attr("d",line(result.points.map(function(d){
						return {
							index:d[0],
							value:d[1]
						}
					})))	
		}
		

		period_agg.data(aggregates);
		period_agg
					.select("path.rpo")
						.classed("hidden",!options.only_ashes)
						.transition()
						.duration(DURATION)
						.attr("d", function(d){
							var values=d.values.filter(function(d){
											return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
										}).map(function(d){
											//console.log(d.index,d.mindex,options.only_ashes?"d.index":"d.mindex")
											return {
												date:d.date,
												index:options.only_ashes?d.index:d.mindex,
												value:d.rpo
											}
										});
							//console.log("RPO",JSON.stringify(values));
							return 	line(values);
						})
		period_agg
			.select("text.labels")
				.transition()
				.duration(DURATION)
				.attr("x",function(d){
					var first=d.values[0],
						last=d.values[d.values.length-1];

					return d3.mean(d.values.filter(function(m){
						return m[options.only_ashes?"index":"mindex"]
					}),function(m){
						return xscale(m[options.only_ashes?"index":"mindex"]);
					});
				})

		period_agg
			.select("line.baseline")
				.attr("x1",function(d){
					var values=d.values.filter(function(d){
									return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
								});		
					return xscale(values[0][options.only_ashes?"index":"mindex"])-5
				})
				.attr("x2",function(d){
					var values=d.values.filter(function(d){
									return options.only_ashes?d.index:d.mindex && !isNaN(options.only_ashes?d.index:d.mindex)
								});		
					return xscale(values[values.length-1][options.only_ashes?"index":"mindex"])+5
				});
		//}
		
		period
				.filter(function(d){
					return d.key != "any";
				})
				.selectAll("line.average")
					.attr("x1",function(d){
						var matches=d.values[0].values.matches.filter(function(m){
							return m.Overs>-1;
						});
						var x= matches[0][options.indexed?INDEX:"date"];
						return xscale(x);
					})
					.attr("x2",function(d){
						var matches=d.values[0].values.matches.filter(function(m){
							return m.Overs>-1;
						});
						
						var x= matches[matches.length-1][options.indexed?INDEX:"date"];
						return xscale(x)
					})


		//dots for not-ashes matches
		period
				.filter(function(d){
					return d.key == "any";
				})
				.classed("hidden",function(d){
					return options.only_ashes;
				})
				.selectAll("circle")
					.attr("cx",function(d){
						return xscale_all(options.indexed?d.index:d.date);
					})
					.attr("cy",function(d){
						return yscale(d.econ); 
					})
					

		//if(options.type=="area" || options.type=="line") {
			//dots for tour with one match only

			//console.log(singles,singles.node())	
			singles.selectAll("circle")
					.transition()
					.duration(DURATION)
					.attr("cx",function(d){
						//console.log("circle",INDEX, d[INDEX], d)
						return xscale(options.indexed?d[INDEX]:d.date);
					})
					.attr("cy",function(d){
						return yscale(d.econ); 
					})
					
			singles.selectAll("line")
					.transition()
						.duration(DURATION)
						.attr("x1",function(d){
							return xscale(options.indexed?d[INDEX]:d.date);
						})
						.attr("x2",function(d){
							return xscale(options.indexed?d[INDEX]:d.date);
						})
						.attr("y1",function(d){
							return yscale(d.econ); 
						})
						.attr("y2",function(d){
							return yscale.range()[0]; 
						})
							
			
		//}


	}

	/*
		  __________  ____  __  ______________ 
		 /_  __/ __ \/ __ \/ / /_  __/  _/ __ \
		  / / / / / / / / / /   / /  / // /_/ /
		 / / / /_/ / /_/ / /___/ / _/ // ____/ 
		/_/  \____/\____/_____/_/ /___/_/      
		                                       
	*/



	function Tooltip(options) {

		var w=options.width || 200,
			h=options.height || 110;

		////console.log("!!!!!!!!!!!",options)

		var tooltip=d3.select(options.container)
						.append("div")
							.attr("class","tooltip");

		var title=tooltip.append("h1"),
			econ=tooltip.append("span").attr("class","runs"),
			bf=tooltip.append("span").attr("class","date"),
			rpo=tooltip.append("span").attr("class","date"),
			wk=tooltip.append("span").attr("class","date"),
			s6=tooltip.append("span").attr("class","date");

		this.hide=function() {
			tooltip.classed("visible",false);
		}
		this.show=function(match,x,y) {

			//console.log(x,y,match)



			//title.text(match.runs+" runs "+match.Opposition);
			title.html(options.teams[options.info.country]+" - "+match.Opposition+"<span>"+(match.Ground+", "+match.StartDate)+"</span>");
			
			econ.text("Economy rate: "+match.econ);
			rpo.text("Match RPO: "+match.rpo).style("display","block")
			if(!match.rpo) {
				rpo.style("display","none")
			}
			wk.text("Wickets: "+match.Wkts)
			
			

			tooltip.style({
				left:(x+20+options.margins.left)+"px",
				bottom:(options.margins.bottom)+"px"
			})
			.classed("visible",true)
			
			//ground.text(match.Ground);
			//runs.text(match.runs+" runs");
		}

	}

}

module.exports = BowlerCareerChart;