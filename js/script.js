/**
 * Created by AMIT MITTAL on 4/10/13.
 */

//TODO In data, the last entry should be the current time and price
//TODO make size of graph dynamic
//TODO Implement the event flags at the bottom of the graph - see google charts

function draw(data, eventData, container){
	var total_w = 960,
		total_h = 500,
		transitionDuration = 1000;

	var margin = {top: 10, right: 10, bottom: 100, left:40},
		margin2 = {top: 430, right: 10, bottom: 20, left: 40},
		width = total_w - margin.right - margin.left,
		height = total_h - margin.top - margin.bottom,
		height2 = total_h - margin2.top - margin2.bottom;

	var monthNames = [ "January", "February", "March", "April", "May", "June",
		"July", "August", "September", "October", "November", "December" ];

	var factor_lower_bound_bottom = 0.8,
		factor_upper_bound_bottom = 1,
		factor_lower_bound_top = 0.5,
		factor_upper_bound_top = 1.5;

	var maxVal = d3.max(data, function(d){ return d.value; }),
		minVal = d3.min(data, function(d){ return d.value; }),
		maxVal_bottom = factor_upper_bound_bottom*maxVal,
		maxVal_top = factor_upper_bound_top*maxVal,
		minVal_bottom = factor_lower_bound_bottom*minVal,
		minVal_top = factor_lower_bound_top*minVal;

	var pointer_outer_radius = 7.0,
		pointer_mid_radius = 5.0,
		pointer_inner_radius = 3.0;

	var tickPadding = 10,
		ticks = 7;

	var xScale = d3.time.scale().range([0, width]).domain(d3.extent(data.map(function(d){return d.time;}))),
		xScale2 = d3.time.scale().range([0, width]).domain(xScale.domain()),
		yScale = d3.scale.linear().range([height, 0]).domain([minVal_top, maxVal_top]),
		yScale2 = d3.scale.linear().range([height2, 0]).domain([minVal_bottom, maxVal_bottom]);

	var xAxis = d3.svg.axis().scale(xScale).orient('bottom').tickSize(height).tickPadding(tickPadding).ticks(ticks),
		xAxis2 = d3.svg.axis().scale(xScale2).orient('bottom').tickSize(0).tickPadding(tickPadding).ticks(ticks),
		yAxis = d3.svg.axis().scale(yScale).orient('left').tickSize(-width).tickPadding(tickPadding);

	var line = d3.svg.line()
		.x(function(d){return xScale(d.time);})
		.y(function(d){return yScale(d.value);})
		.interpolate("step-after");

	var area = d3.svg.area()
		.x(function(d){return xScale(d.time);})
		.y0(height)
		.y1(function(d){return yScale(d.value);})
		.interpolate("step-after");

	var area2 = d3.svg.area()
		.x(function(d){return xScale2(d.time);})
		.y0(height2)
		.y1(function(d){return yScale2(d.value);})
		.interpolate("step-after");
		//.interpolate("linear");

	var brush = d3.svg.brush()
		.x(xScale2)
		.on("brush", brushed);

	var svg = d3.select('#'+container).append('svg:svg')
		.attr("width", width+margin.left+margin.right)
		.attr("height", height+margin.top+margin.bottom)
		.attr("class", "graph");

	svg.append("defs")
		.append("clipPath")
		.attr("id", "clip")
		.append("rect")
		.attr("width", width)
		.attr("height", height);

	var focus = svg.append('svg:g')
		.attr('transform', 'translate('+margin.left + ',' + margin.top +')');

	var context = svg.append('svg:g')
		.attr("transform", "translate("+margin2.left + "," + margin2.top+")");

	var pointers = svg.append("svg:g");

	var pointer_outer = pointers.append("circle")
		.attr("r", pointer_outer_radius)
		.attr("opacity", 0)
		.attr("class", "pointer pointer_outer");

	var pointer_mid = pointers.append("circle")
		.attr("r", pointer_mid_radius)
		.attr("opacity", 0)
		.attr("class", "pointer pointer_mid");

	var pointer_inner = pointers.append("circle")
		.attr("r", pointer_inner_radius)
		.attr("opacity", 0)
		.attr("class", "pointer pointer_inner");

	focus.transition().duration(transitionDuration);
	context.transition().duration(transitionDuration);

	var path = focus.append("svg:path")
		.datum(data)
		.attr("class", 'area')
		.attr("clip-path", "url(#clip)")
		.attr("d", area);

	var offsetLeft = document.getElementById("container").offsetLeft;

	svg.on("mouseover", function(){
	});

	svg.on("mousemove", function(){
		var x = d3.event.pageX - margin.left - offsetLeft,
			bisect = d3.bisector(function(d) { return new Date(d.time); }).left,
			item = data[bisect(data, xScale.invert(x)) - 1],
			adjustment = 8;

		pointer_outer
			.attr("opacity", 1)
			.attr("cx", x + margin.left)
			.attr("cy", yScale(item.value) + margin.top);
		pointer_mid
			.attr("opacity", 1)
			.attr("cx", x + margin.left)
			.attr("cy", yScale(item.value) + margin.top);
		pointer_inner
			.attr("opacity", 1)
			.attr("cx", x + margin.left)
			.attr("cy", yScale(item.value) + margin.top);

		var pDate = xScale.invert(x);
		var content = '<p>' + 'Date: ' + pDate.getDate() + " " + monthNames[pDate.getMonth()] + " " + pDate.getFullYear() + '</p><br>' +
			'Price: $' + item.value;

		nvtooltip.cleanup();
		nvtooltip.show([x + margin.left + adjustment, yScale(item.value) + margin.top], content);
	});

	svg.on("mouseout", function(){
		nvtooltip.cleanup();
		pointer_inner
			.attr("opacity", 0);
		pointer_mid
			.attr("opacity", 0);
		pointer_outer
			.attr("opacity", 0);
	});

	focus.append('svg:g')
		.attr('class', 'y axis yTick')
		.call(yAxis);

	focus.append('svg:g')
		.attr('class', 'x axis xTick')
		.call(xAxis);

	context.append('svg:path')
		.attr("class", "area2")
		.datum(data)
		.attr('d', area2);

	context.append('svg:g')
		.attr('class', 'x axis xTick')
		.call(xAxis2)
		.attr("transform", "translate(0, " + height2 +")");

	context.append('svg:g')
		.attr("class", "x brush xTick")
		.call(brush)
		.selectAll("rect")
		.attr("y", -6)
		.attr("height", height2 + 7);

	d3.selectAll(".area").transition()
		.duration(transitionDuration)
		.attr("d", area(data));

	d3.selectAll(".area2").transition()
		.duration(transitionDuration)
		.attr("d", area2(data));

	function brushed(){
		xScale.domain(brush.empty() ? xScale2.domain() : brush.extent());
		focus.select("path").attr("d", area);
		focus.select(".x.axis").call(xAxis);
	}
}

