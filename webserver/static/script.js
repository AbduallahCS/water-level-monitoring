const client = mqtt.connect('ws://64.226.73.184:9001');
const levels = [];
const timestamps = [];
const MAX_DATA_POINTS = 20; // Limit data points to prevent lag

let chart = null;

// Initialize Chart directly (if the script is placed after the canvas tag)
const ctx = document.getElementById('liquidChart').getContext('2d');
chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: timestamps,
        datasets: [{
            label: 'Liquid Level (%)',
            data: levels,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.3,
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { min: 0, max: 100 }
        },
        animation: { duration: 0 } // Disable animation for real-time updates
    }
});

// MQTT Connection
client.on('connect', () => {
    console.log('✅ Connected to MQTT');
    client.subscribe('/MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDQc/sensors/ultrasonic/distance');
});

// Handle Incoming Data
client.on('message', (topic, message) => {
    const level = parseFloat(message.toString());
    if (isNaN(level)) return; // Skip invalid data

    const time = new Date().toLocaleTimeString();

    // Add new data
    levels.push(level);
    timestamps.push(time);

    // Remove oldest data if exceeding limit
    if (levels.length > MAX_DATA_POINTS) {
        levels.shift();
        timestamps.shift();
    }

    updateLiquidDisplay(level);
    updateChart(); // Refresh graph
});

// Update Liquid Level Display
function updateLiquidDisplay(level) {
    const bar = document.getElementById('liquidBar');
    const label = document.getElementById('liquidLevel');
    const warningBox = document.getElementById('warningBox');
    const emergencyBox = document.getElementById('emergencyBox');
    const alarm = document.getElementById('alarmSound');

    bar.style.height = `${level}%`;
    label.innerText = `${level}%`;

    // Normal warning at >90%
    if (level > 90 && level <= 95) {
        warningBox.style.display = "block";
        emergencyBox.style.display = "none";
        alarm.pause();
        alarm.currentTime = 0;
    }
    // Emergency warning at >99%
    else if (level > 95) {
        warningBox.style.display = "none";
        emergencyBox.style.display = "block";

        if (alarm.paused) {
            alarm.play();
        }

        stopWaterFlow(); // Simulate stopping the water
    } else {
        warningBox.style.display = "none";
        emergencyBox.style.display = "none";
        alarm.pause();
        alarm.currentTime = 0;
    }
}

// Force Chart Update
function updateChart() {
    if (!chart) return; // Skip if chart isn't ready

    // Explicitly update data
    chart.data.labels = [...timestamps]; // Spread operator ensures new array
    chart.data.datasets[0].data = [...levels];

    chart.update(); // Re-render
}

// Simulate stopping the water flow
function stopWaterFlow() {
    console.log("🚨 Emergency: Stopping the water flow!");
    // Add logic to stop the water flow here
}