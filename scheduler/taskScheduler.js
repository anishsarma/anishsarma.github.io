// Helper function to convert "6am", "7pm", etc. into hours (0-24 range)
function timeTo24Hr(timeStr) {
    let [time, period] = timeStr.match(/[a-z]+|[^a-z]+/gi);
    let [hour, minute] = time.split(":").map(Number);
    minute = minute || 0;
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour + minute / 60;
}

// Parse waking hours input and return a [start, end] array in 24-hour format
function parseWakingHours(wakingHours) {
    const [start, end] = wakingHours.split('-').map(timeTo24Hr);
    return [start, end];
}

// Parse meal times input and return array of times in 24-hour format
function parseMealTimes(mealTimes) {
    return mealTimes.split(',').map(timeTo24Hr);
}

// Sample task data structure, can be expanded to user-defined tasks
let tasks = [
    { type: 'A', frequency: 3, minSpacing: 5, y: 1 },  // Task A (y = 1)
    { type: 'B', mealDependent: true, y: 2 },          // Task B (y = 2)
    { type: 'C', dayBoundary: true, y: 3 }             // Task C (y = 3)
];

// Function to schedule tasks based on constraints
function scheduleTasks() {
    // Get user inputs
    let wakingHours = parseWakingHours(document.getElementById("wakingHours").value);
    let mealTimes = parseMealTimes(document.getElementById("mealTimes").value);

    // Initialize chart data
    let dataPoints = [];
    let taskColors = { 'A': 'red', 'B': 'green', 'C': 'blue' };

    // Schedule Task C at the beginning and end of the day
    tasks.filter(task => task.type === 'C').forEach(task => {
        dataPoints.push({ x: wakingHours[0], y: task.y, type: task.type });
        dataPoints.push({ x: wakingHours[1], y: task.y, type: task.type });
    });

    // Schedule Task A (spacing at least 5 hours apart)
    tasks.filter(task => task.type === 'A').forEach(task => {
        let firstTaskTime = wakingHours[0] + 1; // Schedule 1 hour after waking up
        let spacing = task.minSpacing;
        for (let i = 0; i < task.frequency; i++) {
            let taskTime = firstTaskTime + i * spacing;
            if (taskTime < wakingHours[1]) {
                dataPoints.push({ x: taskTime, y: task.y, type: task.type });
            }
        }
    });

    // Schedule Task B after meal times
    tasks.filter(task => task.type === 'B').forEach(task => {
        mealTimes.forEach(mealTime => {
            dataPoints.push({ x: mealTime + 1, y: task.y, type: task.type }); // Task B after meal by 1 hour
        });
    });

    // Plot the schedule
    plotSchedule(dataPoints, wakingHours, mealTimes);
}

// Function to plot the schedule using Chart.js
function plotSchedule(dataPoints, wakingHours, mealTimes) {
    const ctx = document.getElementById('scheduleChart').getContext('2d');

    const datasets = dataPoints.map((point) => ({
        label: `Task ${point.type}`,
        data: [{ x: point.x, y: point.y }],
        backgroundColor: taskColors[point.type],
        pointRadius: 5,
        showLine: false
    }));

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 24,
                    ticks: {
                        callback: function (value) {
                            return value < 12 ? `${value}am` : `${value - 12}pm`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time of Day (Hours)'
                    }
                },
                y: {
                    min: 0,
                    max: 4,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            return `Task ${value}`;
                        }
                    },
                    title: {
                        display: true,
                        text: 'Tasks'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        // Sleep hours shading
                        sleep: {
                            type: 'box',
                            xMin: 0,
                            xMax: wakingHours[0],
                            backgroundColor: 'rgba(100, 100, 100, 0.2)'
                        },
                        sleep2: {
                            type: 'box',
                            xMin: wakingHours[1],
                            xMax: 24,
                            backgroundColor: 'rgba(100, 100, 100, 0.2)'
                        },
                        // Meal times
                        ...mealTimes.reduce((acc, mealTime, index) => ({
                            ...acc,
                            [`meal${index}`]: {
                                type: 'line',
                                xMin: mealTime,
                                xMax: mealTime,
                                borderColor: 'black',
                                borderWidth: 2,
                                label: {
                                    content: `Meal ${index + 1}`,
                                    enabled: true,
                                    position: 'top'
                                }
                            }
                        }), {})
                    }
                }
            }
        }
    });
}
