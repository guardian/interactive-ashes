var CareerChart=require('./BatsmanCareerChart')

function Batsmen(data,options) {

	//console.log("Batsmen",data)
	data=data.filter(function(d){
		//return d.Player=="broad";
		return 1;
		return d.Player != 'bradman' && d.Player != 'hobbs';
	})


	var years=d3.nest()
		.key(function(d){
			return d.date.getFullYear();
		})
		.rollup(function(leaves){
			return {
				runs:d3.sum(leaves,function(d){
					return d.runs;
				}),
				mean:d3.mean(leaves,function(d){
					return d.runs;
				})
			}
		})
		.entries(data);

	var extents;
	var players;
	function setExtents() {

		extents={
			x:[0,d3.max(years,function(d){
				return d.values.runs;
			})],
			mean_x:[0,d3.max(years,function(d){
				return d.values.mean;
			})],
			y:d3.extent(years,function(d){
				return +d.key;
			}),
			runs:d3.extent(data,function(d){
				return d.runs;
			}),
			aruns:d3.extent(data.filter(function(d){return d.rpo;}),function(d){
				return d.runs;
			}),
			date:d3.extent(data,function(d){
				return d.date;
			}),
			aindex:d3.extent(data,function(d){
				return d.aindex;
			})
		};

		players=d3.nest()
			.key(function(d){
				return d.Player;
			})
			.rollup(function(leaves){
				return {
					y:d3.extent(years,function(d){
						return +d.key;
					}),
					min_date: d3.min(leaves,function(d){
						return +d.date;
					}),
					y_gap:(function(){
						var year_ext=d3.extent(leaves,function(d){
							return +d.date.getFullYear();
						});
						return year_ext[1]-year_ext[0]
					}()),
					n_matches:leaves.length
				}
			})
			.entries(data);

		extents.y_gap=d3.max(players,function(d){
			return d.values.y_gap;
		});
		extents.n_matches=[0,d3.max(players,function(d){
			return d.values.n_matches;
		})];
	};

	setExtents();
	var charts=[];
	players
		.filter(function(d){
			return 1;
			return d.key == "cook"
			return d.key=="sachin";
			return d.key !='bradman' && d.key != 'hobbs';
			return d.key == "waugh"// || d.key == "hobbs"
		})
		.filter(function(d){
			var player=options.players.find(function(player){
				//console.log(player.id,d.key)
				return player.id==d.key;
			});
			//console.log("FOUND",player)
			return +player.dates[1] >= + options.from && +player.dates[0] <= + options.to
		})
		.sort(function(a,b) {
			return +a.values.min_date - +b.values.min_date;
		})
		.forEach(function(player){

			//console.log("PLAYER",player.key,player)

			charts.push(
				new CareerChart(data.filter(function(d){
					return d.Player == player.key
				}),{
						container:options.container,
						name:player.key,
						extents:extents,
						indexed:true,
						only_ashes:true,
						type:"area",
						info: options.players.find(function(d){
							return d.id==player.key;
						}),
						teams:options.teams,
						aggregates:d3.nest()
										.key(function(d){
											return d.Year;
										})
										.entries(options.aggregates)
					}
				)
			);
			
		});

		this.update=function() {
			charts.forEach(function(chart){
				chart.update();
			})
		};

		d3.select("#theBestBatsmen")
			.select("h2")
			.on("click",function(){
				charts.forEach(function(chart){
					chart.switchStatus();
				})
			})
	

}

module.exports=Batsmen;