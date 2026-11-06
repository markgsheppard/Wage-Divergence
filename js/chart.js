// Income Deciles Interactive Chart
// D3.js Visualization — responsive (redraws to fit its container) with touch support

(function() {
  // Blue color palette (light to dark)
  const colors = d3.range(1, 11).map(d => d3.interpolateBlues(0.2 + (d - 1) * 0.08));

  // Set up legend gradient
  const legendBar = document.getElementById('legendBar');
  legendBar.style.background = `linear-gradient(to right, ${colors.join(', ')})`;

  const chartEl = document.getElementById('chart');

  // State
  let indexMode = false;
  let indexYear = 1982;
  let currentHide = () => {};

  // Tooltip (created once)
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

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
  function calculateDynamicYAxis(data, step) {
    const maxValue = d3.max(data, d => d.value);
    const minValue = d3.min(data, d => d.value);
    const yMax = Math.ceil(maxValue / step) * step;
    const yMin = Math.max(0, Math.floor(minValue / step) * step);
    const ticks = d3.range(yMin, yMax + 1, step);
    return { yMin, yMax, ticks };
  }

  function render() {
    const fullWidth = Math.max(280, Math.floor(chartEl.clientWidth || 800));
    const isSmall = fullWidth < 600;

    // Dimensions scale with available width; taller aspect on phones
    const margin = isSmall
      ? { top: 10, right: 18, bottom: 28, left: 40 }
      : { top: 15, right: 15, bottom: 35, left: 50 };
    const fullHeight = isSmall
      ? Math.round(Math.min(Math.max(fullWidth * 0.85, 260), 420))
      : Math.round(fullWidth / 2);
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    d3.select(chartEl).selectAll("svg").remove();
    tooltip.style("opacity", 0);

    const root = d3.select(chartEl)
      .append("svg")
      .attr("width", fullWidth)
      .attr("height", fullHeight)
      .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
      .classed("small", isSmall);

    const svg = root.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear().domain([1982, 2024]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 300000]).range([height, 0]);

    // Recession bars
    svg.selectAll(".recession")
      .data(recessions)
      .enter()
      .append("rect")
      .attr("class", "recession")
      .attr("x", d => x(Math.max(1982, d.start)))
      .attr("y", 0)
      .attr("width", d => x(Math.min(2024, d.end)) - x(Math.max(1982, d.start)))
      .attr("height", height);

    // Grid
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

    // X axis — fewer ticks on narrow screens
    const xStep = width < 350 ? 8 : (width < 550 ? 6 : 4);
    svg.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(d3.range(1984, 2025, xStep))
        .tickFormat(d3.format("d"))
        .tickSize(0)
        .tickPadding(6))
      .select(".domain")
      .attr("stroke", "#aaa");

    // Y axis
    const yAxisGroup = svg.append("g").attr("class", "axis y-axis");
    function updateYAxis(ticks, isIndex) {
      yAxisGroup.selectAll("*").remove();
      yAxisGroup.call(d3.axisLeft(y)
        .tickValues(ticks)
        .tickFormat(d => isIndex ? d : `$${d/1000}K`)
        .tickSize(0)
        .tickPadding(6));
      yAxisGroup.select(".domain").remove();
    }

    // Lines
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5));
    const linesGroup = svg.append("g").attr("class", "lines");

    const data = getData();
    if (indexMode) {
      const { yMin, yMax, ticks } = calculateDynamicYAxis(data, height < 300 ? 50 : 25);
      y.domain([yMin, yMax]);
      updateGrid(ticks);
      updateYAxis(ticks, true);
    } else {
      const ticks = d3.range(0, 300001, height < 300 ? 50000 : 20000);
      updateGrid(ticks);
      updateYAxis(ticks, false);
    }

    const deciles = d3.group(data, d => d.decile);
    deciles.forEach((values, decile) => {
      linesGroup.append("path")
        .datum(values)
        .attr("class", "line")
        .attr("d", line)
        .attr("stroke", colors[decile - 1]);
    });

    // Focus line
    const focus = svg.append("g").style("display", "none");
    focus.append("line")
      .attr("class", "focus-line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#bbb")
      .attr("stroke-dasharray", "3,3");

    function showAt(event) {
      const xPos = d3.pointer(event, svg.node())[0];
      const year = Math.max(1982, Math.min(2024, Math.round(x.invert(xPos))));
      focus.style("display", null);
      focus.select(".focus-line").attr("x1", x(year)).attr("x2", x(year));

      const yearData = data.filter(d => d.year === year)
        .sort((a, b) => b.decile - a.decile);

      let html = `<strong>${year}</strong><br>`;
      yearData.forEach(d => {
        const val = indexMode
          ? d.value.toFixed(1)
          : `$${Math.round(d.annual_income).toLocaleString()}`;
        html += `<span style="color:${colors[d.decile-1]}">●</span> Decile ${d.decile}: ${val}<br>`;
      });

      tooltip.html(html).style("opacity", 1);
      positionTooltip(event, isSmall);
    }

    function hide() {
      focus.style("display", "none");
      tooltip.style("opacity", 0);
    }

    // Interaction overlay — pointer events cover mouse, touch and pen
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("pointerenter pointerdown pointermove", showAt)
      .on("pointerleave", function(event) {
        if (event.pointerType === "mouse") hide();
      });

    currentHide = hide;
  }

  // Keep the tooltip inside the viewport; on phones, place it above the finger
  function positionTooltip(event, isSmall) {
    const node = tooltip.node();
    const tw = node.offsetWidth;
    const th = node.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const pad = 8;

    let left, top;
    if (isSmall) {
      left = event.pageX - tw / 2;
      top = event.pageY - th - 24;
      if (top < scrollY + pad) top = event.pageY + 24;
    } else {
      left = event.pageX + 15;
      top = event.pageY - 10;
      if (left + tw > scrollX + vw - pad) left = event.pageX - tw - 15;
    }
    left = Math.max(scrollX + pad, Math.min(left, scrollX + vw - tw - pad));
    tooltip.style("left", left + "px").style("top", top + "px");
  }

  render();

  // On touch devices, tapping outside the chart dismisses the tooltip
  document.addEventListener("pointerdown", e => {
    if (!chartEl.contains(e.target)) currentHide();
  }, { passive: true });

  // Redraw on resize / rotation (debounced, width changes only)
  let lastWidth = chartEl.clientWidth;
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (chartEl.clientWidth !== lastWidth) {
        lastWidth = chartEl.clientWidth;
        render();
      }
    }, 150);
  });

  // Index toggle — whole label is the tap target
  const toggle = document.getElementById('indexToggle');
  toggle.closest('label').addEventListener('click', function() {
    indexMode = !indexMode;
    toggle.classList.toggle('active', indexMode);
    document.getElementById('sliderContainer').classList.toggle('visible', indexMode);
    render();
  });

  document.getElementById('indexSlider').addEventListener('input', function() {
    indexYear = parseInt(this.value);
    document.getElementById('indexYearLabel').textContent = indexYear;
    if (indexMode) render();
  });

})();
