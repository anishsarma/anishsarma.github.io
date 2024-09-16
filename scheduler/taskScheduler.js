// // Global chart instance
// let chartInstance = null;

// // Helper function to convert "6am", "7pm", etc. into hours (0-24 range)
// function timeTo24Hr(timeStr) {
//     let [time, period] = timeStr.match(/[a-z]+|[^a-z]+/gi);
//     let [hour, minute] = time.split(":").map(Number);
//     minute = minute || 0;
//     if (period === "pm" && hour < 12) hour += 12;
//     if (period === "am" && hour === 12) hour = 0;
//     return hour + minute / 60;
// }

// // Parse waking hours input and return a [start, end] array in 24-hour format
// function parseWakingHours(wakingHours) {
//     const [start, end] = wakingHours.split('-').map(timeTo24Hr);
//     return [start, end];
// }

// // Parse meal times input and return array of times in 24-hour format
// function parseMealTimes(mealTimes) {
//     return mealTimes.split(',').map(timeTo24Hr);
// }

// // Sample task data structure, can be expanded to user-defined tasks
// let tasks = [
//     { type: 'A', frequency: 3, minSpacing: 5, y: 1 },  // Task A (y = 1)
//     { type: 'B', mealDependent: true, y: 2 },          // Task B (y = 2)
//     { type: 'C', dayBoundary: true, y: 3 }             // Task C (y = 3)
// ];

// // Task colors
// let taskColors = { 'A': 'red', 'B': 'green', 'C': 'blue' };

// // Function to schedule tasks based on constraints
// function scheduleTasks() {
//     // Get user inputs
//     let wakingHours = parseWakingHours(document.getElementById("wakingHours").value);
//     let mealTimes = parseMealTimes(document.getElementById("mealTimes").value);

//     // Initialize chart data
//     let dataPoints = [];

//     // Schedule Task C at the beginning and end of the day
//     tasks.filter(task => task.type === 'C').forEach(task => {
//         dataPoints.push({ x: wakingHours[0], y: task.y, type: task.type });
//         dataPoints.push({ x: wakingHours[1], y: task.y, type: task.type });
//     });

//     // Schedule Task A with optimal timing (waking time and after meals)
//     tasks.filter(task => task.type === 'A').forEach(task => {
//         let spacing = task.minSpacing;
//         let scheduledTimes = [];
        
//         // First Task A at wake time to minimize additional events
//         scheduledTimes.push(wakingHours[0]);
//         dataPoints.push({ x: wakingHours[0], y: task.y, type: task.type });
        
//         // Subsequent Task A instances after meals, if spacing constraints allow
//         mealTimes.forEach(mealTime => {
//             let lastScheduled = scheduledTimes[scheduledTimes.length - 1];
//             if (mealTime >= lastScheduled + spacing && mealTime < wakingHours[1]) {
//                 scheduledTimes.push(mealTime);
//                 dataPoints.push({ x: mealTime, y: task.y, type: task.type });
//             }
//         });

//         // If there's still a need for more Task A instances, schedule additional ones
//         while (scheduledTimes.length < task.frequency) {
//             let lastScheduled = scheduledTimes[scheduledTimes.length - 1];
//             let nextTime = lastScheduled + spacing;
//             if (nextTime < wakingHours[1]) {
//                 scheduledTimes.push(nextTime);
//                 dataPoints.push({ x: nextTime, y: task.y, type: task.type });
//             } else {
//                 break;
//             }
//         }
//     });

//     // Schedule Task B after meal times
//     tasks.filter(task => task.type === 'B').forEach(task => {
//         mealTimes.forEach(mealTime => {
//             dataPoints.push({ x: mealTime + 1, y: task.y, type: task.type }); // Task B after meal by 1 hour
//         });
//     });

//     // Plot the schedule
    
//     plotSchedule(dataPoints, wakingHours, mealTimes);
// }
// // Function to plot the schedule using Chart.js with fade-in effect for data points
// function plotSchedule(dataPoints, wakingHours, mealTimes) {
//     window.alert('Plot Schedule mentioned!')
//     const ctx = document.getElementById('scheduleChart').getContext('2d');

//     // If a chart already exists, destroy it before creating a new one
//     if (chartInstance !== null) {
//         chartInstance.destroy();
//     }

//     // Map data points to datasets
//     const datasets = dataPoints.map((point) => ({
//         label: `Task ${point.type}`,
//         data: [{ x: point.x, y: point.y }],
//         backgroundColor: `rgba(${hexToRgb(taskColors[point.type])}, 0)`, // Start fully transparent
//         pointRadius: 10,
//         showLine: false,
//     }));

//     // Create the chart instance
//     chartInstance = new Chart(ctx, {
//         type: 'scatter',
//         data: {
//             datasets: datasets
//         },
//         options: {
//             scales: {
//                 x: {
//                     type: 'linear',
//                     min: 0,
//                     max: 24,
//                     ticks: {
//                         callback: function (value) {
//                             return value <= 12 ? `${value}am` : `${value - 12}pm`;
//                         }
//                     },
//                     title: {
//                         display: true,
//                         text: 'Time of Day (Hours)'
//                     }
//                 },
//                 y: {
//                     min: 0,
//                     max: 4,
//                     ticks: {
//                         stepSize: 1,
//                         callback: function (value) {
//                             return `Task ${value}`;
//                         }
//                     },
//                     title: {
//                         display: true,
//                         text: 'Tasks'
//                     }
//                 }
//             },
//             plugins: {
//                 annotation: {
//                     annotations: {
//                         // Sleep hours shading
//                         sleep: {
//                             type: 'box',
//                             xMin: 0,
//                             xMax: wakingHours[0],
//                             backgroundColor: 'rgba(100, 100, 100, 0.2)'
//                         },
//                         sleep2: {
//                             type: 'box',
//                             xMin: wakingHours[1],
//                             xMax: 24,
//                             backgroundColor: 'rgba(100, 100, 100, 0.2)'
//                         },
//                         // Meal times
//                         ...mealTimes.reduce((acc, mealTime, index) => ({
//                             ...acc,
//                             [`meal${index}`]: {
//                                 type: 'line',
//                                 xMin: mealTime,
//                                 xMax: mealTime,
//                                 borderColor: 'black',
//                                 borderWidth: 2,
//                                 label: {
//                                     content: `Meal ${index + 1}`,
//                                     enabled: true,
//                                     position: 'top'
//                                 }
//                             }
//                         }), {})
//                     }
//                 }
//             },
//             // Disable the default fly-in animation for the points
//             animation: {
//                 duration: 0
//             }
//         }
//     });

//     // Fade-in effect for the data points
//     setTimeout(() => {
//         chartInstance.data.datasets.forEach((dataset, index) => {
//             // Update the dataset backgroundColor to full opacity
//             dataset.backgroundColor = taskColors[dataPoints[index].type]; // Full color after fade
//         });

//         chartInstance.update({
//             duration: 10000, // Fade-in animation duration
//             easing: 'easeInOutQuad', // Smooth easing
//         });
//     }, 1000); // Slight delay to render the chart first
// }


// // Helper function to convert hex color to rgb
// function hexToRgb(hex) {
//     // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
//     let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
//     hex = hex.replace(shorthandRegex, function (m, r, g, b) {
//         return r + r + g + g + b + b;
//     });

//     let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
// }
// // Automatically schedule tasks when the page loads
// window.onload = function() {
//     scheduleTasks();
// };
