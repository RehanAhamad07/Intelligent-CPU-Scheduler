let processCounter = 1;

// Add a new process input field
function addProcess() {
    processCounter++;
    const processInputs = document.getElementById("processInputs");
    const newProcess = document.createElement("div");
    newProcess.className = "process";
    newProcess.innerHTML = `
        <label>Process ID: <span class="pid">${processCounter}</span></label>
        <label>Arrival Time: <input type="number" class="arrivalTime" min="0" value="0"></label>
        <label>Burst Time: <input type="number" class="burstTime" min="1" value="1"></label>
        <label>Priority: <input type="number" class="priority" min="1" value="1"></label>
    `;
    processInputs.appendChild(newProcess);
}

// Remove the last process input field
function removeProcess() {
    if (processCounter > 1) {
        const processInputs = document.getElementById("processInputs");
        processInputs.removeChild(processInputs.lastChild);
        processCounter--;
    }
}

// Enable/disable time quantum input based on algorithm selection
document.getElementById("algorithm").addEventListener("change", function () {
    const timeQuantumInput = document.getElementById("timeQuantum");
    if (this.value === "RR") {
        timeQuantumInput.disabled = false;
    } else {
        timeQuantumInput.disabled = true;
    }
});

// Start simulation
function startSimulation() {
    console.log("Start Simulation button clicked!");

    const processes = []; // Local array to store process details
    const processInputs = document.querySelectorAll(".process");

    // Collect process details
    processInputs.forEach((process, index) => {
        const arrivalTime = parseInt(process.querySelector(".arrivalTime").value);
        const burstTime = parseInt(process.querySelector(".burstTime").value);
        const priority = parseInt(process.querySelector(".priority").value);
        processes.push({
            id: index + 1,
            arrivalTime,
            burstTime,
            priority,
        });
    });

    const algorithm = document.getElementById("algorithm").value;
    const timeQuantum = parseInt(document.getElementById("timeQuantum").value);

    console.log("Processes:", processes);
    console.log("Algorithm:", algorithm);
    console.log("Time Quantum:", timeQuantum);

    // Call the appropriate scheduling algorithm
    let schedule;
    switch (algorithm) {
        case "FCFS":
            schedule = fcfsScheduling(processes);
            break;
        case "SJF":
            schedule = sjfScheduling(processes);
            break;
        case "RR":
            schedule = roundRobinScheduling(processes, timeQuantum);
            break;
        case "Priority":
            schedule = priorityScheduling(processes);
            break;
        default:
            console.error("Invalid algorithm selected.");
            return;
    }

    // Update Gantt chart and metrics
    updateGanttChart(schedule);
    updateMetrics(schedule, processes); // Pass the processes array to updateMetrics
}

// FCFS Scheduling Algorithm
function fcfsScheduling(processes) {
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    const schedule = [];

    processes.forEach(process => {
        const startTime = Math.max(currentTime, process.arrivalTime);
        const endTime = startTime + process.burstTime;
        schedule.push({
            id: process.id,
            startTime,
            endTime,
        });
        currentTime = endTime;
    });

    return schedule;
}

// SJF Scheduling Algorithm (Non-Preemptive)
function sjfScheduling(processes) {
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    const schedule = [];
    const queue = [...processes];

    while (queue.length > 0) {
        // Find the process with the shortest burst time that has arrived
        const availableProcesses = queue.filter(p => p.arrivalTime <= currentTime);
        if (availableProcesses.length === 0) {
            currentTime = queue[0].arrivalTime; // Jump to the next process arrival time
            continue;
        }

        availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
        const process = availableProcesses[0];

        const startTime = Math.max(currentTime, process.arrivalTime);
        const endTime = startTime + process.burstTime;
        schedule.push({
            id: process.id,
            startTime,
            endTime,
        });
        currentTime = endTime;

        // Remove the scheduled process from the queue
        queue.splice(queue.indexOf(process), 1);
    }

    return schedule;
}

