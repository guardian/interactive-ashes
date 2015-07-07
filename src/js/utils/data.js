function updatePeriods(periods,tournament_data) {
	var prev={
		EN:0,
		AU:0
	}
	periods.forEach(function(period){
		
		period.tours=tournament_data.filter(function(d){
			var year=d.values.date.getFullYear();
			return year>=period.years[0] && year<=period.years[1];
		})
		
		var i=0;
		period.tours.forEach(function(d,i){
			d.show = i++;
		})

		period.victories={
			EN:period.tours[period.tours.length-1].values.EN,
			AU:period.tours[period.tours.length-1].values.AU
		}
		period.diff={
			EN:period.victories.EN-prev.EN,
			AU:period.victories.AU-prev.AU
		}

		//console.log("prev",prev.EN,prev.AU)
		//console.log("current",period.victories.EN,period.victories.AU)


		prev.EN=period.tours[period.tours.length-1].values.EN;
		prev.AU=period.tours[period.tours.length-1].values.AU;



	})
	//console.log(periods)
	
	periods.reverse();

	return periods;
}

function updateMatches(matches_data,series_data,innings,aggregates) {

	matches_data.forEach(function(match){
		var tour=series_data.find(function(tour){
			//console.log(tour.date,match.date)
			if(tour.nextdate) {
				return (+match.date >= +tour.date) && (+match.date < +tour.nextdate);	
			}
			return (+match.date >= +tour.date);
			
		});
		if(tour) {
			tour.matches.push(match);
		}
	});

	innings.forEach(function(inn){
		var match=matches_data.find(function(match){
			return +match.date == +inn.date;
		});

		if(match) {
			match.innings.push(inn);
			match.overs+=Math.floor(inn.Overs);
			match.runs[inn.Team]+=inn.runs;
		}

	});

	aggregates.forEach(function(agg){
		var match=matches_data.find(function(match){
			return +match.date == +agg.date;
		});

		if(match) {
			match.rpo=agg.rpo;
		}

	});

	return matches_data;
}

function updateBowlers(bowlers_data,series_data,aggregates) {

	aggregates.forEach(function(agg){
		//var match=
		bowlers_data
			.filter(function(match){
				return +match.date == +agg.date;
			}).forEach(function(match){
				match.rpo=agg.rpo;
				match.Year=agg.Year;
				match.aindex=agg.index;
				match.Winner=agg.Winner;
				match.series_winner=agg.series_winner;
			})
		/*
		if(match) {
			match.rpo=agg.rpo;
			match.Year=agg.Year;

			//console.log(match.date,match.Year)
		}
		*/

	});

	return bowlers_data;
}
function updateBatsmen(batsmen_data,series_data,aggregates,matches) {

	console.log("updateBatsmen",matches)

	aggregates.forEach(function(agg){
		
		batsmen_data.filter(function(match){
			return +match.date == +agg.date;
		}).forEach(function(match){
			match.rpo=agg.rpo;
			match.Year=agg.Year;
			match.aindex=agg.index;
			match.Winner=agg.Winner;
			match.series_winner=agg.series_winner;
		})

	});

	return batsmen_data;
}
function updatePlayers(players,batsmen_data,bowlers_data) {

	var batsmen=d3.nest()
		.key(function(d){
			return d.Player;
		})
		.rollup(function(leaves)
			{
				return {
					ashes:d3.set(leaves.filter(function(d){return d.rpo;}).map(function(d){return d.Year;})).values(),
					dates:d3.extent(leaves.filter(function(d){return d.rpo;}),function(d){
						return d.date;
					})
				}
			}
		)
		.entries(batsmen_data)

	batsmen.forEach(function(bm){
		players.batsmen.filter(function(d){
			return d.id == bm.key;
		}).forEach(function(d){
			d.ashes=bm.values.ashes;
			d.dates=bm.values.dates;	
		})
		

	})
	
	console.log("BATSMEN",batsmen)

	var bowlers=d3.nest()
		.key(function(d){
			return d.Player;
		})
		.rollup(function(leaves)
			{
				return {
					ashes:d3.set(leaves.filter(function(d){return d.rpo;}).map(function(d){return d.Year;})).values(),
					dates:d3.extent(leaves.filter(function(d){return d.rpo;}),function(d){
						return d.date;
					})
				}
			}
		)
		.entries(bowlers_data)

	bowlers.forEach(function(bm){
		players.bowlers.filter(function(d){
			return d.id == bm.key;
		}).forEach(function(d){
			d.ashes=bm.values.ashes;
			d.dates=bm.values.dates;	
		})
		

	})
	
	console.log("BOWLERS",bowlers)

	return players;
}
function updateAggregates(aggregates,series, matches) {

	//console.log("AHHHH",series)

	series.forEach(function(s){
		aggregates.filter(function(a){
			return +a.date >= +s.date;
		}).forEach(function(a){
			a.Year=s.Year
			a.series_winner = s.Winner;
		})
	});

	aggregates.forEach(function(a){
		var match=matches.find(function(m){
			return +a.date == +m.date;
		})

		a.Winner = match.Winner;
	})

	return aggregates;

}

function updateTours(data) {
	var victories={
		AU:0,
		EN:0,
		drawn:0
	}

	data=data.sort(function(a,b){
		return +a.date - (+b.date);
	});
	//console.log(data);
	//return;
	var ashes=d3.nest()
				.key(function(d){
					return d.date;//Year;
				})
				.rollup(function(leaves){
					return {
						winner:leaves[0].Winner,
						location:leaves[0].Location,
						date:leaves[0].date,
						type:leaves[0].Type,
						notes:leaves.filter(function(d){
							return typeof d.notes != 'undefined'
						})[0]
					}
				})
				.entries(data);

	ashes.forEach(function(series){
		if(series.values.type=="ashes") {
			victories[series.values.winner]++;
		}
		
		series.values["EN"]=victories["EN"];
		series.values["AU"]=victories["AU"];	
		
	})
	/*var last=ashes[ashes.length-1].values;
	ashes.push({
		key:new Date()+"",
		values:{
			AU:last.AU,
			EN:last.EN,
			date:new Date(),
			location:"EN",
			type:"ashes",
			winner:"AU"
		}
	})*/

	//console.log(ashes,victories)

	return ashes;
}

module.exports = {
	updatePeriods:updatePeriods,
	updateMatches:updateMatches,
	updateTours:updateTours,
	updateBatsmen:updateBatsmen,
	updateBowlers:updateBowlers,
	updatePlayers:updatePlayers,
	updateAggregates:updateAggregates
}