function generateData(){
	var data = [];

	var rows = Math.max(Math.round(Math.random()*100), 3);
	while(rows--){
		var time = new Date();
		time.setDate(time.getDate() - rows);
		time.setHours(0, 0, 0, 0);
		data.push({'value' : Math.round(Math.random()*1234), 'time': time});
	}
	return data;
}

var data = generateData();

//this is the data which we actually would be receiving from the backend
var data1 = [{"time":1343334602000,"value":74.99},{"time":1343334602000,"value":74.99},{"time":1353616347000,"value":49.99},{"time":1353616347000,"value":49.99},{"time":1353875613000,"value":74.99},{"time":1353875613000,"value":74.99},{"time":1353961988000,"value":59.99},{"time":1353961988000,"value":59.99},{"time":1354480389000,"value":74.99},{"time":1354480389000,"value":74.99},{"time":1355689918000,"value":39.99},{"time":1355689918000,"value":39.99},{"time":1355776325000,"value":54.99},{"time":1355776325000,"value":54.99},{"time":1356294693000,"value":49.99},{"time":1356294693000,"value":49.99},{"time":1356397844000,"value":74.99},{"time":1356397844000,"value":74.99},{"time":1358713944000,"value":59.99},{"time":1358713944000,"value":59.99},{"time":1359318757000,"value":74.99},{"time":1359318757000,"value":74.99},{"time":1359867900000,"value":54.99},{"time":1359867900000,"value":54.99},{"time":1361133285000,"value":74.99},{"time":1361133285000,"value":74.99},{"time":1361392485000,"value":64.99},{"time":1361392485000,"value":64.99},{"time":1362343321000,"value":74.99},{"time":1362343321000,"value":74.99},{"time":1363649886000,"value":59.99},{"time":1363649886000,"value":59.99},{"time":1363736510000,"value":64.99},{"time":1363736510000,"value":64.99},{"time":1364082080000,"value":49.99},{"time":1364082080000,"value":49.99},{"time":1364773313000,"value":59.99},{"time":1364773313000,"value":59.99},{"time":1364946182000,"value":74.99},{"time":1364946182000,"value":74.99},{"time":1365291713000,"value":49.99},{"time":1365291713000,"value":49.99},{"time":1365896780000,"value":74.99},{"time":1365896780000,"value":74.99},{"time":1366069116000,"value":59.99},{"time":1366069116000,"value":59.99},{"time":1366242218000,"value":69.99},{"time":1366242218000,"value":69.99},{"time":1366763881000,"value":59.99},{"time":1366763881000,"value":59.99},{"time":1366847100000,"value":69.99},{"time":1366847100000,"value":69.99},{"time":1367106297000,"value":49.99},{"time":1367106297000,"value":49.99},{"time":1367711165000,"value":69.99},{"time":1367711165000,"value":69.99},{"time":1368920370000,"value":34.99},{"time":1368920370000,"value":34.99},{"time":1369525745000,"value":69.99},{"time":1369525745000,"value":69.99},{"time":1370130486000,"value":39.99},{"time":1370130486000,"value":39.99},{"time":1370821482000,"value":69.99},{"time":1370821482000,"value":69.99},{"time":1371944521000,"value":39.99},{"time":1371944521000,"value":39.99},{"time":1372635684000,"value":69.99},{"time":1372635684000,"value":69.99},{"time":1372722591000,"value":59.99},{"time":1372722591000,"value":59.99},{"time":1373251637000,"value":39.99},{"time":1373251637000,"value":39.99},{"time":1373759523000,"value":59.99},{"time":1373759523000,"value":59.99},{"time":1374364186000,"value":49.99},{"time":1374364186000,"value":49.99},{"time":1374989199000,"value":59.99},{"time":1374989199000,"value":59.99},{"time":1375574192000,"value":29.99},{"time":1375574192000,"value":29.99}];
var data2 = [{"time":1343334602000,"value":59.99},{"time":1343334602000,"value":59.99},{"time":1361392485000,"value":49.99},{"time":1361392485000,"value":49.99},{"time":1362343321000,"value":59.99},{"time":1362343321000,"value":59.99},{"time":1366673964000,"value":47.99},{"time":1366673964000,"value":47.99},{"time":1366847100000,"value":59.99},{"time":1366847100000,"value":59.99},{"time":1367365595000,"value":47.99},{"time":1367365595000,"value":47.99},{"time":1367538009000,"value":59.99},{"time":1367538009000,"value":59.99},{"time":1367797139000,"value":47.99},{"time":1367797139000,"value":47.99},{"time":1367970120000,"value":59.99},{"time":1367970120000,"value":59.99},{"time":1369179753000,"value":47.99},{"time":1369179753000,"value":47.99},{"time":1369266581000,"value":59.99},{"time":1369266581000,"value":59.99},{"time":1372053763000,"value":47.99},{"time":1372053763000,"value":47.99},{"time":1372203712000,"value":59.99},{"time":1372203712000,"value":59.99}];

draw(data2, null, 'container');