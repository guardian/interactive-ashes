function LineChart(data,options) {
	//console.log("LineChart",data,options.series)
	var container=d3.select(options.container);

	var viz=container.append("div")
							.attr("class","timeline-chart");

	var size=viz.node().getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = 200;//size.height;

   	//console.log(WIDTH,HEIGHT)

    var margins={
    	left:20,
    	right:100,
    	top:40,
    	bottom:25
    };

    var tooltip=new Tooltip({
    	container:viz.node(),
    	margins:margins,
    	info:options.info,
    	teams:options.teams
    })

    var extents;

    function setExtents() {
		
		extents={
			index:[0,data.length-1
			],
			date:d3.extent(data,function(d){
				return d.values.date;
			}),
			victories:[
				0,
				d3.max(data,function(d){
					return Math.max(d.values.AU,d.values.EN);
				})
			]
		};

	};

	setExtents();
	//console.log(extents)

	var periods=getPeriods(data);

	//console.log(periods)



	var svg=viz.append("svg")
				.attr("width","100%")
				.attr("height","100%");
	addPattern(svg);

	var timeline_g=svg.append("g")
					.attr("class","lines")
					.attr("transform","translate("+(margins.left)+","+margins.top+")"),
		axes=svg.append("g")
					.attr("class","axes")
					.attr("transform","translate("+(margins.left)+","+margins.top+")");

	

	var xscale=d3.scale.linear().domain(extents.date).range([0,WIDTH-(margins.left+margins.right)]),
		yscale=d3.scale.linear().domain(extents.victories).range([HEIGHT-(margins.top+margins.bottom),0]);

	var line = d3.svg.line()
				    .x(function(d) { return xscale(d.date); })
				    .y(function(d) { 
				    	////console.log(d.date,d.victories)
				    	return yscale(d.victories); 
				    })
				    //.interpolate("basis")
				    .interpolate("step-after");

	
	var notes=timeline_g
			.append("g")
				.attr("class","notes")
			.selectAll("g.note")
				.data(data.filter(function(d){
					return typeof d.values.notes != "undefined";
				}))
				.enter()
				.append("g")
					.attr("class","note")
					.attr("transform",function(d){
						var x=Math.round(xscale(d.values.date)),
							y=yscale(Math.max(d.values.EN,d.values.AU))
						return "translate("+x+","+(y-40)+")";
					});
	/*
	notes.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",0)
			.attr("y2",25);
	notes.append("circle")
		.attr("cx",0.5)
		.attr("cy",0)
		.attr("r",2.5)*/
	var teams=timeline_g.selectAll("g.team")
			.data(["EN","AU"])
			.enter()
			.append("g")
				.attr("class",function(d){
					return "team "+d;
				})
	var period=teams.selectAll("g.period")
			.data(function(d){
				return periods.map(function(p){
					return {
						team:d,
						period:p.values
					}
				})
			})
			.enter()
			.append("g")
				.attr("class","period");
	
	period.append("path")
			.attr("d",function(p){
				//console.log(p);
				
				return line(p.period.map(function(d){
					return {
						date:d.values.date,
						victories:d.values[p.team]
					}
				}))
			});

	svg.on("mousemove",function(d){
				var x=d3.mouse(this)[0];

				x=Math.min(WIDTH-margins.right,x);
				var series=findBar(Math.round(xscale.invert(x-margins.left)))
				
				if(series) {
					
					var status=data.find(function(d){
						return +d.values.date == +series.date;
					});

					tooltip.show(series,xscale(series.date),0,status);//yscale.range()[0]);
					highlightSeries(series.date);
				}
				

			})
			.on("mouseleave",function(d){
				highlightSeries();
				tooltip.hide();
			})

	function findBar(x) {
		//console.log(x,new Date(x))
		var i=0,
			bar=options.series.find(function(d){
				return d.date>=x;
			});

		
		return bar;
	}
	
	var series=period.filter(function(d,i){
		//console.log(1)
		return i%2;
	}).selectAll("g.series")
		.data(options.series)
		.enter()
			.append("g")
			.attr("class","series")
			.attr("transform",function(d){
				//console.log(d)
				return "translate("+xscale(d.date)+",0)";
			})
			.on("mouseenter",function(d){
				tooltip.show(d,xscale(d.key),100);
			})
			.append("line")
				.attr("x1",0)
				.attr("y1",function(s){
					var status=data.find(function(d){
						return +d.values.date == +s.date;
					});
					return yscale(Math.max(status.values["EN"],status.values["AU"]))+1;
				})
				.attr("x2",0)
				.attr("y2",function(s){
					return yscale.range()[0]+4;
					/*var status=data.find(function(d){
						return +d.values.date == +s.date;
					});
					return yscale(status.values["AU"])*/
				})
	function highlightSeries(date) {
		if(!date) {
			series.classed("highlight",false);
		}
		series.classed("highlight",function(d){
			return +d.date == +date;
		});
	}

	teams.append("text")
			.attr("class","status")
			.attr("x",function(d){
				return xscale(data[data.length-1].values.date)
			})
			.attr("y",function(team){
				return yscale(data[data.length-1].values[team])
			})
			.attr("dy",function(team){
				return team=="EN"?15:-5;
			})
			.text(function(team){
				return data[data.length-1].values[team]+" "+options.teams[team]
			})

	function tickFormat(d){
		////console.log("tickFormat",d)
    	return d3.time.format("%Y")(new Date(d));
    }

	var xAxis = d3.svg.axis()
				    .scale(xscale)
				    .orient("bottom")
					.tickValues(function(){

						var d1=data[0].values.date,
							d2=data[data.length-1].values.date,
							dates=[+d1,+d2];

						var years=d3.range((d2.getFullYear() - d1.getFullYear())/20-1).map(function(y){
							return (1882 - 1882%20)+(y+1)*20;
						})

						years.forEach(function(y){
							dates.push(new Date(y,0,1));
						})

						return dates;

					}())
				    .tickFormat(tickFormat)
				    

	var axis=axes.append("g")
			      .attr("class", "x axis")
			      .attr("transform", "translate("+0+"," + (yscale.range()[0]+3) + ")")
			      .call(xAxis);

	axis.append("rect")
			.attr("class","ww ww1")
			.attr("x",xscale(periods[0].values[periods[0].values.length-1].values.date))
			.attr("width",function(){
				var x1=xscale(periods[0].values[periods[0].values.length-1].values.date),
					x2=xscale(periods[1].values[0].values.date);
				return x2-x1;
			})
			.attr("y",-yscale.range()[0])
			.attr("height",yscale.range()[0])
			.style({
				fill:"url(#diagonalHatch)"
			})

	axis.append("text")
			.attr("class","ww ww1")
			.attr("x",xscale(periods[0].values[periods[0].values.length-1].values.date))
			.attr("y",0)
			.attr("dx",2)
			.attr("dy",-2)
			.text("WW1")

	axis.append("rect")
			.attr("class","ww ww2")
			.attr("x",xscale(periods[1].values[periods[1].values.length-1].values.date))
			.attr("width",function(){
				var x1=xscale(periods[1].values[periods[1].values.length-1].values.date),
					x2=xscale(periods[2].values[0].values.date);
				return x2-x1;
			})
			.attr("y",-yscale.range()[0])
			.attr("height",yscale.range()[0])
			.style({
				fill:"url(#diagonalHatch)"
			})

	axis.append("text")
			.attr("class","ww ww2")
			.attr("x",xscale(periods[1].values[periods[1].values.length-1].values.date))
			.attr("y",0)
			.attr("dx",2)
			.attr("dy",-2)
			.text("WW2")

	this.update=update;

	function update() {
		var size=viz.node().getBoundingClientRect(),
    		WIDTH = size.width;

    	xscale.range([0,WIDTH-(margins.left+margins.right)]);

    	notes.attr("transform",function(d){
						var x=Math.round(xscale(d.values.date)),
							y=yscale(Math.max(d.values.EN,d.values.AU))
						return "translate("+x+","+(y-40)+")";
				});

    	period.select("path")
				.attr("d",function(p){
					//console.log(p);
					
					return line(p.period.map(function(d){
						return {
							date:d.values.date,
							victories:d.values[p.team]
						}
					}))
				});

		teams.select("text.status")
				.attr("x",function(d){
					return xscale(data[data.length-1].values.date)
				})
				.attr("y",function(team){
					return yscale(data[data.length-1].values[team])
				});

		axis.call(xAxis);

		axis.select("rect.ww1")
				.attr("x",xscale(periods[0].values[periods[0].values.length-1].values.date))
				.attr("width",function(){
					var x1=xscale(periods[0].values[periods[0].values.length-1].values.date),
						x2=xscale(periods[1].values[0].values.date);
					return x2-x1;
				})

		axis.select("text.ww1")
				.attr("x",xscale(periods[0].values[periods[0].values.length-1].values.date));

		axis.select("rect.ww2")
				.attr("x",xscale(periods[1].values[periods[1].values.length-1].values.date))
				.attr("width",function(){
					var x1=xscale(periods[1].values[periods[1].values.length-1].values.date),
						x2=xscale(periods[2].values[0].values.date);
					return x2-x1;
				});
				

		axis.select("text.ww2")
				.attr("x",xscale(periods[1].values[periods[1].values.length-1].values.date));
				
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

		////////console.log("!!!!!!!!!!!",options)

		var tooltip=d3.select(options.container)
						.append("div")
							.attr("class","tooltip")

		var series_status=tooltip.append("p").attr("class","status"),
			date=tooltip.append("span").attr("class","date"),
			location=tooltip.append("span").attr("class","date"),
			result=tooltip.append("h1");

		this.hide=function() {
			tooltip.classed("visible",false);
		}
		this.show=function(series,x,y,status) {

			

			var d=series;
			
			var w=(series.Winner==series.Team)?series.Won:series.Lost,
				l=(series.Winner==series.Team)?series.Lost:series.Won,
				winner=series.Winner;

			if(winner=="drawn"){

			} else if(winner=="ongoing") {
				winner="in progress "+w+" - "+l;
			} else {				
				winner=options.teams[series.Winner]+" won "+w+" - "+l;
			}

			//console.log(status)

			if(status) {
				series_status.html("<b class=\"EN\">"+status.values["EN"]+"</b> - <b class=\"AU\">"+status.values["AU"]+"</b>")	
			} else {
				series_status.html("&nbsp;")
			}
			
			date.text(series.Year.replace("/"," - "))
			location.text("Tour of "+options.teams[d.tour[0]]+" in "+options.teams[d.tour[1]])
			result.text(winner);

			//console.log(x-10)

			if(x+160 > WIDTH - margins.right) {
				x-= 190;// + options.margins.right + 20*2);
			}

			tooltip.style({
				left:(x+10+options.margins.left)+"px",
				bottom:(options.margins.bottom)+"px"
			})
			.classed("visible",true)
			
		}

	}
}

