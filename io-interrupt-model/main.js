import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Simulation logic
    const btnPolling = document.getElementById('btn-polling');
    const btnInterrupt = document.getElementById('btn-interrupt');
    const btnReset = document.getElementById('btn-reset');

    const terminalOutput = document.getElementById('terminal-output');
    const timelineContainer = document.getElementById('event-timeline');
    const timelineEmpty = timelineContainer.querySelector('.empty-state');

    const nodes = {
        app: document.getElementById('node-app'),
        os: document.getElementById('node-os'),
        driver: document.getElementById('node-driver'),
        controller: document.getElementById('node-controller'),
        device: document.getElementById('node-device'),
        memory: document.getElementById('node-memory')
    };

    const uiState = {
        cpu: document.getElementById('cpu-state'),
        dev: document.getElementById('dev-state'),
        ctrlStatus: document.getElementById('controller-status')
    };

    let isRunning = false;
    let events = [];
    const statusOverlay = document.getElementById('status-overlay');

    function setOverlay(text, state = "normal") {
        if (!statusOverlay) return;
        statusOverlay.textContent = text;
        statusOverlay.className = 'status-overlay'; // reset
        if (state !== "normal") {
            statusOverlay.classList.add(state);
        }
    }

    function logTerminal(message, type = "sys") {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric", fractionalSecondDigits: 3 });
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `[${time}] ${message}`;
        terminalOutput.appendChild(entry);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;

        events.push({ time, message, type });
        updateTimeline();
    }

    function updateTimeline() {
        if (timelineEmpty) timelineEmpty.style.display = 'none';
        timelineContainer.innerHTML = '';
        events.forEach(ev => {
            const item = document.createElement('div');
            item.className = `tl-item ${ev.type === 'intr' ? 'intr' : ''}`;
            item.innerHTML = `
                <div class="tl-time">${ev.time}</div>
                <div class="tl-content">${ev.message}</div>
            `;
            timelineContainer.appendChild(item);
        });
    }

    function setActiveNode(nodeName) {
        Object.values(nodes).forEach(n => n.classList.remove('active-node'));
        if (nodeName && nodes[nodeName]) {
            nodes[nodeName].classList.add('active-node');
        }
    }

    function updateMetrics(cpuClass, cpuText, devClass, devText) {
        if (cpuText) {
            uiState.cpu.className = `value state-${cpuClass}`;
            uiState.cpu.textContent = cpuText;
        }
        if (devText) {
            uiState.dev.className = `value state-${devClass}`;
            uiState.dev.textContent = devText;
        }
    }

    function setControllerStatus(text, show) {
        uiState.ctrlStatus.textContent = text;
        if (show) uiState.ctrlStatus.classList.add('show');
        else uiState.ctrlStatus.classList.remove('show');
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Animation function
    function createParticle(startNode, endNode, type = "normal", duration = 800) {
        return new Promise(resolve => {
            const layer = document.getElementById('animation-layer');
            const particle = document.createElement('div');
            particle.className = `particle ${type}`;
            layer.appendChild(particle);

            const startBcr = startNode.getBoundingClientRect();
            const endBcr = endNode.getBoundingClientRect();
            const layerBcr = layer.getBoundingClientRect();

            const startX = startBcr.left + startBcr.width / 2 - layerBcr.left;
            const startY = startBcr.top + startBcr.height / 2 - layerBcr.top;
            const endX = endBcr.left + endBcr.width / 2 - layerBcr.left;
            const endY = endBcr.top + endBcr.height / 2 - layerBcr.top;

            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;

            // Animate
            particle.animate([
                { left: `${startX}px`, top: `${startY}px` },
                { left: `${endX}px`, top: `${endY}px` }
            ], {
                duration: duration,
                easing: 'ease-in-out'
            }).onfinish = () => {
                particle.remove();
                resolve();
            };
        });
    }

    async function flowPolled() {
        if (isRunning) return;
        isRunning = true;
        setButtons(false);
        setOverlay("Initiating Polling I/O Request...", "attention");
        logTerminal("Initiating Polling Sequence...", "sys");
        updateMetrics('busy', 'Executing App', 'idle', 'Idle');

        // App -> OS
        setActiveNode('app');
        await sleep(500);
        await createParticle(nodes.app, nodes.os);
        setOverlay("Application traps into OS via System Call");
        logTerminal("Syscall: I/O Read Request", "ok");

        // OS -> Driver
        setActiveNode('os');
        updateMetrics('busy', 'Kernel Mode', null, null);
        await sleep(500);
        await createParticle(nodes.os, nodes.driver);

        // Driver -> Controller
        setActiveNode('driver');
        await sleep(400);
        await createParticle(nodes.driver, nodes.controller);
        logTerminal("Driver issues command to Controller", "ok");

        // Controller -> Device (Starts working)
        setActiveNode('controller');
        setOverlay("Device begins reading data from hardware", "attention");
        updateMetrics(null, null, 'busy', 'Processing');
        setControllerStatus("Busy", true);
        await createParticle(nodes.controller, nodes.device);
        setActiveNode('device');

        // CPU starts polling
        setOverlay("CPU actively busy-waits, polling controller status...", "critical");
        updateMetrics('polling', 'Polling (Wait loop)', null, null);
        for (let i = 0; i < 3; i++) {
            logTerminal(`CPU Polling: checking device register (attempt ${i + 1})`, "poll");
            setActiveNode('driver');
            await createParticle(nodes.driver, nodes.controller, 'signal', 400);
            await createParticle(nodes.controller, nodes.driver, 'normal', 400);
            await sleep(300);
        }

        // Device finishes
        setControllerStatus("Ready / Data Available", true);
        logTerminal("Device operation complete.", "sys");
        updateMetrics(null, null, 'idle', 'Idle');

        // Final Poll succeeds
        setOverlay("Controller is ready! CPU reads data.", "normal");
        logTerminal(`CPU Polling: Status = Ready`, "ok");
        await createParticle(nodes.driver, nodes.controller, 'signal', 400);
        await createParticle(nodes.controller, nodes.driver, 'ok', 400);

        // Return to app
        setActiveNode('os');
        setOverlay("OS returns data to Application");
        await createParticle(nodes.driver, nodes.os);
        logTerminal("Data transferred to App buffer", "ok");
        setActiveNode('app');
        await createParticle(nodes.os, nodes.app);

        logTerminal("Operation completed successfully.", "sys");
        updateMetrics('idle', 'User Mode (Idle)', 'idle', 'Idle');
        setOverlay("Operation Complete. System Idle.");
        resetSim(false);
    }

    async function flowInterrupt() {
        if (isRunning) return;
        isRunning = true;
        setButtons(false);
        setOverlay("Initiating Async Interrupt-Driven I/O...", "attention");
        logTerminal("Initiating Interrupt-Driven Sequence...", "sys");
        updateMetrics('busy', 'Executing App', 'idle', 'Idle');

        // App -> OS
        setActiveNode('app');
        await sleep(500);
        await createParticle(nodes.app, nodes.os);
        setOverlay("Application traps into OS requesting Async I/O");
        logTerminal("Syscall: Asynchronous I/O Read", "ok");

        // OS -> Driver
        setActiveNode('os');
        updateMetrics('busy', 'Kernel Mode', null, null);
        await sleep(500);
        await createParticle(nodes.os, nodes.driver);
        logTerminal("Driver issues cmd, puts process to sleep", "ok");

        // Driver -> Controller
        setActiveNode('driver');
        await sleep(400);
        await createParticle(nodes.driver, nodes.controller);

        // Controller -> Device (Starts working)
        setActiveNode('controller');
        updateMetrics('busy', 'CPU Executing OTHER Proc', 'busy', 'Processing');
        setControllerStatus("Busy", true);
        await createParticle(nodes.controller, nodes.device);
        setActiveNode('device');

        // Wait while device operates and CPU does other things
        setOverlay("CPU sleeps this process and works on other tasks.", "normal");
        logTerminal("CPU context switches to other tasks...", "sys");
        await sleep(1500);
        logTerminal("Device operation complete.", "sys");
        setControllerStatus("Ready", true);

        // INTERRUPT triggered
        setOverlay("Hardware Interrupt Fired! Forcing CPU Context Switch.", "critical");
        logTerminal("HARDWARE INTERRUPT: Device sends signal!", "intr");
        updateMetrics('isr', 'Handling Interrupt (ISR)', 'idle', 'Idle');

        // Controller -> CPU
        setActiveNode('controller');
        await createParticle(nodes.controller, nodes.os, 'interrupt', 600);

        setActiveNode('os');
        logTerminal("Context Switch: CPU saves state & runs ISR", "sys");
        await sleep(800);

        // OS -> Driver handler
        await createParticle(nodes.os, nodes.driver);
        setActiveNode('driver');
        logTerminal("Driver Interrupt Handler retrieves data", "ok");
        await sleep(600);

        // Restore context
        setActiveNode('os');
        await createParticle(nodes.driver, nodes.os);
        logTerminal("Context Restored: waking up original app", "sys");
        updateMetrics('busy', 'User Mode', null, null);

        await createParticle(nodes.os, nodes.app);
        setActiveNode('app');

        logTerminal("Operation completed successfully.", "sys");
        updateMetrics('idle', 'User Mode (Idle)', 'idle', 'Idle');
        resetSim(false);
    }

    async function flowDMA() {
        if (isRunning) return;
        isRunning = true;
        setButtons(false);
        setOverlay("Initiating Direct Memory Access (DMA)...", "attention");
        logTerminal("Initiating DMA Sequence...", "sys");
        updateMetrics('busy', 'Executing App', 'idle', 'Idle');

        setActiveNode('app');
        await sleep(500);
        await createParticle(nodes.app, nodes.os);
        logTerminal("Syscall: DMA Bulk Read", "ok");

        setActiveNode('os');
        updateMetrics('busy', 'Kernel Mode', null, null);
        await sleep(500);
        await createParticle(nodes.os, nodes.driver);

        setActiveNode('driver');
        await sleep(400);
        await createParticle(nodes.driver, nodes.memory);
        setOverlay("Driver allocates and maps DMA buffer in RAM");
        logTerminal("OS maps DMA buffer in Main Memory", "sys");
        setActiveNode('memory');
        await sleep(400);

        await createParticle(nodes.driver, nodes.controller);
        logTerminal("Driver programs DMAC with physical addresses", "ok");

        setActiveNode('controller');
        setOverlay("Controller burst transfers data directly to RAM (CPU sleeping)", "normal");
        updateMetrics('idle', 'CPU Sleeps / Other App', 'busy', 'DMAC Transfer');
        setControllerStatus("Transferring...", true);
        await createParticle(nodes.controller, nodes.device);
        setActiveNode('device');

        logTerminal("Device begins burst transfer directly to RAM...", "sys");

        // Simulate DMA transfer bypassing CPU
        for (let i = 0; i < 4; i++) {
            await createParticle(nodes.device, nodes.memory, 'data', 500);
            setActiveNode('memory');
            await sleep(200);
        }

        setControllerStatus("Ready", true);
        logTerminal("Transfer complete.", "sys");

        setOverlay("DMA Transfer Complete! Firing single hardware interrupt.", "critical");
        logTerminal("HARDWARE INTERRUPT (Completion)", "intr");
        updateMetrics('isr', 'Handling Interrupt', 'idle', 'Idle');

        setActiveNode('controller');
        await createParticle(nodes.controller, nodes.os, 'interrupt', 600);

        setActiveNode('os');
        logTerminal("Context Switch: CPU runs ISR", "sys");
        await sleep(500);

        await createParticle(nodes.os, nodes.driver);
        setActiveNode('driver');
        logTerminal("Driver acknowledges DMA completion", "ok");
        await sleep(400);

        setActiveNode('os');
        await createParticle(nodes.driver, nodes.os);
        logTerminal("Process unblocked.", "sys");
        updateMetrics('busy', 'User Mode', null, null);

        await createParticle(nodes.os, nodes.app);
        setActiveNode('app');

        setOverlay("DMA Operation Complete. System Idle.");
        logTerminal("Operation completed.", "sys");
        updateMetrics('idle', 'User Mode (Idle)', 'idle', 'Idle');
        resetSim(false);
    }

    async function flowCoalescing() {
        if (isRunning) return;
        isRunning = true;
        setButtons(false);
        setOverlay("Simulating High-Throughput Network (Interrupt Coalescing)", "attention");
        logTerminal("Initiating Network Interrupt Coalescing...", "sys");
        updateMetrics('idle', 'User Mode', 'busy', 'Listening');

        setControllerStatus("Receiving...", true);
        setActiveNode('device');

        // Simulate multiple packets arriving fast
        for (let i = 1; i <= 5; i++) {
            logTerminal(`Network Packet ${i} arrived at NIC`, "sys");
            await createParticle(nodes.device, nodes.controller, 'data', 300);
            setActiveNode('controller');
            updateMetrics(null, null, 'busy', `Buffer: ${i} Pkts`);

            if (i < 5) logTerminal("Controller buffers packet (Delaying interrupt)", "ok");
            await sleep(300);
        }

        logTerminal("Coalescing Threshold hit (5 pkts or timeout).", "sys");
        setControllerStatus("Threshold Reached", true);

        // Trigger ONE interrupt for 5 packets
        setOverlay("Threshold reached! Firing ONE interrupt for 5 packets.", "critical");
        logTerminal("HARDWARE INTERRUPT: Firing single consolidated IRQ!", "intr");
        updateMetrics('isr', 'Handling Interrupt (ISR)', 'idle', 'Idle');

        await createParticle(nodes.controller, nodes.os, 'interrupt', 600);
        setActiveNode('os');
        logTerminal("Context Switch: CPU enters ISR", "sys");
        await sleep(600);

        await createParticle(nodes.os, nodes.driver);
        setActiveNode('driver');
        logTerminal("Driver processes all 5 packets in one batch (NAPI poll)", "ok");
        await sleep(800);

        setActiveNode('os');
        await createParticle(nodes.driver, nodes.os);
        logTerminal("Context Restored.", "sys");
        updateMetrics('busy', 'User Mode', null, null);

        await createParticle(nodes.os, nodes.app);
        setActiveNode('app');

        setOverlay("Coalescing Operation Complete. System Idle.");
        logTerminal("App received data.", "sys");
        updateMetrics('idle', 'User Mode (Idle)', 'idle', 'Idle');
        resetSim(false);
    }

    function setButtons(enabled) {
        btnPolling.disabled = !enabled;
        btnInterrupt.disabled = !enabled;
        const btnDma = document.getElementById('btn-dma');
        const btnCoal = document.getElementById('btn-coalescing');
        if (btnDma) btnDma.disabled = !enabled;
        if (btnCoal) btnCoal.disabled = !enabled;
    }

    function resetSim(clearLogs = true) {
        isRunning = false;
        setActiveNode(null);
        setControllerStatus("Idle", false);
        updateMetrics('idle', 'Idle', 'idle', 'Idle');
        setOverlay("System Idle. Select a flow to begin.");
        setButtons(true);
        if (clearLogs) {
            terminalOutput.innerHTML = '<div class="log-entry sys">> System Reset. Waiting for requests...</div>';
            events = [];
            timelineContainer.innerHTML = '';
            if (timelineEmpty) timelineEmpty.style.display = 'block';
            timelineContainer.appendChild(timelineEmpty);
        }
    }

    btnPolling.addEventListener('click', flowPolled);
    btnInterrupt.addEventListener('click', flowInterrupt);
    document.getElementById('btn-dma').addEventListener('click', flowDMA);
    document.getElementById('btn-coalescing').addEventListener('click', flowCoalescing);
    btnReset.addEventListener('click', () => resetSim(true));

    // --- Chart.js Initializations ---
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. CPU Utilization (Bar)
    new Chart(document.getElementById('chartCpuUtil'), {
        type: 'bar',
        data: {
            labels: ['Low', 'Medium', 'High', 'Mixed'],
            datasets: [
                { label: 'Polling', data: [98, 97, 95, 96], backgroundColor: '#ef4444' },
                { label: 'Interrupt-Driven', data: [12, 28, 48, 35], backgroundColor: '#8b5cf6' }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Utilization (%)' } } }
        }
    });

    // 2. Response Latency (Line)
    new Chart(document.getElementById('chartLatency'), {
        type: 'line',
        data: {
            labels: ['0%', '20%', '40%', '60%', '80%', '100%'],
            datasets: [
                { label: 'Polling', data: [2, 4, 15, 30, 50, 95], borderColor: '#ef4444', tension: 0.3, fill: false },
                { label: 'Interrupt-Driven', data: [2, 3, 5, 6, 7.5, 9], borderColor: '#8b5cf6', tension: 0.1, fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Latency (ms)' } } }
        }
    });

    // 3. Power Consumption (Bar)
    new Chart(document.getElementById('chartPower'), {
        type: 'bar',
        data: {
            labels: ['10 IOPS', '100 IOPS', '1K IOPS', '10K IOPS'],
            datasets: [
                { label: 'Polling', data: [9.4, 9.4, 9.5, 9.6], backgroundColor: '#ef4444' },
                { label: 'Interrupt-Driven', data: [1.2, 1.8, 2.8, 5.5], backgroundColor: '#10b981' }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 12, title: { display: true, text: 'Power (Watts)' } } }
        }
    });

    // 4. DMA vs PIO Throughput (Bar)
    new Chart(document.getElementById('chartThroughput'), {
        type: 'bar',
        data: {
            labels: ['4 KB', '64 KB', '256 KB', '1 MB'],
            datasets: [
                { label: 'PIO (Programmed I/O)', data: [40, 250, 600, 900], backgroundColor: '#f59e0b' },
                { label: 'DMA', data: [35, 1200, 4500, 8200], backgroundColor: '#06b6d4' }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Throughput (MB/s)' } } }
        }
    });
});
