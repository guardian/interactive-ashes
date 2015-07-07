function BatsmanCareerChart(data,options) {

	console.log("BatsmanCareerChart",options)
	
	/*data=data.sort(function(a,b){
		return +a.date - (+b.date);
	})*/

	data.forEach(function(d,i){
		d.index=i;
	})

	var aggregates=options.aggregates.filter(function(agg){
		return data.some(function(match){
			////console.log(agg.key,"==",match.Year)
			return agg.key == match.Year;
		})
	})

	aggregates.forEach(function(agg){
		agg.values.forEach(function(match){
			//console.log(match);
			if(!data.some(function(d){
				return +d.date == +match.date
			})) {
				//match.Overs=-1;
				match.aindex = match.index;
				data.push(match)
			}	
		})
	})



	var prev_runs=0,
		cumulative=0;

	var INDEX=options.only_ashes?"aindex":"index";

	data.forEach(function(d,i){
		//d.index=i;
		d.aindex = +d.aindex;
		
		/*if(options.only_ashes) {
			//console.log("AINDEX",d.aindex)
			d.index = +d.aindex;
		}
		*/
		cumulative+=d.runs;
		d.cumulative=cumulative;

		d.prev_runs=prev_runs;
		prev_runs+=d.runs;
	});

	console.log(data)



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
		});

		var flattened = values.reduce(function(a, b) {
		  return a.concat(b);
		}).filter(function(d){
			return d.runs > 0;
		});

		d.flattened=flattened;

	})
						

	console.log("YEARS",years)

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
			cumulative:[
				0,
				d3.max(data,function(d){
					return d.cumulative
				})
			],
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

    info.append("h1")
    		//.text(options.info.name+" ("+extents.date.map(function(d){return d.getFullYear();}).join(",")+")")
    		.text(options.info.name+" ("+options.teams[options.info.country]+")")

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
    })

    viz.append("div")
		.attr("class","match-legend");

	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%")
				
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

				//console.log(coord[0],xscale.invert(coord[0]));

				var match=findBar(xscale.invert(coord[0]-margins.left))
				if(match) {
					tooltip.show(match,xscale(match[INDEX]),yscale.range()[0]);
					highlightMatch(match);
				}
				

			})
			.on("mouseout",function(d){
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

	var gap=options.extents.y_gap - extents.date_gap,
		upper_year=new Date((extents.date[1].getFullYear() + (gap>0?gap:0)),11,31);

	var xscale=d3.scale.linear().domain([extents.date[0],upper_year]).rangeRound([0,WIDTH-(margins.left+margins.right)]),
		yscale=d3.scale.linear().domain(options.extents.runs).range([HEIGHT-(margins.top+margins.bottom),0]).nice();
		//index_scale=d3.scale.linear().domain(extentss).range([HEIGHT-(margins.top+margins.bottom),0]);
	
	xscale.domain(options.extents.date);

	if(options.indexed) {
		xscale.domain([0,options.extents.n_matches[1]+5]);
	}
	if(options.only_ashes) {
		xscale.domain(options.extents.aindex);
		yscale.domain(options.extents.aruns);
	}

	//console.log("X DOMAIN",xscale.domain())

	

	career_g.append("line")
			.attr("class","baseline main")
			.attr("x1",xscale.range()[0]-margins.left)
			.attr("y1",yscale.range()[0])
			.attr("x2",xscale.range()[1]+margins.right)
			.attr("y2",yscale.range()[0]);

	console.log("#############",years)

	var period=career_g.selectAll("g.period")
			.data(years)
			.enter()
			.append("g")
				.attr("class","period")
				.classed("any",function(d){
					return d.key=="any"
				})
				.attr("rel",function(d){
					return d.key;
				})

	career_g.selectAll("line.century")
			.data([100,200,300,400])
			.enter()
			.append("line")
				.attr("class","century")
				.attr("x1",xscale.range()[0])
				.attr("y1",yscale)
				.attr("x2",xscale.range()[1])
				.attr("y2",yscale)




	var line = d3.svg.line()
				    .x(function(d) { 
				    	return xscale(options.indexed?d.index:d.date); 
				    })
				    .y(function(d) {
				    	////console.log(d.runs,yscale(d.runs))
				    	return yscale(d.value);
				    })
				    //.interpolate("basis");

	var area = d3.svg.area()
					    .x(function(d) { 
					    	return xscale(options.indexed?d.index:d.date); 
					    })
					    .y0(yscale.range()[0])
					    .y1(function(d) {
					    	////console.log(d.runs,yscale(d.runs))
					    	return yscale(d.value);
					    })
					    //.interpolate("step-before");

	if(options.type=="area" || options.type=="line") {
		period
				.filter(function(d){
					return d.key !== "any";
				})
				.append("path")
					.attr("class",function(d){
						//console.log("AREA",d)
						return "years runs "+d.values[0].values.first.series_winner
					})
					.attr("d", function(d){
						/*
						var values=d.values.map(function(year){
							return year.values.matches;
						})
						var flattened = values.reduce(function(a, b) {
						  return a.concat(b);
						}).filter(function(d){
							return d.runs > 0;
						});
						*/
						////console.log("MATCHES",INDEX,d,flattened);

						return area(d.flattened.map(function(d){
							return {
								date:d.date,
								index:d[INDEX],
								value:d.runs
							}
						}));
					})
	}

	var matches=period
			.filter(function(d){
				return 1;
				if(options.only_ashes) {
					return d.key !== "any";
				}
				return 1;
			})
			.append("g")
			.attr("class","matches")

	period
				.filter(function(d){
					return d.key !== "any";
				})
				.append("line")
					.attr("class",function(d){
						//console.log("AREA",d)
						return "baseline "+d.values[0].values.first.series_winner
					})
					.attr("x1",function(d){						
						if(d.flattened.length) {
							return xscale(d.flattened[0][INDEX])-5;
						}
						return 0;
					})
					.attr("y1",function(d){
						return yscale.range()[0];
					})
					.attr("x2",function(d){
						if(d.flattened.length) {
							return xscale(d.flattened[d.flattened.length-1][INDEX])+5;
						}
						return 0;
					})
					.attr("y2",function(d){
						return yscale.range()[0];
					});

	period
		.filter(function(d){
			return d.key !== "any" && d.flattened.length;
		})
		.append("text")
			.attr("class","labels")
			.attr("x",function(d){
				

				return d3.mean(d.flattened.filter(function(m){
						return m[INDEX];
					}),function(m){
						return xscale(m[INDEX]);
					});
			})
			.attr("y",function(d){
				return yscale.range()[0] + 12;
			})
			.text(function(d){
				////console.log(d)
				return d.key.replace("/"," - ");
			});

	

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
		})
		/*
		.on("mouseover",function(d){
			//console.log(d);
			//var h=(cumulativeYScale(d.prev_runs) - cumulativeYScale(d.cumulative));
			var x=xscale(options.indexed?d[INDEX]:d.date),
				y=isNaN(d[INDEX])?yscale.range()[0]:yscale(d.runs);
			y=yscale.range()[0]+25;
			tooltip.show(d,x,y);
		})
		.on("mouseout",function(d){
			console.log("out")
			tooltip.hide();
		});
		*/	
	

	var w=2;
	match
		.filter(function(d){
			return d.runs && d.runs>0;
		})
		.append("rect")
			.attr("class",function(d){
				return options.info.country;
			})
			.attr("x",-w/2)
			.attr("y",function(d){
				if(isNaN(d[INDEX])) {
					return yscale.range()[0];
				}
				return yscale(d.runs);
			})
			.attr("width",w)
			.attr("height",function(d){
				if(isNaN(d[INDEX])) {
					return 0;
				}
				return yscale.range()[0]-yscale(d.runs);
			})

	match
		.filter(function(d){
			return d.runs && d.runs>0;
		})
		.append("circle")
			.attr("class",function(d){
				return "marker "+options.info.country;
			})
			.attr("cx",0)
			.attr("cy",function(d){
				return yscale(d.runs);
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

	this.update=update;
	this.switchStatus=function(){
		update({
			only_ashes:!options.only_ashes,
			duration:1000
		});
	};

	
	function update(__options) {

		var DURATION=(__options && __options.duration?__options.duration:0);

		if(__options && (typeof __options.only_ashes != 'undefined')) {
			options.only_ashes=	__options.only_ashes;
		}
		INDEX=options.only_ashes?"aindex":"index";

		var size=viz.node().getBoundingClientRect(),
    		WIDTH = size.width;

    	////console.log("bowler new width",WIDTH)

    	xscale.range([0,WIDTH-(margins.left+margins.right)]);

		xscale.domain(options.extents.date);
		yscale.domain(options.extents.runs);

		if(options.indexed) {
			xscale.domain([0,options.extents.n_matches[1]+5]);
		}
		if(options.only_ashes) {
			xscale.domain(options.extents.aindex);
			yscale.domain(options.extents.aruns);
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

		////console.log("X DOMAIN",xscale.domain())
		////console.log("Y DOMAIN",yscale.domain())

    	career_g.select("line.baseline.main")
				.attr("x1",xscale.range()[0]-margins.left)
				.attr("y1",yscale.range()[0])
				.attr("x2",xscale.range()[1])
				.attr("x2",xscale.range()[1]+margins.right)

		career_g.selectAll("line.century")
				.attr("x1",xscale.range()[0])
				.attr("x2",xscale.range()[1])
				.transition()
				.duration(DURATION)
					.attr("y1",yscale)
					.attr("y2",yscale)

		


		if(options.type=="area" || options.type=="line") {
			period
					.filter(function(d){
						return d.key !== "any";
					})
					.select("path")
						.transition()
						.duration(DURATION)
						.attr("d", function(d){
							/*
							var values=d.values.map(function(year){
								return year.values.matches;
							})
							var flattened = values.reduce(function(a, b) {
							  return a.concat(b);
							}).filter(function(d){
								return d.runs > 0;
							});
							*/
							////console.log("MATCHES",INDEX,d,flattened);

							return area(d.flattened.map(function(d){
								return {
									date:d.date,
									index:d[INDEX],
									value:d.runs
								}
							}));
						})
		}

		period
			.filter(function(d){
				return d.key !== "any" && d.flattened.length;
			})
			.select("text.labels")
				.transition()
				.duration(DURATION)
				.attr("x",function(d){
					/*
					var values=d.values.map(function(year){
						return year.values.matches;
					})
					var flattened = values.reduce(function(a, b) {
					  return a.concat(b);
					}).filter(function(d){
						return d.runs > 0;
					});
					*/
					return d3.mean(d.flattened.filter(function(m){
							return m[INDEX]
						}),function(m){
							return xscale(m[INDEX]);
						});
				})
		period
				.filter(function(d){
					return d.key !== "any" && d.flattened.length;
				})
				.select("line.baseline")
					.transition()
					.duration(DURATION)
					.attr("x1",function(d){
						/*
						var values=d.values.map(function(year){
							return year.values.matches;
						})
						var flattened = values.reduce(function(a, b) {
						  return a.concat(b);
						}).filter(function(d){
							return d.runs > 0;
						});
						*/
						//console.log("MATCHES",INDEX,d,flattened);
						
						if(d.flattened.length) {
							return xscale(d.flattened[0][INDEX])-5;
						}
						return 0;
					})
					.attr("x2",function(d){
						/*
						var values=d.values.map(function(year){
							return year.values.matches;
						})
						var flattened = values.reduce(function(a, b) {
						  return a.concat(b);
						}).filter(function(d){
							return d.runs > 0;
						});
						*/
						////console.log("MATCHES",INDEX,d,flattened);

						
						if(d.flattened.length) {
							return xscale(d.flattened[d.flattened.length-1][INDEX])+5;
						}
						return 0;
					})

		matches.selectAll("g.match")
				.filter(function(d){
					return !d.Year && !isNaN(d[INDEX]);
				})
				.attr("transform",function(d){
					var x=xscale(options.indexed?d[INDEX]:d.date),
						y=0;
					return "translate("+x+","+y+")";
				})

		matches.selectAll("g.match")
				.filter(function(d){
					return !isNaN(d[INDEX])
				})
				.transition()
				.duration(DURATION)
				.attr("transform",function(d){
					var x=xscale(options.indexed?d[INDEX]:d.date),
						y=0;
					return "translate("+x+","+y+")";
				})
		

		match
			.filter(function(d){
				return d.runs && d.runs>0;
			})
			.select("rect")
				.transition()
				.duration(DURATION)
				.attr("y",function(d){
					if(isNaN(d[INDEX])) {
						return yscale.range()[0];
					}
					return yscale(d.runs);
				})
				.attr("height",function(d){
					if(isNaN(d[INDEX])) {
						return 0;
					}
					return yscale.range()[0]-yscale(d.runs);
				})





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
							.attr("class","tooltip")
							//.style({
								//width:w+"px",
							//	height:h+"px"
							//});

		var title=tooltip.append("h1"),
			runs=tooltip.append("span").attr("class","runs"),
			bf=tooltip.append("span").attr("class","date"),
			sr=tooltip.append("span").attr("class","date"),
			//s4=tooltip.append("span").attr("class","date"),
			s6=tooltip.append("span").attr("class","date");

		this.hide=function() {
			tooltip.classed("visible",false);
		}
		this.show=function(match,x,y) {

			//console.log(x,y,match)



			//title.text(match.runs+" runs "+match.Opposition);
			title.html(options.teams[options.info.country]+" - "+match.Opposition+"<span>"+(match.Ground+", "+match.StartDate)+"</span>");
			
			runs.text("Runs scored: "+match.runs);
			bf.text("Ball faced: "+match.BF)
			sr.text("Batting Strike Rate: "+match.SR).style("display","block")
			if(!(+match.SR)) {
				sr.style("display","none")
			}
			
			s6.text("Boundary 4s: "+match["4s"]+" - 6s:"+match["6s"])
			//s4.text("Boundary 4s: "+match["4s"])

			tooltip.style({
				left:(x+20+options.margins.left)+"px",
				//bottom:(y+options.margins.top)+"px"
				bottom:(options.margins.bottom)+"px"
			})
			.classed("visible",true)
			
			//ground.text(match.Ground);
			//runs.text(match.runs+" runs");
		}

	}

}

module.exports = BatsmanCareerChart;
