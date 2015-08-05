//http://visuals.guim.co.uk/testing/uk/example/

var detect = require('./js/utils/detect');
var dataUtils = require('./js/utils/data');
var queue=require("queue-async");
var d3=require('d3');
var base=require('./html/base.html');
var AshesHistory=require('./js/ashes/History');
var AshesSummary=require('./js/ashes/AshesSummary');
var Batsmen=require('./js/ashes/Batsmen');
var Bowlers=require('./js/ashes/Bowlers');
var LineChart=require('./js/ashes/LineChart');
var ShareButtons = require('./js/utils/social.js');
var periods = require('./data/periods.json');
//var ashes = require('./data/ashes.json');
var players = require('./data/players.json');

var date_format=d3.time.format("%d %b %Y");

// Useful detection tool. See js/utils/detect.js for more.
////console.log('Is IOS: ', detect.isIOS());
////console.log('Connection speed: ', detect.getConnectionSpeed());

////console.log(d3,queue.version);

var prev_date={
	batsmen:null,
	bowlers:null
};


queue()
    //.defer(d3.json,"/data/periods.json")
    //.defer(d3.json,"/data/ashes.json")
    .defer(d3.csv,"/data/ashes.csv",function(d){
    	
    	d.date=date_format.parse(d.StartDate);
		d.Type=d.Type || "ashes";

    	return d;
    })
    .defer(d3.csv,"/data/series.csv",function(d){
    	
    	d.date=date_format.parse(d.StartDate);
		d.tour=d.Tour.split(" in ");
		d.matches=[];

    	return d;
    })
    .defer(d3.csv,"/data/matches.csv",function(d){

    	d.date=date_format.parse(d.StartDate);
					
		d.Winner=(d.Result=="won"?"AU":"EN");
		d.Winner=((d.Result=="draw" || d.Result=="aban")?"drawn":d.Winner);


		d.overs=0;
		d.runs={
			"EN":0,
			"AU":0
		};

		d.innings=[];

    	return d;
    })
    .defer(d3.csv,"/data/aggregates.csv",function(d,i){

    	

    	d.date=date_format.parse(d.StartDate);
		
		d.rpo=+d.RPO;

    	return d;
    })
    .defer(d3.csv,"/data/innings.csv",function(d){

    	d.Inns= +d.Inns;
		d.oOvers= d.Overs;
		//d.Score= +d.Score;

		d.Overs= +(d.Overs.split("x")[0]);

		d.runs= +(d.Score.split("/")[0]);

		d.RPO= +d.RPO;
		d.Lead= +d.Lead;
		d.date=date_format.parse(d.StartDate);

    	return d;
    })
    .defer(d3.csv,"/data/batsmen.csv",function(d){

    	d.date=date_format.parse(d.StartDate);

		d.runs = isNaN(+d.Runs)?0:+d.Runs;
		d.prev_date = prev_date.batsmen;
		prev_date.batsmen=d.date;

    	return d;
    })
    .defer(d3.csv,"/data/bowlers.csv",function(d){

    	d.date=date_format.parse(d.StartDate);

		d.runs = isNaN(+d.Runs)?0:+d.Runs;
		d.econ = isNaN(+d.Econ)?0:+d.Econ;
		d.prev_date = prev_date.bowlers;
		prev_date.bowlers=d.date;

    	return d;
    })
    //.defer(d3.json,"/data/players.json")
    .await(function(error, ashes_data, series_data, matches_data, aggregates_data, innings_data, batsmen_data, bowlers_data) { 
    	
    	var el = window.gv_el || document.querySelector('.interactive');
    	//d3.select(el).html(base); //d3 way.....
    	el.innerHTML=base;

    	if(detect.hasTouchScreen()) {
    		document.querySelector("body").className += " is-touch";	
    	}
    	

    	aggregates_data.reverse().forEach(function(d,i){
    		d.index=i;
    	})
    	/*
    	ashes.forEach(function(d){
			d.values.date=new Date(d.key);
		});
		*/

		series_data.forEach(function(tour,i){
			if(series_data[i+1]) {
				tour.nextdate=series_data[i+1].date;
			};
		})
		
		////console.log("JSON",ashes_data)
		
		//periods=dataUtils.updatePeriods(periods,ashes);
		
		matches_data=dataUtils.updateMatches(matches_data,series_data,innings_data,aggregates_data)
		
		ashes_data=dataUtils.updateTours(ashes_data);

		//console.log("ASHES DATA",ashes_data)

		aggregates_data=dataUtils.updateAggregates(aggregates_data,series_data,matches_data)

		//console.log("AGGREGATES",aggregates_data)

		//return;
		batsmen_data=dataUtils.updateBatsmen(batsmen_data,series_data,aggregates_data,matches_data)
		bowlers_data=dataUtils.updateBowlers(bowlers_data,series_data,aggregates_data)

		players=dataUtils.updatePlayers(players,batsmen_data,bowlers_data);

    	

    	
		
    	
    	var linechart=new LineChart(ashes_data,{
    		series:series_data,
			container:"#timeline",
			teams:{
					"EN":"England",
					"AU":"Australia"
				}
		});
		
		new ShareButtons('.header .share');

    	var history=new AshesHistory(periods.filter(function(p,i){
    		//return p.shown;
    		return 1;
    		return !i;
    	}),{
			container:"#series",
			series:series_data
		});
		
		
   	
		
		var from=new Date(2005,0,1),
    		to=new Date();
		
		var batsmen=[];
		
		batsmen.push(
			new Batsmen(batsmen_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				container:"#batsmen2005_2015",
				matches:matches_data,
				players:players.batsmen,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		);
		
		var bowlers=[];

		bowlers.push(
			new Bowlers(bowlers_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				matches:matches_data,
				container:"#bowlers2005_2015",
				players:players.bowlers,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		);
		
		
		from=new Date(1989,0,1),
    	to=new Date(2003,11,31);

    	
    	batsmen.push(
	    	new Batsmen(batsmen_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				container:"#batsmen1989_2003",
				matches:matches_data,
				players:players.batsmen,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		)
		
    	bowlers.push(
			new Bowlers(bowlers_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				matches:matches_data,
				container:"#bowlers1989_2003",
				players:players.bowlers,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		)
		
		
		

		from=new Date(1977,0,1),
    	to=new Date(1987,11,31);
		
    	batsmen.push(
	    	new Batsmen(batsmen_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				container:"#batsmen1977_1987",
				matches:matches_data,
				players:players.batsmen,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		)
		

    	bowlers.push(
			new Bowlers(bowlers_data.filter(function(d){
				return d.date >= from && d.date <= to;
			}),{
				from:from,
				to:to,
				matches:matches_data,
				container:"#bowlers1977_1987",
				players:players.bowlers,
				aggregates:aggregates_data,
				teams:{
					"EN":"England",
					"AU":"Australia"
				}
			})
		)


		
		
		
		
		
		
		window.onresize=function(){
			linechart.update();
			history.update();
			
			batsmen.forEach(function(b){
				b.update();
			});


			
			bowlers.forEach(function(b){
				b.update();
			});
			
			
		}
		
    });

	if (!Array.prototype.find) {
		Array.prototype.find = function(predicate) {
		    if (this == null) {
		      throw new TypeError('Array.prototype.find called on null or undefined');
		    }
		    if (typeof predicate !== 'function') {
		      throw new TypeError('predicate must be a function');
		    }
		    var list = Object(this);
		    var length = list.length >>> 0;
		    var thisArg = arguments[1];
		    var value;

		    for (var i = 0; i < length; i++) {
		      value = list[i];
		      if (predicate.call(thisArg, value, i, list)) {
		        return value;
		      }
		    }
		    return undefined;
		};
	}
