function AshesSummary(data,options) {
	//console.log("AshesSummary",data)

	var aggregates=d3.nest()
						.key(function(d){
							return d.Year;
						})
						.entries(data)

	var extents;
	
	function setExtents() {

		extents={
			date:d3.extent(data,function(d){
				return d.date;
			}),
			index:d3.extent(data,function(d){
				return d.index;
			})
		};

	};

	setExtents();

	var margins={
    	left:0,
    	right:0,
    	top:0,
    	bottom:1
    };

	var container=d3.select(options.container);
	var list=container.append("div")
    				.attr("class","ashes-list")

	var size=list.node().getBoundingClientRect(),
    	WIDTH = size.width;

   	//console.log(WIDTH)

    

	var xscale=d3.scale.linear().domain(extents.index).range([0,WIDTH-(margins.left+margins.right)]);
	
	//console.log(aggregates)

	

	

    var tour=list.selectAll("div")
    		.data(aggregates)
    		.enter()
    		.append("div")
    			.attr("class","tour")
    			.style("left",function(d){
    				return (xscale(d.values[0].index)+margins.left)+"px";
    			})
    			.style("width",function(d){
    				//console.log(d);
    				var width=xscale(d.values[d.values.length-1].index) - xscale(d.values[0].index);
    				return width+"px";
    			})

    tour.append("h2")
    		.text(function(d){
    			return d.key;
    		})
    		.attr("class",function(d){
    			return d.values[0].series_winner;
    		})
    tour.selectAll("div.match")
    		.data(function(d){
    			return d.values.map(function(m){
    				m.parentLeft=d.values[0].index;
    				return m;
    			});
    		})
    		.enter()
    		.append("div")
    		.attr("class",function(d){
    			return "match "+d.Winner;
    		})
    			.style("left",function(d){
    				var left=xscale(d.index) - xscale(d.parentLeft)
    				return (left-2)+"px"
    			})

}

module.exports = AshesSummary;