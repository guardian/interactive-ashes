var Series=require('./Series')

function AshesHistory(periods,options) {

	//console.log("AshesHistory",periods,options);

	var period=d3.select(options.container)
		.selectAll("div.period")
		.data(periods)
		.enter()
			.append("div")
			.attr("class","period clearfix")
			.classed("compressed",function(d){
				return !d.shown;
			})
				.attr("rel",function(d){
					return d.years.join("-");
				})
				.attr("id",function(d){
					return "p"+d.years.join("_")
				})

	
	var stuff=period.append("div")
			.attr("class","period-stuff clearfix");

	var timeline=period.append("div")
			.attr("class","period-timeline")
			.on("click",function(d,i){
				if(!i) {
					return;
				}
				var this_period=d3.select(this.parentNode),
					compressed=this_period.classed("compressed");
				this_period.classed("compressed",!compressed);
			})

	timeline.append("div")
				.attr("class","clearfix")
				.html(function(d){
					
					return "<b>&nbsp;</b><span>"+d.years.join(" - ")+"</span>"
				})

	var summary=stuff.append("div")
			.attr("class","period-summary");
	
	

	summary.append("div")
			.attr("class","period-summary-years")
			.append("h1")
				.html(function(d){
					if(d.years[1]===new Date().getFullYear()) {
						return d.years[0]+" to present";
					}
					return d.years.join(" to ")
				})
	summary.append("div")
			.attr("class","")
	
	var summaryResults=summary.append("div")
			.attr("class","period-summary-results")
	
	summaryResults.append("div")
			.attr("class",function(d){
				return "EN "+(d.victories.EN<d.victories.AU?"loser":"")
			})
			.html(function(d,i){
				return "England "+d.victories.EN+" <span>"+d.diff.EN+" victories</span>"
			})
	summaryResults.append("div")
			.attr("class",function(d){
				return "AU "+(d.victories.AU<d.victories.EN?"loser":"")
			})
			.html(function(d,i){
				return "Australia "+d.victories.AU+" <span>"+d.diff.AU+" victories</span>"
			})
			

	var blurb=summary.append("div")
			.attr("class","period-summary-blurb")
			.classed("with-img",function(d){
				return  d.years[1]==2015 ||  d.years[1]==2003;
			})
	
	blurb.append("p")
				.html(function(d){
					var str="";
					if(d.blurb) {
						str+=(d.author?"&ldquo;":"")+d.blurb+(d.author?"&rdquo;":"");
						if(d.author) {
							str+="<br/><span class=\"author\">"+d.author+"</span>";
						}	
					}
					return str;
				})
	blurb
		.filter(function(d){
			return d.years[1]==2015;
		})
		.append("img")
			.attr("src","http://media.guim.co.uk/27bf3b015e29187176fc7fcfdf6762637f96b266/403_66_3300_2504/500.jpg")

	blurb
		.filter(function(d){
			return d.years[1]==2003;
		})
		.append("img")
			.attr("src","http://media.guim.co.uk/866bb6f8a9ec172659d1a4c876149e97e3381f02/0_35_2026_1474/500.jpg")

	blurb
		.filter(function(d){
			return d.years[1]==1987;
		})
		.append("img")
			.attr("src","http://media.guim.co.uk/4efa627ad4eef9ab99690b10a92f1106833f092e/0_141_3654_2468/500.jpg")

	
	
	var series=[],
		serie=stuff.append("div")
					.attr("class","period-series");

	serie.each(function(p){
		
		var tour=new Series(options.series.filter(function(d,i){
				
					var year=d.date.getFullYear();
					return year>=p.years[0] && year<=p.years[1];

				}),{
					container:this,//"#series",
					teams:{
						"EN":"England",
						"AU":"Australia"
					},
					area:1

				});
		
		series.push(tour);
		
	})

	

	this.update=update;
	function update() {
		
		series.forEach(function(d){
			d.update();
		})
	}
}

module.exports = AshesHistory;