function getPeriods(data) {

	var ww1StartDate=new Date(1915,0,1),
		ww1EndDate=new Date(1918,11,31),
		ww2StartDate=new Date(1942,0,1),
		ww2EndDate=new Date(1945,11,31);

	////console.log(data)

	var periods=d3.nest()
				.key(function(d){
					if(+d.values.date < +ww1StartDate) {
						return "beforeWW1";
					}
					if(+d.values.date > +ww2EndDate) {
						return "afterWW2";
					}
					if(+d.values.date >= +ww1EndDate && +d.values.date <= +ww2StartDate) {
						return "betweenWars";
					}
				})
				.entries(data);
	periods.forEach(function(p){
		p.values=p.values.sort(function(a,b){
			return +a.values.date - +b.values.date;
		})
	})
	return periods;
}
function addPattern(svg){
	var defs=svg.append("defs");

	var pattern=defs.append("pattern")
				.attr({
					id:"diagonalHatch",
					width:4,
					height:4,
					patternTransform:"rotate(45 0 0)",
					patternUnits:"userSpaceOnUse"
				});
	
	pattern
		.append("line")
		.attr({
			x0:0,
			y1:0,
			x2:0,
			y2:5
		})
		.style({
			stroke:"#000",
			"stroke-opacity":0.2,
			"stroke-width":1
		});
}

module.exports=LineChart;