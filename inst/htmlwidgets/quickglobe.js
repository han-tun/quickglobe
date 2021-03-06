HTMLWidgets.widget({

  name: 'quickglobe',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(opts) {

        let data = HTMLWidgets.dataframeToD3(opts.data);
        let dataMap = new Map(data.map(d => [d.id, d.val]));
        let projection = d3.geoOrthographic().clipAngle(90);
        let path = d3.geoPath().projection(projection);
        let sens = 0.25;
        let map = void 0;
        let world = void 0;
        let palette = opts.palette;
        let color;
        let legendScale;
        let shapeWidth;
        let nCells;
        color = opts.fill_type === "interpolate" ? d3.scaleSequential(d3[palette]) : d3.scaleOrdinal(d3[palette]);
        color.domain(opts.domain);

        if (opts.fill_type === "interpolate") {
          nCells = opts.hasOwnProperty("legendCells") ? opts.legendCells : 6;
        } else {
          nCells = opts.domain.length;
        }
        shapeWidth = (width-50)/nCells;

        const svg = d3.select(el)
                    .append("svg")
                    .style("width", "100%")
                    .style("height", "100%");

        if (opts.title !== null) {

          titleFontFamily = opts.hasOwnProperty("titleFontFamily") ? opts.titleFontFamily : "Arial";
          svg.append("g")
                .attr("class", 'titleLabel')
                .attr("transform", "translate(20, 15)")
                .append("text")
                .style("font", `20px ${titleFontFamily}`)
                .text(opts.title);
        }

        if (opts.legend) {

          svg.append("g")
            .attr("class", "legendG")
            .attr("transform", "translate(20,25)");

          legendScale = d3.legendColor()
                  .shapeWidth(shapeWidth)
                  .cells(nCells)
                  .orient('horizontal')
                  .scale(color);

         if (opts.hasOwnProperty("formatLegendTicks")) {
           legendScale.labelFormat(d3.format(opts.formatLegendTicks));
         }

        svg.select(".legendG")
          .call(legendScale);
        }

        let shape = HTMLWidgets.getAttachmentUrl('shapes', 'world');
        //let names = HTMLWidgets.getAttachmentUrl('mapdata', 'countrynames');

        Promise.all([
            d3.json(shape),
            //d3.tsv(names),
            ]).then(function(files) {

              let countries = topojson.feature(files[0], files[0].objects.countries);
              map = svg.append('g').attr('class', 'boundary');
              world = map.selectAll('path').data(countries.features);

              projection.scale(1).translate([0, 0]);
              let b = path.bounds(countries);
              let s = 0.9 / Math.max((b[1][0] - b[0][0]) / (width*0.75), (b[1][1] - b[0][1]) / (height*0.75));
              let t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
              projection.scale(s).translate(t);
              projection.rotate([90,0,0]);

              world.enter()
                .append('path')
                .attr('d', path)
                .attr("fill", d => color(dataMap.get(d.id)))
                .attr("class", "land");

              svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height)
                .attr("transform", "translate(0, 0)")
                // shouts to KoGor's block for the dragging behavior: http://bl.ocks.org/KoGor/5994804
                .call(d3.drag()
                  .subject(function() { let r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
                  .on("drag", function() {
                    let rotate = projection.rotate();
                    projection.rotate([d3.event.x * sens, -d3.event.y * sens, rotate[2]]);
                    svg.selectAll("path.land").attr("d", path);
                }));

        }).catch(function(err) {
        });
      },

      resize: function(width, height) {

      }
    };
  }
});
