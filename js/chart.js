// Income Deciles Interactive Chart
// D3.js Visualization

(function() {
  // Blue color palette (light to dark)
  const colors = d3.range(1, 11).map(d => d3.interpolateBlues(0.2 + (d - 1) * 0.08));
  
  // Set up legend gradient
  const legendBar = document.getElementById('legendBar');
  legendBar.style.background = `linear-gradient(to right, ${colors.join(', ')})`;

  // Chart dimensions
  const margin = { top: 15, right: 15, bottom: 35, left: 50 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // State
  let indexMode = false;
  let indexYear = 1982;

  // Create SVG
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([1982, 2024])
    .range([0, width]);

  let y = d3.scaleLinear()
    .domain([0, 300000])
    .range([height, 0]);

  // Add recession bars
  svg.selectAll(".recession")
    .data(recessions)
    .enter()
    .append("rect")
    .attr("class", "recession")
    .attr("x", d => x(Math.max(1982, d.start)))
    .attr("y", 0)
    .attr("width", d => x(Math.min(2024, d.end)) - x(Math.max(1982, d.start)))
    .attr("height", height);

  // Grid lines group
  const gridGroup = svg.append("g").attr("class", "grid");
  
  function updateGrid(ticks) {
    gridGroup.selectAll("line").remove();
    gridGroup.selectAll("line")
      .data(ticks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d));
  }

  // X axis
  svg.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickValues(d3.range(1984, 2025, 4))
      .tickFormat(d3.format("d"))
      .tickSize(0))
    .select(".domain")
    .attr("stroke", "#aaa");

  // Y axis group
  const yAxisGroup = svg.append("g")
    .attr("class", "axis y-axis");

  function updateYAxis(ticks, isIndex) {
    yAxisGroup.selectAll("*").remove();
    yAxisGroup.call(d3.axisLeft(y)
      .tickValues(ticks)
      .tickFormat(d => isIndex ? d : `$${d/1000}K`)
      .tickSize(0));
    yAxisGroup.select(".domain").remove();
  }

  // Line generator with curve
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value))
    .curve(d3.curveCatmullRom.alpha(0.5));

  // Lines group
  const linesGroup = svg.append("g").attr("class", "lines");

  // Get data based on current mode
  function getData() {
    if (!indexMode) {
      return rawData.map(d => ({...d, value: d.annual_income}));
    }
    const baseYearData = {};
    rawData.filter(d => d.year === indexYear).forEach(d => {
      baseYearData[d.decile] = d.annual_income;
    });
    return rawData.map(d => ({
      ...d,
      value: (d.annual_income / baseYearData[d.decile]) * 100
    }));
  }

  // Calculate dynamic Y axis for index mode
  function calculateDynamicYAxis(data) {
    const maxValue = d3.max(data, d => d.value);
    const minValue = d3.min(data, d => d.value);
    const yMax = Math.ceil(maxValue / 25) * 25;
    const yMin = Math.max(0, Math.floor(minValue / 25) * 25);
    const ticks = d3.range(yMin, yMax + 1, 25);
    return { yMin, yMax, ticks };
  }

  // Update chart
  function updateChart() {
    const data = getData();
    
    if (indexMode) {
      const { yMin, yMax, ticks } = calculateDynamicYAxis(data);
      y.domain([yMin, yMax]);
      updateGrid(ticks);
      updateYAxis(ticks, true);
    } else {
      y.domain([0, 300000]);
      const ticks = d3.range(0, 300001, 20000);
      updateGrid(ticks);
      updateYAxis(ticks, false);
    }

    linesGroup.selectAll("path").remove();
    const deciles = d3.group(data, d => d.decile);
    deciles.forEach((values, decile) => {
      linesGroup.append("path")
        .datum(values)
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke", colors[decile - 1]);
    });
  }

  // Initial render
  updateChart();

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Focus line for hover
  const focus = svg.append("g")
    .style("display", "none");

  focus.append("line")
    .attr("class", "focus-line")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#bbb")
    .attr("stroke-dasharray", "3,3");

  // Hover interaction overlay
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => {
      focus.style("display", "none");
      tooltip.style("opacity", 0);
    })
    .on("mousemove", function(event) {
      const xPos = d3.pointer(event)[0];
      const year = Math.round(x.invert(xPos));
      if (year >= 1982 && year <= 2024) {
        focus.select(".focus-line")
          .attr("x1", x(year))
          .attr("x2", x(year));
        
        const data = getData();
        const yearData = data.filter(d => d.year === year)
          .sort((a, b) => b.decile - a.decile);
        
        let html = `<strong>${year}</strong><br>`;
        yearData.forEach(d => {
          if (indexMode) {
            html += `<span style="color:${colors[d.decile-1]}">●</span> Decile ${d.decile}: ${d.value.toFixed(1)}<br>`;
          } else {
            html += `<span style="color:${colors[d.decile-1]}">●</span> Decile ${d.decile}: $${Math.round(d.annual_income).toLocaleString()}<br>`;
          }
        });
        
        tooltip
          .style("opacity", 1)
          .html(html)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 10) + "px");
      }
    });

  // Event listeners for index control
  document.getElementById('indexToggle').addEventListener('click', function() {
    indexMode = !indexMode;
    this.classList.toggle('active', indexMode);
    document.getElementById('sliderContainer').classList.toggle('visible', indexMode);
    updateChart();
  });

  document.getElementById('indexSlider').addEventListener('input', function() {
    indexYear = parseInt(this.value);
    document.getElementById('indexYearLabel').textContent = indexYear;
    if (indexMode) {
      updateChart();
    }
  });

})();
