var TestMatchMiniChart=require('./TestMatchMiniChart');
var detect = require('../utils/detect');

function Series(data,options) {

	var status=0,
		series_height=150 + 20,
		min_length=3;
	//console.log("Series",data);

	var position=d3.scale.ordinal().rangePoints([(data.length-1)*series_height,0]).domain(data.map(function(d){return d.date;}));

	var ul=d3.select(options.container)
					.append("ul")
						.attr("class","clearfix")
	

	var series=ul
		.selectAll("li")
			.data(data.sort(function(a,b){
				return +b.date - (+a.date);
			}).filter(function(d){
				return 1;
				return d.Year == "2013/14";
				return d.Year == "1938" || d.Year == "2013/14" || d.Year == "1882/83"
			}))
			.enter()
			.append("li")
				.attr("class",function(d){
					return "tour clearfix "+d.Winner;
				})
				.classed("hidden",function(d,i){
					return i>=min_length;
				})


	if(data.length>min_length) {
		d3.select(options.container).append("button")
					.attr("class","button button--primary")
					.text("Show more")
						.on("click",function(d){
							status=!status;
							//alert(((status?data.length-1:min_length)*series_height)+"px")
							//ul.style("height",((status?getHeight(data.length):getHeight(min_length)))+"px")
							
							
							series
								.classed("hidden",function(d,i){
									if(status) {
										return false;	
									}
									return i>=min_length;
								})

							d3.select(this).text(status?"Show less":"Show more");

							//update(series);
						});
	}
								

	var info=series.append("div")
				.attr("class","tour-info")
				
	info.html(function(d){
		


		var w=(d.Winner==d.Team)?d.Won:d.Lost,
			l=(d.Winner==d.Team)?d.Lost:d.Won,
			winner=d.Winner;

		if(winner=="drawn"){

		} else if(winner=="ongoing") {
			winner="in progress "+w+" - "+l;
		} else {
			winner=options.teams[d.Winner]+" won "+w+" - "+l;
		}

		var str="<span class=\"tour-year\">"+(d.Year.replace("/"," - "))+"</span><br/>";

		str+="Tour of "+options.teams[d.tour[0]]+" in "+options.teams[d.tour[1]];

		str+="<span class=\"tour-winner\">"+winner+"</span>";

		return str;

	})
	/*
	info.append("span")
		.attr("class","tour-year")
		.html(function(d){
			return "Tour of "+options.teams[d.tour[0]]+" in "+options.teams[d.tour[1]]+" <em>"+d.Year+"<em><br/>";
		});

	info.append("span")
		.attr("class","tour-winner")
		.html(function(d){
			
			if(d.Winner=="drawn") {
				return "Drawn"
			}

			var w=(d.Winner==d.Team)?d.Won:d.Lost,
				l=(d.Winner==d.Team)?d.Lost:d.Won;
			return "<em>"+options.teams[d.Winner]+"</em> wins "+w+" - "+l;
		})
	*/
	var miniCharts=[];
	var to;
	var series_preview=series
						.append("div")
						.attr("class","series-preview clearfix")
						.on("mouseenter",function(){
							d3.select(this).classed("hover",true)
						})
						.on("mouseleave",function(){
							d3.select(this).classed("hover",false)
						})
						.on("touchstart",function(){
							d3.select(options.container).selectAll(".hover").classed("hover",false)
							d3.select(this).classed("hover",true)
						})
						.on("touchend",function(){
							//var d3this=d3.select(this);
							//to=setTimeout(function(){
								//d3this.classed("hover",false)
							//},1000);
							
						})
	
	series_preview.append("div")
						.attr("class","match-legend");


	var matches_chart=series_preview.selectAll("div.match")
						.data(function(d){
							var extents={
								overs:d3.max(d.matches,function(m){
									return m.overs
								}),
								runs:d3.max(d.matches,function(m){
									return Math.max(m.runs["EN"],m.runs["AU"])
								})
							}
							return d.matches.map(function(m){
								m.year=d.Year;
								m.extents=extents;
								return m;
							}).filter(function(d,i){
								return 1;
								return !i;
							})
						})
						.enter()
							.append("div")
								.attr("class","match")
								.each(function(d){
									var __this=this;

									miniCharts.push(
										new TestMatchMiniChart(d,{
											container:__this,
											teams:{
												"EN":"England",
												"AU":"Australia"
											},
											area:options.area
										})
									);
								})


	/*var match_chart=series.append("div")
						.attr("class","match-analysis")
	var viz=match_chart.append("div")
							.attr("class","matchviz")*/

	
	function update() {
		miniCharts.forEach(function(m){
			////console.log(m)
			m.update();
		})
	}
	this.update=function() {
		update();
	}

}

module.exports=Series;