import { showToast } from "../../core/ui/toast.js";

export class OverviewManager {
  constructor() {
    this.chartData = {
      users: {
        daily: [],
        weekly: []
      },
      messages: {
        daily: [],
        weekly: []
      },
      servers: {
        growth: []
      }
    };
    
    this.currentChartPeriod = "daily"; // daily or weekly
    
    this.init();
  }

  init() {
    this.loadSystemStats();
    this.setupChartControls();
    this.loadChartData();
  }

  showSkeleton(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      const skeletonHtml = '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      element.innerHTML = skeletonHtml;
    }
  }

  showChartLoading(chartId) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    // Check if loading overlay already exists
    let loadingOverlay = chartContainer.querySelector('.chart-loading');
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'chart-loading';
      loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
      chartContainer.appendChild(loadingOverlay);
    } else {
      loadingOverlay.classList.remove('hidden');
    }
  }

  hideChartLoading(chartId) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    const loadingOverlay = chartContainer.querySelector('.chart-loading');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }

  loadSystemStats() {
    this.showSkeleton("total-users");
    this.showSkeleton("online-users");
    this.showSkeleton("new-users");
    this.showSkeleton("total-servers");
    this.showSkeleton("total-messages");
    this.showSkeleton("todays-messages");
    
    fetch("/api/admin/stats", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.updateSystemStats(data.data.stats);
        } else {
          showToast(data.message || "Failed to load system stats", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading system stats", "error");
      });
  }
  
  updateSystemStats(stats) {
    document.getElementById("total-users").textContent = stats.totalUsers || 0;
    document.getElementById("online-users").textContent = stats.onlineUsers || 0;
    document.getElementById("new-users").textContent = stats.newUsers || 0;
    document.getElementById("total-servers").textContent = stats.totalServers || 0;
    document.getElementById("total-messages").textContent = stats.totalMessages || 0;
    document.getElementById("todays-messages").textContent = stats.todaysMessages || 0;
  }

  setupChartControls() {
    const periodSwitcher = document.getElementById('chart-period-switcher');
    if (periodSwitcher) {
      periodSwitcher.addEventListener('change', (e) => {
        this.currentChartPeriod = e.target.value;
        this.renderAllCharts();
      });
    }
    
    const refreshBtn = document.getElementById('refresh-charts');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadChartData();
      });
    }
  }

  loadChartData() {
    this.showChartLoading('users-chart');
    this.showChartLoading('messages-chart');
    this.showChartLoading('servers-chart');
    
    // Load user growth data
    fetch("/api/admin/stats/users/growth")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.chartData.users.daily = data.data.daily || [];
          this.chartData.users.weekly = data.data.weekly || [];
          this.renderUserChart();
        } else {
          showToast("Failed to load user growth data", "error");
        }
        this.hideChartLoading('users-chart');
      })
      .catch(error => {
        showToast("An error occurred while loading user growth data", "error");
        this.hideChartLoading('users-chart');
      });
    
    // Load message activity data
    fetch("/api/admin/stats/messages/activity")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.chartData.messages.daily = data.data.daily || [];
          this.chartData.messages.weekly = data.data.weekly || [];
          this.renderMessageChart();
        } else {
          showToast("Failed to load message activity data", "error");
        }
        this.hideChartLoading('messages-chart');
      })
      .catch(error => {
        showToast("An error occurred while loading message activity data", "error");
        this.hideChartLoading('messages-chart');
      });
    
    // Load server growth data
    fetch("/api/admin/stats/servers/growth")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.chartData.servers.growth = data.data.growth || [];
          this.renderServerChart();
        } else {
          showToast("Failed to load server growth data", "error");
        }
        this.hideChartLoading('servers-chart');
      })
      .catch(error => {
        showToast("An error occurred while loading server growth data", "error");
        this.hideChartLoading('servers-chart');
      });
  }

  renderAllCharts() {
    this.renderUserChart();
    this.renderMessageChart();
    this.renderServerChart();
  }

  renderUserChart() {
    const chartContainer = document.getElementById('users-chart');
    if (!chartContainer) return;
    
    // Use the appropriate data based on the selected period
    const data = this.currentChartPeriod === 'daily' ? 
      this.chartData.users.daily : 
      this.chartData.users.weekly;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    // Create chart structure
    const chartStructure = this.createChartStructure('bar-chart', 'New Users');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    // Get chart elements
    const chartArea = chartContainer.querySelector('.chart-area');
    const yAxis = chartContainer.querySelector('.y-axis');
    const xAxis = chartContainer.querySelector('.x-axis');
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2; // Add 20% padding
    
    // Setup y-axis labels
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      // Add horizontal grid line
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    // Generate bars and x-axis labels
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    data.forEach((item, index) => {
      // Create bar
      const bar = document.createElement('div');
      bar.className = 'bar blue';
      const heightPercent = (item.value / maxValue) * 100;
      bar.style.height = `${heightPercent}%`;
      bar.setAttribute('title', `${item.label}: ${item.value}`);
      bar.style.animationDelay = `${index * 0.1}s`;
      
      // Add hover effect
      bar.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${item.label}: ${item.value} users`);
      });
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
      
      chartArea.appendChild(bar);
      
      // Create x-axis label
      const label = document.createElement('div');
      label.textContent = this.formatAxisLabel(item.label);
      xAxis.appendChild(label);
    });
  }

  renderMessageChart() {
    const chartContainer = document.getElementById('messages-chart');
    if (!chartContainer) return;
    
    // Use the appropriate data based on the selected period
    const data = this.currentChartPeriod === 'daily' ? 
      this.chartData.messages.daily : 
      this.chartData.messages.weekly;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    // Create chart structure
    const chartStructure = this.createChartStructure('line-chart', 'Message Activity');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    // Get chart elements
    const chartArea = chartContainer.querySelector('.chart-area');
    const yAxis = chartContainer.querySelector('.y-axis');
    const xAxis = chartContainer.querySelector('.x-axis');
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2; // Add 20% padding
    
    // Setup y-axis labels
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      // Add horizontal grid line
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    // Clear chart area for points and lines
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    // Calculate point positions
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = (item.value / maxValue) * 100;
      return { 
        x, 
        y, 
        value: item.value,
        label: item.label 
      };
    });
    
    // Create lines
    for (let i = 0; i < points.length - 1; i++) {
      const startPoint = points[i];
      const endPoint = points[i + 1];
      
      const line = document.createElement('div');
      line.className = 'data-line blue';
      
      // Calculate line position and length
      const length = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      );
      const angle = Math.atan2(
        endPoint.y - startPoint.y, 
        endPoint.x - startPoint.x
      ) * (180 / Math.PI);
      
      line.style.left = `${startPoint.x}%`;
      line.style.bottom = `${startPoint.y}%`;
      line.style.width = `${length}%`;
      line.style.transform = `rotate(${angle}deg)`;
      line.style.transformOrigin = 'left bottom';
      line.style.animationDelay = `${i * 0.2}s`;
      
      chartArea.appendChild(line);
    }
    
    // Create points
    points.forEach((point, index) => {
      const dataPoint = document.createElement('div');
      dataPoint.className = 'data-point blue';
      dataPoint.style.left = `${point.x}%`;
      dataPoint.style.bottom = `${point.y}%`;
      dataPoint.style.animationDelay = `${(points.length - 1) * 0.2 + index * 0.1}s`;
      
      // Add hover effect
      dataPoint.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${point.label}: ${point.value} messages`);
      });
      dataPoint.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
      
      chartArea.appendChild(dataPoint);
      
      // Create x-axis labels (only show every nth label on small screens)
      if (index === 0 || index === points.length - 1 || 
          (window.innerWidth > 768 || index % 2 === 0)) {
        const label = document.createElement('div');
        label.textContent = this.formatAxisLabel(point.label);
        xAxis.appendChild(label);
        label.style.position = 'absolute';
        label.style.left = `${point.x}%`;
        label.style.transform = 'translateX(-50%)';
      }
    });
  }

  renderServerChart() {
    const chartContainer = document.getElementById('servers-chart');
    if (!chartContainer) return;
    
    // Use server growth data
    const data = this.chartData.servers.growth;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    // Create chart structure
    const chartStructure = this.createChartStructure('bar-chart', 'Server Growth');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    // Get chart elements
    const chartArea = chartContainer.querySelector('.chart-area');
    const yAxis = chartContainer.querySelector('.y-axis');
    const xAxis = chartContainer.querySelector('.x-axis');
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2; // Add 20% padding
    
    // Setup y-axis labels
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      // Add horizontal grid line
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    // Generate bars and x-axis labels
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    data.forEach((item, index) => {
      // Create bar
      const bar = document.createElement('div');
      bar.className = 'bar purple';
      const heightPercent = (item.value / maxValue) * 100;
      bar.style.height = `${heightPercent}%`;
      bar.setAttribute('title', `${item.label}: ${item.value}`);
      bar.style.animationDelay = `${index * 0.1}s`;
      
      // Add hover effect
      bar.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${item.label}: ${item.value} servers`);
      });
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
      
      chartArea.appendChild(bar);
      
      // Create x-axis label
      const label = document.createElement('div');
      label.textContent = this.formatAxisLabel(item.label);
      xAxis.appendChild(label);
    });
  }

  createChartStructure(chartType, chartTitle) {
    const structure = document.createElement('div');
    structure.innerHTML = `
      <div class="chart-title">${chartTitle}</div>
      <div class="chart-grid">
        <div class="y-axis"></div>
        <div class="chart-area"></div>
        <div></div>
        <div class="x-axis"></div>
      </div>
      <div class="chart-tooltip" id="chart-tooltip"></div>
    `;
    structure.className = `chart-container ${chartType}`;
    return structure;
  }

  generateYAxisLabels(maxValue, count) {
    // Round maxValue to a nice number
    const niceMax = this.roundToNice(maxValue);
    const step = niceMax / (count - 1);
    
    const labels = [];
    for (let i = 0; i < count; i++) {
      labels.unshift(Math.round(i * step));
    }
    
    return labels;
  }

  roundToNice(value) {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / Math.pow(10, exponent);
    
    let niceFraction;
    if (fraction <= 1.5) niceFraction = 1;
    else if (fraction <= 3) niceFraction = 2;
    else if (fraction <= 7) niceFraction = 5;
    else niceFraction = 10;
    
    return niceFraction * Math.pow(10, exponent);
  }

  formatAxisLabel(label) {
    if (this.currentChartPeriod === 'daily') {
      // Try to extract day part only if it's a date
      if (label.includes('-')) {
        const parts = label.split('-');
        return parts[2] || label;
      }
      return label;
    } else {
      // For weekly, show shorter format
      return label.substring(0, 5);
    }
  }

  showTooltip(event, text) {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;
    
    tooltip.textContent = text;
    tooltip.style.left = `${event.pageX}px`;
    tooltip.style.top = `${event.pageY - 10}px`;
    tooltip.style.opacity = 1;
  }

  hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;
    
    tooltip.style.opacity = 0;
  }
}

export default OverviewManager;
