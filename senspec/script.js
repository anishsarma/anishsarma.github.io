const margin = {top: 20, right: 20, bottom: 40, left: 40};
const size = 440; // Size of the square plot (including margins)
const width = 440 - margin.left - margin.right;  // Adjusted for full width
const height = 400 - margin.top - margin.bottom;

// Add these variables at the top of your script
let currentThreshold;
let isUpdating = false;
let showFPR = false;

// Create SVG elements for both plots
const distributionSvg = d3.select("#distributionPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const rocSvg = d3.select("#rocPlot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Set up scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const rocXScale = d3.scaleLinear().range([0, width]).domain([0, 1]);
const rocYScale = d3.scaleLinear().range([height, 0]).domain([0, 1]);

// Add axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);
const rocXAxis = d3.axisBottom(rocXScale).ticks(5);
const rocYAxis = d3.axisLeft(rocYScale).ticks(5);

distributionSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

distributionSvg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

rocSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(rocXAxis);

rocSvg.append("g")
    .attr("class", "y-axis")
    .call(rocYAxis);

// Add labels
rocSvg.append("text")
    .attr("class", "x-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .text("False Positive Rate")
    .style("cursor", "pointer")  // Add cursor style
    .on("click", function() {    // Add click event
        showFPR = !showFPR;
        updatePlots();
    });

rocSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${-margin.left + 15},${height/2}) rotate(-90)`)
    .text("Sensitivity (True Positive Rate)");

// Function to calculate normal distribution
function normalDist(x, mean, sd) {
    return 1 / (sd * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
}

// Function to calculate TPR and FPR
function calculateRates(threshold, mean1, sd1, mean2, sd2) {
    // For TPR, we want P(X > threshold | X ~ N(mean2, sd2^2))
    const tpr = 0.5 - math.erf((threshold - mean2) / (Math.sqrt(2) * sd2)) / 2;
    
    // For FPR, we want P(X > threshold | X ~ N(mean1, sd1^2))
    const fpr = 0.5 - math.erf((threshold - mean1) / (Math.sqrt(2) * sd1)) / 2;
        return {tpr, fpr};
}

// Function to find the threshold for a given point on the ROC curve
function findThresholdForROCPoint(targetFPR, targetTPR, mean1, sd1, mean2, sd2) {
    let low = Math.min(mean1 - 3*sd1, mean2 - 3*sd2);
    let high = Math.max(mean1 + 3*sd1, mean2 + 3*sd2);
    
    while (high - low > 0.01) {
        const mid = (low + high) / 2;
        const {tpr, fpr} = calculateRates(mid, mean1, sd1, mean2, sd2);
        
        if (Math.abs(tpr - targetTPR) + Math.abs(fpr - targetFPR) < 0.01) {
            return mid;
        }
        
        if (tpr > targetTPR) {
            low = mid;
        } else {
            high = mid;
        }
    }
    
    return (low + high) / 2;
}

// Function to update plots
function updatePlots() {
    const mean1 = parseFloat(d3.select("#mean1").property("value"));
    const sd1 = parseFloat(d3.select("#sd2").property("value"));
    const mean2 = parseFloat(d3.select("#mean2").property("value"));
    const sd2 = parseFloat(d3.select("#sd2").property("value"));
    const threshold = parseFloat(d3.select("#threshold").property("value"));

    // Update threshold value display
    d3.select("#thresholdValue").text(threshold.toFixed(1));

    // Update x-scale domain
    const xMin = Math.min(mean1 - 3*sd1, mean2 - 3*sd2, threshold);
    const xMax = Math.max(mean1 + 3*sd1, mean2 + 3*sd2, threshold);
    xScale.domain([xMin, xMax]);

    // Generate distribution data
    const points = d3.range(xMin, xMax, 0.01);
    const dist1Data = points.map(x => ({x, y: normalDist(x, mean1, sd1)}));
    const dist2Data = points.map(x => ({x, y: normalDist(x, mean2, sd2)}));

    // Update y-scale domain
    const yMax = Math.max(d3.max(dist1Data, d => d.y), d3.max(dist2Data, d => d.y));
    yScale.domain([0, yMax]);

    // Update axes
    distributionSvg.select(".x-axis").call(xAxis);
    distributionSvg.select(".y-axis").call(yAxis);

    // Draw distribution curves
    const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));

    distributionSvg.selectAll(".dist1").remove();
    distributionSvg.selectAll(".dist2").remove();

    distributionSvg.append("path")
        .datum(dist1Data)
        .attr("class", "dist1")
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("stroke-width", 2)
        .attr("d", line);

    distributionSvg.append("path")
        .datum(dist2Data)
        .attr("class", "dist2")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", line);

// Add these variables at the top of your script
let currentThreshold;
let isUpdating = false;

// In the updatePlots function, replace the threshold line drawing code with this:

// Remove existing threshold elements
distributionSvg.selectAll(".threshold, .threshold-handle, .threshold-touch-area").remove();

// Create a group for the threshold elements
const thresholdGroup = distributionSvg.append("g")
    .attr("class", "threshold-group")
    .attr("cursor", "ew-resize");

// Add an invisible, wider touch area
thresholdGroup.append("rect")
    .attr("class", "threshold-touch-area")
    .attr("x", -15)
    .attr("y", 0)
    .attr("width", 30)
    .attr("height", height)
    .attr("fill", "transparent");

// Draw the threshold line
const thresholdLine = thresholdGroup.append("line")
    .attr("class", "threshold")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", height)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

// Add a handle to the threshold line
const thresholdHandle = thresholdGroup.append("circle")
    .attr("class", "threshold-handle")
    .attr("cx", 0)
    .attr("cy", height / 2)
    .attr("r", 8)
    .attr("fill", "#007fff");

currentThreshold = threshold;

// Function to update threshold position
function updateThresholdPosition(newX) {
    const newThreshold = Math.max(xMin, Math.min(xMax, xScale.invert(newX)));
    currentThreshold = newThreshold;
    requestAnimationFrame(() => {
        thresholdGroup.attr("transform", `translate(${xScale(newThreshold)}, 0)`);
        d3.select("#thresholdValue").text(newThreshold.toFixed(2));
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced update function
const debouncedUpdate = debounce(() => {
    if (!isUpdating) {
        isUpdating = true;
        d3.select("#threshold").property("value", currentThreshold);
        updatePlots();
        isUpdating = false;
    }
}, 100);

// Add both mouse and touch event listeners
const drag = d3.drag()
    .on("start", function() {
        thresholdLine.attr("stroke-width", 4);
        thresholdHandle.attr("r", 10);
    })
    .on("drag", function(event) {
        updateThresholdPosition(event.x);
        debouncedUpdate();
    })
    .on("end", function() {
        thresholdLine.attr("stroke-width", 2);
        thresholdHandle.attr("r", 8);
        d3.select("#threshold").property("value", currentThreshold);
        updatePlots();
    });

thresholdGroup.call(drag);

// Add touch events for mobile
thresholdGroup
    .on("touchstart", function() {
        thresholdLine.attr("stroke-width", 4);
        thresholdHandle.attr("r", 10);
    })
    .on("touchmove", function(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const newX = touch.clientX - distributionSvg.node().getBoundingClientRect().left;
        updateThresholdPosition(newX);
        debouncedUpdate();
    })
    .on("touchend", function() {
        thresholdLine.attr("stroke-width", 2);
        thresholdHandle.attr("r", 8);
        d3.select("#threshold").property("value", currentThreshold);
        updatePlots();
    });

// Update threshold position initially
updateThresholdPosition(xScale(threshold));

    // Calculate ROC curve
    const rocPoints = d3.range(xMin, xMax, 0.01).map(t => {
        const {tpr, fpr} = calculateRates(t, mean1, sd1, mean2, sd2);
        return {
            x: Math.max(0, Math.min(1, showFPR ? fpr : 1 - fpr)),
            y: Math.max(0, Math.min(1, tpr))
        };
    });

    // Draw ROC curve
    rocSvg.selectAll(".roc").remove();
    rocSvg.append("path")
        .datum(rocPoints)
        .attr("class", "roc")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => rocXScale(d.x))
            .y(d => rocYScale(d.y))
        );

    // Draw current point on ROC curve (now interactive)
    const {tpr, fpr} = calculateRates(threshold, mean1, sd1, mean2, sd2);
    rocSvg.selectAll(".rocPoint").remove();
    rocSvg.append("circle")
        .attr("class", "rocPoint")
        .attr("cx", rocXScale(Math.max(0, Math.min(1, showFPR ? fpr : 1 - fpr))))
        .attr("cy", rocYScale(Math.max(0, Math.min(1, tpr))))
        .attr("r", 10)
        .attr("fill", "#007fFf")
        // .attr("cursor", "pointer")
        .on("mouseover", function() {
            d3.select(this).attr("r", 10);
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 10);
        });

    // // // Make ROC curve interactive
    // rocSvg.append("rect")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .attr("fill", "none")
    //     .attr("pointer-events", "all")
    //     .on("click", function(event) {
    //         const [x, y] = d3.pointer(event);
    //         const newFPR = rocXScale.invert(x);
    //         const newTPR = rocYScale.invert(y);
            
    //         // Find the threshold that corresponds to this point on the ROC curve
    //         const newThreshold = findThresholdForROCPoint(newFPR, newTPR, mean1, sd1, mean2, sd2);
            
    //         d3.select("#threshold").property("value", newThreshold);
    //         updatePlots();
    //     });

    // Update x-axis label
    rocSvg.select(".x-label")
        .text(showFPR ? "False Positive Rate (1-Specificity, Click to Swap)" : "Specificity (1-False Positive Rate, Click to Swap)");
}

// Add event listeners
d3.select("#mean1").on("input", updatePlots);
d3.select("#sd1").on("input", updatePlots);
d3.select("#mean2").on("input", updatePlots);
d3.select("#sd2").on("input", updatePlots);
d3.select("#threshold").on("input", updatePlots);
d3.select("#toggleAxis").on("click", () => {
    showFPR = !showFPR;
    updatePlots();
});
// Update SVG sizes
d3.selectAll(".plot svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${size} ${size}`);// Initial plot rendering
updatePlots();
