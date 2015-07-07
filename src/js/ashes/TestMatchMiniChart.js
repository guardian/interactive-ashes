function TestMatchMiniChart(data,options) {

	//console.log("TestMatchMiniChart",data);

	this.update=function(){}

	data.innings=data.innings.filter(function(d){
		return d.Score!="DNB";
	})

	var startFrom={
		"EN":{
			overs:0,
			runs:0,
			prev:null,
			n_innings:0
		},
		"AU":{
			overs:0,
			runs:0,
			prev:null,
			n_innings:0
		},
		"ALL":{
			overs:0,
			runs:0,
			n_innings:0
		}
	}
	data.innings.forEach(function(d,i){
		d.starting_overs=startFrom["ALL"].overs;
		d.starting_runs=startFrom[d.Team].runs;
		d.prev=startFrom[d.Team].prev;

		startFrom[d.Team].n_innings++;
		startFrom["ALL"].n_innings++;

		startFrom[d.Team].overs+=Math.floor(d.Overs);
		startFrom["ALL"].overs+=Math.floor(d.Overs);
		startFrom[d.Team].runs+=d.runs;
		startFrom[d.Team].prev=d;
	});

	var extents={
		overs:[0,data.extents.overs],
		total_runs:[0,data.extents.runs],
		match_overs:[0,d3.sum(data.innings,function(d){
			return Math.floor(d.Overs);
		})],
		match_total_runs:[0,d3.max(d3.nest()
						.key(function(d){
							return d.Team;
						})
						.rollup(function(leaves){
							return d3.sum(leaves,function(d){
								return d.runs;
							});
						})
						.entries(data.innings),function(d){
							return d.values;
						})]
	}

	////console.log(extents)

	var container=d3.select(options.container)
						.attr("class",function(d){
							////console.log(".....",d)
							return "match "+d.Winner+" "+(options.area?"area":"line");
						})

	if(data.Result=="aban") {

		container.classed("abandoned",true)
					.append("b")
					.text("Match Abandoned");


		var title=container.append("div")
				.attr("class","match-title");


		title.append("span")
			.text(data.Ground+", "+data.StartDate)

		return;
	}

	var size=options.container.getBoundingClientRect(),
    	WIDTH = size.width,
    	HEIGHT = size.height;

    WIDTH= +d3.select(options.container).style("width").replace("px","");
    HEIGHT=70;
    //console.log(options.container,WIDTH,HEIGHT)

    var margins={
    	left:10,
    	right:25,
    	top:20,
    	bottom:0
    }

    var xscale=d3.scale.linear().domain(extents.overs).range([0,WIDTH-(margins.left+margins.right)]);
	var yscale=d3.scale.linear().domain(extents.total_runs).range([HEIGHT-(margins.bottom+margins.top),0]);


	var svg=container.append("svg")
				.attr("height",HEIGHT)

				

	var title=container.append("div")
				.attr("class","match-title");

	function getWinner(match) {
		if(!options.teams[data.Winner]) {
			return "Match drawn";
		}
		var str=options.teams[data.Winner]+" won ";

		if(data.Margin) {
			return str+"by "+data.Margin;
		}

		return str;
	}

	title.append("span")
		.text(data.Ground+", "+data.StartDate)
	title.append("p")
		.text(getWinner(data))
	
	svg.append("text")
		.attr("class",function(d){
			return "result "+d.Winner;
		})
		.attr("x",WIDTH-1)
		.attr("y",HEIGHT-1)
		.text(function(d){
			return d.Winner;
		})

	var innings_g=svg.append("g")
					.attr("class","innings")
					.attr("transform","translate("+margins.left+","+margins.top+")");

	var innings=innings_g.selectAll("g.inn")
			.data(data.innings)
			.enter()
			.append("g")
				.attr("class",function(d){
					return "inn "+d.Team;
				});

	var area = d3.svg.area()
				    .x(function(d) { return xscale(d.x); })
				    .y0(HEIGHT)
				    .y1(function(d) { return yscale(d.y); });

	if(options.area) {
		innings.append("path")
			.attr("class",function(d){
				return "inn-bg "+d.Team;
			})
			.attr("d",function(d){
				var points=[];
				
				points.push({
					x: d.starting_overs,
					y: d.starting_runs
				});
				points.push({
					x: d.starting_overs+d.Overs,
					y: d.starting_runs+d.runs
				});
				
				return area(points);
			})
			
		/*var innings_bg=innings_g.selectAll("path.inn-bg")
							.data(
								function(d){
									var runs=d3.nest()
												.key(function(d){
													return d.Team;
												})
												.entries(data.innings);

												return runs.sort(function(a,b){
													////console.log("--->",a.key,a.values[0].Result);
													return (a.values[0].Result=="won"?-1:1)
												});	
								}
								
							)
							.enter()
							.append("path")
								.attr("class",function(d){
									return "inn-bg "+d.key;
								})
								.attr("d",function(d){
									//console.log("innings",d.key,d);
									var points=[];
									d.values.forEach(function(inn){
										points.push({
											x: inn.starting_overs,
											y: inn.starting_runs
										});
										points.push({
											x: inn.starting_overs+inn.Overs,
											y: inn.starting_runs+inn.runs
										});
									})
									////console.log(points)
									return area(points);
								})*/
	}

	innings.append("line")
			.attr("class","inn")
			.attr("x1",function(d){
				return xscale(d.starting_overs);
			})
			.attr("y1",function(d){
				return yscale(d.starting_runs);
			})
			.attr("x2",function(d){
				return xscale(d.starting_overs+d.Overs);
			})
			.attr("y2",function(d){
				return yscale(d.starting_runs+d.runs);
			})
	//if(!options.area) {
		innings
			.filter(function(d){
				return d.prev;
			})
			.append("line")
				.attr("class","connecting")
				.attr("x1",function(d){
					return xscale(d.prev.Overs+d.prev.starting_overs);
				})
				.attr("y1",function(d){
					return yscale(d.starting_runs);
				})
				.attr("x2",function(d){
					return xscale(d.starting_overs);
				})
				.attr("y2",function(d){
					return yscale(d.starting_runs);
				})
	//}
	
	



	innings
		.append("circle")
			.attr("cx",function(d){
				return xscale(d.starting_overs+d.Overs);
			})
			.attr("cy",function(d){
				return yscale(d.starting_runs+d.runs);
			})
			.attr("r",function(d){
				////console.log("startFrom",d.Team,startFrom[d.Team].n_innings)
				if(startFrom[d.Team].n_innings===1 && d.Result=="won") {
					return options.area?3:2.5;
				}
				if(startFrom[d.Team].n_innings===1 && d.Result!="won") {
					return options.area?2:1;
				}

				if(!d.prev) {
					return 0;
				}
				if(d.Result=="won") {
					return options.area?3:2.5;
				}
				return options.area?2:1;
			})
	innings
		.append("text")
			.classed("start",function(d,i){
				return i===innings.data().length-1;
			})
			.classed("winner",function(d){
					if(startFrom[d.Team].n_innings===1 && d.Result=="won") {
						return true;
					}
					if(startFrom[d.Team].n_innings===1 && d.Result!="won") {
						return false;
					}

					if(d.Result=="won") {
						return true;
					}
					return false;
			})
			.attr("x",function(d){
				return xscale(d.starting_overs+d.Overs);
			})
			.attr("y",function(d){
				return yscale(d.starting_runs+d.runs)-5;
			})
			.attr("dx",function(d,i){
				if(i===innings.data().length-1) {
					return 5;
				}
				return -5;
			})
			.attr("dy","0.3em")
			.text(function(d){

				if(startFrom[d.Team].n_innings===1 && d.Result=="won") {
					return d.starting_runs+d.runs;
				}
				if(startFrom[d.Team].n_innings===1 && d.Result!="won") {
					return d.starting_runs+d.runs;
				}

				if(!d.prev) {
					return "";
				}

				return d.starting_runs+d.runs;
			})

	this.update=function(){
		updateChart();
	};

	function updateChart() {

		//console.log("updateChart",options)

		var size=options.container.getBoundingClientRect(),
	    	WIDTH = size.width;

	    WIDTH= +d3.select(options.container).style("width").replace("px","");
	    xscale.range([0,WIDTH-(margins.left+margins.right)]);

	    if(options.area) {
			innings.selectAll("path.inn-bg")
				.attr("d",function(d){
					var points=[];
					
					points.push({
						x: d.starting_overs,
						y: d.starting_runs
					});
					points.push({
						x: d.starting_overs+d.Overs,
						y: d.starting_runs+d.runs
					});
					
					return area(points);
				})
		}

		innings.selectAll("line.inn")
				.attr("x1",function(d){
					return xscale(d.starting_overs);
				})
				.attr("x2",function(d){
					return xscale(d.starting_overs+d.Overs);
				})

		//if(!options.area) {
			innings
				.filter(function(d){
					return d.prev;
				})
				.selectAll("line.connecting")
					.attr("x1",function(d){
						return xscale(d.prev.Overs+d.prev.starting_overs);
					})
					.attr("y1",function(d){
						return yscale(d.starting_runs);
					})
					.attr("x2",function(d){
						return xscale(d.starting_overs);
					})
					.attr("y2",function(d){
						return yscale(d.starting_runs);
					})
		//}
		
		
		innings
				.selectAll("circle")
					.attr("cx",function(d){
						return xscale(d.starting_overs+d.Overs);
					})
					
		innings
			.selectAll("text")
				.attr("x",function(d){
					//console.log("AAHHHHHH",d)
					return xscale(d.starting_overs+d.Overs);
				})
		
		svg.select("text.result")
				.attr("x",WIDTH-2);
				

	}
}

module.exports=TestMatchMiniChart;