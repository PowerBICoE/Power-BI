module powerbi.extensibility.visual {
    interface LineItem {
        date: string;
        close: number;
    }
    export class Visual implements IVisual {

        private svg: d3.Selection < SVGAElement > ;
        private host: IVisualHost;
        private myVisualProp: Fill
        private myVisualPropmyLineThickness: number;

        static Config = {
            xScalePadding: 0.1,
            solidOpacity: 1,
            transparentOpacity: 0.5,
            xAxisFontMultiplier: 0.04,
        };


        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);

            this.host = options.host;

            var svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('worksheet', true);

            this.myVisualProp = {
                solid: {
                    color: "Red"
                }
            };
            this.myVisualPropmyLineThickness = 5;

        }

        public update(options: VisualUpdateOptions) {
            console.log('Visual update', options);

            // Set the svg element height/width based on viewport
            let optionsWidth = options.viewport.width;
            let OptionsHeight = options.viewport.height;

            //console.log(JSON.stringify(options.dataViews))
            let dataViews = options.dataViews;
            let categorical = dataViews[0].categorical;
            let category = categorical.categories[0];
            let dataValue = categorical.values[0];
            //console.log(category);
            //console.log(dataValue);
            console.log(JSON.stringify(category))
            console.log(JSON.stringify(dataValue))

            // convert data format
            var data = Visual.converter(options.dataViews[0].table.rows);
            
            var margin = {
                top: 20,
                right: 30,
                bottom: 30,
                left: 80
            };

            let width = optionsWidth - margin.left - margin.right;
            let height = OptionsHeight - margin.top - margin.bottom;

            this.svg.attr({
                width: width + margin.left + margin.right,
                height: height + margin.top + margin.bottom
            });

            var dataView = options.dataViews[0];

            if (options.dataViews[0]) {
                if (options.dataViews[0].metadata.objects) {
                    console.log("Hello")
                    if (options.dataViews[0].metadata.objects["myLine"]["myLineColour"] != undefined)
                    {
                    this.myVisualProp = options.dataViews[0].metadata.objects["myLine"]["myLineColour"];
                    
                }
                    if (options.dataViews[0].metadata.objects["myLine"]["myLineThickness"] != undefined){
                    this.myVisualPropmyLineThickness = < number > options.dataViews[0].metadata.objects["myLine"]["myLineThickness"];
                    }
                }
            } else {
                console.log("first")
                this.myVisualProp = {
                    solid: {
                        color: "Red"
                    }
                }
                this.myVisualPropmyLineThickness = < number > 5;
            }
          
            let parseDate = d3.time.format("%Y-%m-%d").parse;

            var minDate = d3.min(data, d => parseDate(d.date));
            var maxDate = d3.max(data, d => parseDate(d.date));
            var minClose = d3.min(data, d => d.close);
            var maxClose = d3.max(data, d => d.close);

            let xScale = d3.time.scale()
                //.domain(data.map(function(d) { return parseDate(d.date); }))
                //.range([0, width])
                //.domain([parseDate(data[0].date), parseDate(data[data.length - 1].date)])
                //.domain([minDate,maxDate])
                .domain(d3.extent(data, function(d) {
                    return parseDate(d.date);
                }))
                .range([0, width]);

            let yScale = d3.scale.linear()
                .domain([0, d3.max(data, function(d) {
                    return d.close;
                })])
                //.domain(d3.extent(data, function(d){return d.close;}))
                .range([height, 0]);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(10)

            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(10)
                .innerTickSize(-width)
                .outerTickSize(10)
                .tickPadding(10)

            let worksheet = d3.select(".worksheet")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            // remove exsisting axis and bar
            this.svg.selectAll("*").remove();
            this.svg.selectAll('.axis').remove();
            this.svg.selectAll('.bar').remove();
            this.svg.selectAll('.chart').remove();
            this.svg.selectAll('.text').remove();

            let chart = d3.select(".worksheet")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("class", "chart")

            chart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            chart.append("g")
                .attr("class", "y axis")
                .call(yAxis)

            var line = d3.svg.line()
                .x(function(d, i) {
                    return xScale(parseDate(this.data.date))
                })
                .y(function(d, i) {
                    return yScale(this.data.close)
                })
               // .interpolate("linear")

            chart.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", "M" + data.map((d) => {
                    return xScale(parseDate(d.date)) + ',' + yScale(d.close);
                }).join('L'))
                //.attr("d",<any>line)
                .attr('stroke', this.myVisualProp.solid.color)
                .attr('stroke-width', this.myVisualPropmyLineThickness)
                .attr('fill', 'none')
             
                var meanValue = d3.mean(data, d => d.close)
                var maxValue = d3.max(data, d => d.close)
                var minValue = d3.min(data, d => d.close)


             chart.append("path")
                .datum(data)
                .attr("class", "line")
               .attr("d","M 0 " + yScale(meanValue) 
                            + " L " + xScale(maxDate)+" "+ yScale(meanValue)  +"")
               .attr('stroke',"blue")
               .attr('stroke-width',"2")
               .attr('fill', 'none')
               
            this.svg.append("text")
            .attr("transform", "translate(" + xScale(maxDate) + "," + yScale(meanValue) + ")")
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "blue")
            .text("Mean: "+(String(Math.round(meanValue).toFixed(2))));

            chart.append("path")
                .datum(data)
                .attr("class", "line")
               .attr("d","M 0 " + yScale(maxValue) 
                            + " L " + xScale(maxDate)+" "+ yScale(maxValue)  +"")
               .attr('stroke',"green")
               .attr('stroke-width',"2")
               .attr('fill', 'none')
               
         
            this.svg.append("text")
            .attr("transform", "translate(" + xScale(maxDate) + "," + ( margin.bottom) + ")")
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "green")
            .text("Max: "+(String(Math.round(maxValue).toFixed(2))));

             chart.append("path")
                .datum(data)
                .attr("class", "line")
               .attr("d","M 0 " + yScale(minValue) 
                            + " L " + xScale(maxDate)+" "+ yScale(minValue)  +"")
               .attr('stroke',"red")
               .attr('stroke-width',"2")
               .attr('fill', 'none')
               
         
            this.svg.append("text")
            .attr("transform", "translate(" + xScale(maxDate) + "," + yScale( minValue) + ")")
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .style("fill", "red")
            .text("Min: "+(String(Math.round(minValue).toFixed(2))));

        }

        /**
         * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
         *
         * @function
         * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            console.log('Visual enumerateObjectInstances', options);
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case "myLine":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            myLineColour:  this.myVisualProp.solid.color,
                            myLineThickness: this.myVisualPropmyLineThickness
                        },
                        validValues: {
                            myLineThickness: {
                                numberRange: {
                                    min: 1,
                                    max: 10
                                }
                            }
                        },
                        selector: null
                    });

                    break;
            };
            return objectEnumeration;

        }

        public static converter(rows: DataViewTableRow[]): LineItem[] {
            var resultData: LineItem[] = [];

            for (var i = 0; i < rows.length; i++) {
                let dt = new Date(rows[i][0])

                var row = rows[i];
                resultData.push({
                    date: (dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate()).toString(),
                    close: < number > rows[i][3]
                });
            }
            return resultData;
        }
    }
}