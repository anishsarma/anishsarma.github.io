const margin = {top: 20, right: 20, bottom: 40, left: 40};
const width = 400 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

let showFPR = true;

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
    .text("False Positive Rate");

rocSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${-margin.left + 15},${height/2}) rotate(-90)`)
    .text("True Positive Rate");

// Function to calculate normal distribution
function normalDist(x, mean, sd) {
    return 1 / (sd * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
}

// Function to calculate TPR and FPR
function calculateRates(threshold, mean1, sd1, mean2, sd2) {
    const tpr = 1 - math.erf((threshold - mean2) / (Math.sqrt(2) * sd2)) / 2;
    const fpr = 1 - math.erf((threshold - mean1) / (Math.sqrt(2) * sd1)) / 2;
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
    const sd1 = parseFloat(d3.select("#sd1").property("value"));
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
    const points = d3.range(xMin, xMax, 0.1);
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
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("d", line);

    distributionSvg.append("path")
        .datum(dist2Data)
        .attr("class", "dist2")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Draw threshold line (now draggable)
    distributionSvg.selectAll(".threshold").remove();
    const thresholdLine = distributionSvg.append("line")
        .attr("class", "threshold")
        .attr("x1", xScale(threshold))
        .attr("y1", 0)
        .attr("x2", xScale(threshold))
        .attr("y2", height)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("cursor", "ew-resize")
        .on("mouseover", function() {
            d3.select(this).attr("stroke-width", 4);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-width", 2);
        })
        .call(d3.drag()
            .on("drag", function(event) {
                const newThreshold = xScale.invert(event.x);
                d3.select("#threshold").property("value", newThreshold);
                updatePlots();
            })
        );

    // Calculate ROC curve
    const rocPoints = d3.range(xMin, xMax, 0.1).map(t => {
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
        .attr("stroke", "purple")
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
        .attr("r", 5)
        .attr("fill", "green")
        .attr("cursor", "pointer")
        .on("mouseover", function() {
            d3.select(this).attr("r", 7);
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 5);
        });

    // Make ROC curve interactive
    rocSvg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("click", function(event) {
            const [x, y] = d3.pointer(event);
            const newFPR = rocXScale.invert(x);
            const newTPR = rocYScale.invert(y);
            
            // Find the threshold that corresponds to this point on the ROC curve
            const newThreshold = findThresholdForROCPoint(newFPR, newTPR, mean1, sd1, mean2, sd2);
            
            d3.select("#threshold").property("value", newThreshold);
            updatePlots();
        });

    // Update x-axis label
    rocSvg.select(".x-label")
        .text(showFPR ? "False Positive Rate" : "Specificity");
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

// Initial plot rendering
updatePlots();