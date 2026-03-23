# I/O System & Interrupt Handling Simulator

An interactive, conceptual execution model demonstrating how an Operating System handles I/O requests, contrasting Polling (Busy-Waiting) mechanisms against efficient, asynchronous Interrupt-Driven approaches. 

This project was built as an interactive companion piece for a research paper analyzing the I/O subsystem in modern operating systems, tracing the request path from user-space application through the system call interface, device driver, hardware controller, and back via the Interrupt Service Routine (ISR).
## Features

- 🔋 **Performance Simulations**: Watch data flow in real-time as you trigger different I/O handling mechanisms.
  - **Polling Flow**: Watch the CPU waste cycles stuck in a wait loop.
  - **Interrupt Flow**: See the OS context switch to other processes while waiting for hardware signals.
  - **DMA Flow**: Simulate the Device Controller bypassing the CPU entirely to write bulk data directly to Main Memory.
  - **Interrupt Coalescing**: Watch the network controller buffer multiple packets before firing a single, consolidated interrupt.
- 📊 **Real-Time Logging**: A stylized terminal interface outputs millisecond-accurate logs of system calls, context switches, driver operations, and hardware signals.
- ⏱️ **Event Timeline**: A chronological visual record of the simulation steps.
- 📈 **Quantitative Research Insights**: Interactive `Chart.js` components visualizing:
  - CPU Utilization vs Workload Intensity
  - Response Latency vs System Load 
  - Power Consumption vs IOPS
  - DMA vs PIO Throughput Analysis
- 📅 **Interrupt Priority Scheduling Gantt Chart**: Illustrates the preemption of User Processes by Disk ISRs, Serial ISRs, and NMIs.

## Tech Stack

- **Framework:** Vite
- **Frontend:** Vanilla HTML, CSS, JavaScript (No frontend libraries)
- **Visuals:** CSS Glassmorphism, CSS keyframes context-aware glowing animations, SVG icons
- **Data Visualization:** `Chart.js`

## Running Locally

1. Clone this repository.
2. Navigate into the directory:
   ```bash
   cd Operating-system
   ```
3. Install dependencies (`chart.js`):
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5175` in your browser.

## The Design
The application features a dark, premium aesthetic (`#0f111a`) with glassmorphic panels and subtle glowing neon gradients (Violet, Cyan, Pink) meant to emphasize data activity across the System Bus layout. Continuous CSS animations are used to represent the active processing states of the CPU and Hardware.