// Round Robin Scheduling Algorithm
function roundRobinScheduling(processes, timeQuantum) {
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    const schedule = [];
    const queue = [...processes];
    const remainingTime = processes.map(p => p.burstTime);

    while (queue.length > 0) {
        const process = queue.shift();
        const index = processes.indexOf(process);

        if (remainingTime[index] > 0) {
            const startTime = currentTime;
            const executionTime = Math.min(remainingTime[index], timeQuantum);
            const endTime = startTime + executionTime;
            schedule.push({
                id: process.id,
                startTime,
                endTime,
            });
            currentTime = endTime;
            remainingTime[index] -= executionTime;

            // Re-add the process to the queue if it still has remaining time
            if (remainingTime[index] > 0) {
                queue.push(process);
            }
        }
    }

    return schedule;
}

// Priority Scheduling Algorithm (Non-Preemptive)
function priorityScheduling(processes) {
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    const schedule = [];
    const queue = [...processes];

    while (queue.length > 0) {
        // Find the process with the highest priority (lowest priority number) that has arrived
        const availableProcesses = queue.filter(p => p.arrivalTime <= currentTime);
        if (availableProcesses.length === 0) {
            currentTime = queue[0].arrivalTime; // Jump to the next process arrival time
            continue;
        }

        availableProcesses.sort((a, b) => a.priority - b.priority);
        const process = availableProcesses[0];

        const startTime = Math.max(currentTime, process.arrivalTime);
        const endTime = startTime + process.burstTime;
        schedule.push({
            id: process.id,
            startTime,
            endTime,
        });
        currentTime = endTime;

        // Remove the scheduled process from the queue
        queue.splice(queue.indexOf(process), 1);
    }

    return schedule;
}

// Update Gantt Chart
function updateGanttChart(schedule) {
    const ganttChart = document.getElementById("ganttChart");
    ganttChart.innerHTML = "";

    schedule.forEach(entry => {
        // Create a bar for the process execution
        const bar = document.createElement("div");
        bar.className = "gantt-bar running";
        bar.style.width = `${(entry.endTime - entry.startTime) * 50}px`; // Scale for visualization
        bar.innerText = `P${entry.id} (${entry.startTime}-${entry.endTime})`;
        ganttChart.appendChild(bar);

        // Add waiting time (if any)
        if (entry.startTime > (schedule[entry.id - 2]?.endTime || 0)) {
            const waitingBar = document.createElement("div");
            waitingBar.className = "gantt-bar waiting";
            waitingBar.style.width = `${(entry.startTime - (schedule[entry.id - 2]?.endTime || 0)) * 50}px`;
            waitingBar.innerText = `Wait (${schedule[entry.id - 2]?.endTime || 0}-${entry.startTime})`;
            ganttChart.appendChild(waitingBar);
        }
    });
}

// Update Performance Metrics
function updateMetrics(schedule, processes) {
    console.log("Processes:", processes); // Debugging statement
    console.log("Schedule:", schedule); // Debugging statement

    // Calculate waiting time and turnaround time
    const waitingTimes = [];
    const turnaroundTimes = [];

    schedule.forEach(entry => {
        const process = processes.find(p => p.id === entry.id);
        if (process) {
            const waitingTime = entry.startTime - process.arrivalTime;
            const turnaroundTime = entry.endTime - process.arrivalTime;
            waitingTimes.push(waitingTime);
            turnaroundTimes.push(turnaroundTime);
        }
    });

    // Calculate average waiting time and turnaround time
    const avgWaitingTime = waitingTimes.reduce((sum, wt) => sum + wt, 0) / waitingTimes.length;
    const avgTurnaroundTime = turnaroundTimes.reduce((sum, tt) => sum + tt, 0) / turnaroundTimes.length;

    // Calculate throughput
    const throughput = schedule.length / schedule[schedule.length - 1].endTime;

    // Update the UI
    document.getElementById("avgWaitingTime").textContent = avgWaitingTime.toFixed(2);
    document.getElementById("avgTurnaroundTime").textContent = avgTurnaroundTime.toFixed(2);
    document.getElementById("throughput").textContent = throughput.toFixed(2);
}