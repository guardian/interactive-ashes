var CareerChart=require('./BowlerCareerChart')

function Bowlers(data,options) {

	console.log("Bowlers",data,options);


	//console.log("MATCHES DATA",options.matches)

	data=data.filter(function(d){
		return 1;
		return d.Player == 'bresnan'
		return d.Player != 'bradman' && d.Player != 'hobbs';
	})

	var charts=[];

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
			runs:d3.extent(data,function(d){
				return d.runs;
			}),
			econ:d3.extent(data,function(d){
				return d.econ;
			}),
			mean_econ:3.23,// <= last series 13/14 econ 2.388918919,
			mean_econ2:d3.mean(data,function(d){
				return d.econ;
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
		//console.log("PLAYERS",players)
		extents.y_gap=d3.max(players,function(d){
			return d.values.y_gap;
		});
		extents.n_matches=[0,d3.max(players,function(d){
			return d.values.n_matches;
		})];

	};

	setExtents();

	players
		.filter(function(d){

			return 1;
			return d.key=="warne";
			return d.key=="warne" || d.key=="anderson";
			return d.key=="anderson" || d.key=="mcgrath";
			return d.key=="botham";
			return d.key !='bradman' && d.key != 'hobbs';
			return d.key == "waugh"// || d.key == "hobbs"
		})
		.filter(function(d){
			var player=options.players.find(function(player){
				//console.log(player.id,d.key)
				return player.id==d.key;
			});
			//console.log("FOUND",player)
			return +player.dates[1] >= + options.from
		})
		.sort(function(a,b) {
			return +a.values.min_date - +b.values.min_date;
		})
		.forEach(function(player){

			//console.log("PLAYER",player.key,player)

			charts.push(
				new CareerChart(data.filter(function(d){
					return d.Player == player.key
				}).sort(function(a,b){
						return +a.date - (+b.date);
					}),{
						container:options.container,
						name:player.key,
						extents:extents,
						indexed:true,
						only_ashes:true,
						info: options.players.find(function(d){
							return d.id==player.key;
						}),
						type:"area", // line,area,bars
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
		}

		d3.select("#theBestBowlers")
			.select("h2")
			.on("click",function(){
				charts.forEach(function(chart){
					chart.switchStatus();
				})
			})
}

module.exports=Bowlers;