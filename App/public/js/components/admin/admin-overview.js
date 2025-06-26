import { showToast } from "../../core/ui/toast.js";

export class OverviewManager {
  constructor() {
    this.chartData = {
      users: [],
      messages: [],
      servers: []
    };
    
    this.currentChartPeriod = "daily";
    this.init();
  }

  init() {
    this.showInitialSkeletons();
    this.setupChartControls();
    
    setTimeout(() => {
      this.loadSystemStats();
      this.loadChartData();
    }, 10);
  }

  showInitialSkeletons() {
    this.showSkeleton("total-users");
    this.showSkeleton("online-users");
    this.showSkeleton("new-users");
    this.showSkeleton("total-servers");
    this.showSkeleton("total-messages");
    this.showSkeleton("todays-messages");
    
    this.showChartLoading('users-chart');
    this.showChartLoading('messages-chart');
    this.showChartLoading('servers-chart');
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
    
    chartContainer.innerHTML = '';
    
    const skeletonStructure = document.createElement('div');
    skeletonStructure.className = 'chart-skeleton';
    skeletonStructure.style.width = '100%';
    skeletonStructure.style.height = '100%';
    skeletonStructure.style.position = 'relative';
    
    const titleSkeleton = document.createElement('div');
    titleSkeleton.className = 'skeleton';
    titleSkeleton.style.height = '16px';
    titleSkeleton.style.width = '120px';
    titleSkeleton.style.marginBottom = '15px';
    titleSkeleton.style.borderRadius = '4px';
    skeletonStructure.appendChild(titleSkeleton);
    
    const chartSkeleton = document.createElement('div');
    chartSkeleton.className = 'chart-grid-skeleton';
    chartSkeleton.style.height = 'calc(100% - 30px)';
    chartSkeleton.style.display = 'grid';
    chartSkeleton.style.gridTemplateColumns = '40px 1fr';
    chartSkeleton.style.gridTemplateRows = '1fr 25px';
    
    const yAxisSkeleton = document.createElement('div');
    yAxisSkeleton.className = 'y-axis-skeleton';
    yAxisSkeleton.style.display = 'flex';
    yAxisSkeleton.style.flexDirection = 'column';
    yAxisSkeleton.style.justifyContent = 'space-between';
    
    for (let i = 0; i < 5; i++) {
      const labelSkeleton = document.createElement('div');
      labelSkeleton.className = 'skeleton';
      labelSkeleton.style.height = '10px';
      labelSkeleton.style.width = '25px';
      labelSkeleton.style.marginRight = '10px';
      labelSkeleton.style.borderRadius = '2px';
      yAxisSkeleton.appendChild(labelSkeleton);
    }
    
    const chartAreaSkeleton = document.createElement('div');
    chartAreaSkeleton.className = 'chart-area-skeleton';
    chartAreaSkeleton.style.position = 'relative';
    chartAreaSkeleton.style.borderLeft = '1px solid #36393f';
    
    for (let i = 0; i < 5; i++) {
      const gridLine = document.createElement('div');
      gridLine.style.position = 'absolute';
      gridLine.style.left = '0';
      gridLine.style.right = '0';
      gridLine.style.height = '1px';
      gridLine.style.bottom = `${i * 25}%`;
      gridLine.style.backgroundColor = '#36393f';
      chartAreaSkeleton.appendChild(gridLine);
    }
    
    if (chartId === 'users-chart' || chartId === 'servers-chart') {
      const numBars = 12;
      chartAreaSkeleton.style.display = 'flex';
      chartAreaSkeleton.style.alignItems = 'flex-end';
      chartAreaSkeleton.style.justifyContent = 'space-around';
      
      for (let i = 0; i < numBars; i++) {
        const barContainer = document.createElement('div');
        barContainer.style.flex = '1';
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.alignItems = 'center';
        barContainer.style.maxWidth = '40px';
        barContainer.style.position = 'relative';
        
        const barSkeleton = document.createElement('div');
        barSkeleton.className = 'skeleton';
        barSkeleton.style.width = '100%';
        const height = 10 + Math.random() * 70;
        barSkeleton.style.height = `${height}%`;
        barSkeleton.style.borderRadius = '3px 3px 0 0';
        barSkeleton.style.animationDelay = `${i * 0.1}s`;
        
        barContainer.appendChild(barSkeleton);
        chartAreaSkeleton.appendChild(barContainer);
      }
    } else {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.left = "0";
      svg.style.top = "0";
      
      const polyline = document.createElementNS(svgNS, "polyline");
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke", "#36393f");
      polyline.setAttribute("stroke-width", "2");
      
      const numPoints = 12;
      let pointsString = '';
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * 100;
        const y = 20 + Math.random() * 60;
        pointsString += `${x},${y} `;
      }
      
      polyline.setAttribute("points", pointsString.trim());
      svg.appendChild(polyline);
      
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * 100;
        const y = 20 + Math.random() * 60;
        
        const pointSkeleton = document.createElement('div');
        pointSkeleton.className = 'skeleton';
        pointSkeleton.style.position = 'absolute';
        pointSkeleton.style.width = '6px';
        pointSkeleton.style.height = '6px';
        pointSkeleton.style.borderRadius = '50%';
        pointSkeleton.style.left = `${x}%`;
        pointSkeleton.style.top = `${y}%`;
        pointSkeleton.style.transform = 'translate(-50%, -50%)';
        
        chartAreaSkeleton.appendChild(pointSkeleton);
      }
      
      chartAreaSkeleton.appendChild(svg);
    }
    
    const xAxisSkeleton = document.createElement('div');
    xAxisSkeleton.className = 'x-axis-skeleton';
    xAxisSkeleton.style.display = 'flex';
    xAxisSkeleton.style.justifyContent = 'space-around';
    xAxisSkeleton.style.borderTop = '1px solid #36393f';
    xAxisSkeleton.style.paddingTop = '10px';
    
    const numLabels = 12;
    for (let i = 0; i < numLabels; i++) {
      const labelSkeleton = document.createElement('div');
      labelSkeleton.className = 'skeleton';
      labelSkeleton.style.height = '10px';
      labelSkeleton.style.width = '16px';
      labelSkeleton.style.borderRadius = '2px';
      xAxisSkeleton.appendChild(labelSkeleton);
    }
    
    chartSkeleton.appendChild(yAxisSkeleton);
    chartSkeleton.appendChild(chartAreaSkeleton);
    chartSkeleton.appendChild(document.createElement('div'));
    chartSkeleton.appendChild(xAxisSkeleton);
    
    skeletonStructure.appendChild(chartSkeleton);
    chartContainer.appendChild(skeletonStructure);
    
    chartContainer.setAttribute('data-skeleton', 'true');
  }

  hideChartLoading(chartId) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    chartContainer.removeAttribute('data-skeleton');
  }

  loadSystemStats() {
    const apiEndpoint = '/api/admin/stats';
    
    fetch(apiEndpoint)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data && data.data.stats) {
          this.updateSystemStats(data.data.stats);
        } else {
          showToast("Failed to load system stats", "error");
        }
      })
      .catch(error => {
        showToast("Error loading system stats", "error");
      });
  }
  
  updateSystemStats(stats) {
    const totalUsersEl = document.getElementById('total-users-card');
    const onlineUsersEl = document.getElementById('online-users-card'); 
    const newUsersEl = document.getElementById('new-users-card');
    const totalServersEl = document.getElementById('total-servers-card');
    const totalMessagesEl = document.getElementById('total-messages-card');
    const todaysMessagesEl = document.getElementById('todays-messages-card');
    
    if (totalUsersEl) {
      totalUsersEl.querySelector('.card-value').textContent = stats.users ? stats.users.total : '0';
      totalUsersEl.classList.remove('skeleton');
    }
    
    if (onlineUsersEl) {
      onlineUsersEl.querySelector('.card-value').textContent = stats.users ? stats.users.online : '0';
      onlineUsersEl.classList.remove('skeleton');
    }
    
    if (newUsersEl) {
      newUsersEl.querySelector('.card-value').textContent = stats.users ? stats.users.recent : '0';
      newUsersEl.classList.remove('skeleton');
    }
    
    if (totalServersEl) {
      totalServersEl.querySelector('.card-value').textContent = stats.servers ? stats.servers.total : '0';
      totalServersEl.classList.remove('skeleton');
    }
    
    if (totalMessagesEl) {
      totalMessagesEl.querySelector('.card-value').textContent = stats.messages ? stats.messages.total : '0';
      totalMessagesEl.classList.remove('skeleton');
    }
    
    if (todaysMessagesEl) {
      todaysMessagesEl.querySelector('.card-value').textContent = stats.messages ? stats.messages.today : '0';
      todaysMessagesEl.classList.remove('skeleton');
    }
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
    fetch("/api/admin/stats/users/growth", {
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then(response => {
        console.log("Users Growth Status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Users Growth Response:", data);
        
        let chartData = [];
        
        if (data.success && data.data) {
          chartData = data.data || [];
        } else {
          console.log("Using sample user data");
          chartData = [
            { label: 'Online', value: 5 },
            { label: 'Offline', value: 25 },
            { label: 'Banned', value: 2 }
          ];
        }
        
        console.log("Users Chart Data:", chartData);
        
        this.chartData.users = chartData;
        this.renderUserChart();
        this.hideChartLoading('users-chart');
      })
      .catch(error => {
        console.error("User growth error:", error);
        showToast("Error loading user growth data", "error");
        
        this.chartData.users = [
          { label: 'Online', value: 5 },
          { label: 'Offline', value: 25 },
          { label: 'Banned', value: 2 }
        ];
        this.renderUserChart();
        this.hideChartLoading('users-chart');
      });
    
    fetch("/api/admin/stats/messages/activity", {
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then(response => {
        console.log("Messages Activity Status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Messages Activity Response:", data);
        
        let chartData = [];
        
        if (data.success && data.data) {
          chartData = data.data || [];
        } else {
          console.log("Using sample message data");
          chartData = [
            { label: 'Total Messages', value: 150 },
            { label: 'Today', value: 25 },
            { label: 'Remaining', value: 125 }
          ];
        }
        
        console.log("Messages Chart Data:", chartData);
        
        this.chartData.messages = chartData;
        this.renderMessageChart();
        this.hideChartLoading('messages-chart');
      })
      .catch(error => {
        console.error("Message activity error:", error);
        showToast("Error loading message activity data", "error");
        
        this.chartData.messages = [
          { label: 'Total Messages', value: 150 },
          { label: 'Today', value: 25 },
          { label: 'Remaining', value: 125 }
        ];
        this.renderMessageChart();
        this.hideChartLoading('messages-chart');
      });
    
    fetch("/api/admin/stats/servers/growth", {
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then(response => {
        console.log("Servers Growth Status:", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Servers Growth Response:", data);
        
        let chartData = [];
        
        if (data.success && data.data) {
          chartData = data.data || [];
        } else {
          console.log("Using sample server data");
          chartData = [
            { label: 'Public Servers', value: 8 },
            { label: 'Private Servers', value: 4 }
          ];
        }
        
        console.log("Servers Chart Data:", chartData);
        
        this.chartData.servers = chartData;
        this.renderServerChart();
        this.hideChartLoading('servers-chart');
      })
      .catch(error => {
        console.error("Server growth error:", error);
        showToast("Error loading server growth data", "error");
        
        this.chartData.servers = [
          { label: 'Public Servers', value: 8 },
          { label: 'Private Servers', value: 4 }
        ];
        this.renderServerChart();
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
    if (!chartContainer) {
      console.error("Users chart container not found");
      return;
    }
    
    const data = this.chartData.users;
    
    console.log("Rendering Users Chart with data:", data);
    
    if (!data || data.length === 0) {
      console.log("No users chart data available");
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('bar-chart', 'User Statistics');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    const chartArea = chartStructure.querySelector('.chart-area');
    const yAxis = chartStructure.querySelector('.y-axis');
    const xAxis = chartStructure.querySelector('.x-axis');
    
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2;
    
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    data.forEach((item, index) => {
      const barContainer = document.createElement('div');
      barContainer.className = 'bar-container';
      barContainer.style.flex = '1';
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';
      barContainer.style.position = 'relative';
      barContainer.style.maxWidth = '100px';
      barContainer.style.margin = '0 10px';
      barContainer.style.justifyContent = 'flex-end';
      
      const bar = document.createElement('div');
      bar.className = 'bar blue';
      const heightPercent = (item.value / maxValue) * 100;
      bar.style.height = `${heightPercent}%`;
      bar.style.width = '100%';
      bar.setAttribute('data-value', item.value);
      bar.setAttribute('data-label', item.label);
      bar.style.animationDelay = `${index * 0.1}s`;
      
      bar.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${item.label}: ${item.value} users`);
        
        bar.style.backgroundColor = '#778aff';
        bar.style.boxShadow = '0 0 10px rgba(88, 101, 242, 0.5)';
        bar.style.transform = 'scaleY(1.03)';
        bar.style.transformOrigin = 'bottom';
        bar.style.transition = 'all 0.2s ease';
      });
      
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
        
        bar.style.backgroundColor = '';
        bar.style.boxShadow = '';
        bar.style.transform = '';
      });
      
      barContainer.appendChild(bar);
      
      chartArea.appendChild(barContainer);
      
      const label = document.createElement('div');
      label.textContent = this.formatAxisLabel(item.label);
      xAxis.appendChild(label);
    });
    
    const trackingArea = document.createElement('div');
    trackingArea.className = 'chart-tracking-area';
    trackingArea.style.position = 'absolute';
    trackingArea.style.top = '0';
    trackingArea.style.left = '0';
    trackingArea.style.width = '100%';
    trackingArea.style.height = '100%';
    trackingArea.style.zIndex = '1';
    trackingArea.style.pointerEvents = 'none';
    chartArea.appendChild(trackingArea);
  }

  renderMessageChart() {
    const chartContainer = document.getElementById('messages-chart');
    if (!chartContainer) return;
    
    const data = this.chartData.messages;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('bar-chart', 'Message Statistics');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    const chartArea = chartStructure.querySelector('.chart-area');
    const yAxis = chartStructure.querySelector('.y-axis');
    const xAxis = chartStructure.querySelector('.x-axis');
    
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2;
    
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    data.forEach((item, index) => {
      const barContainer = document.createElement('div');
      barContainer.className = 'bar-container';
      barContainer.style.flex = '1';
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';
      barContainer.style.position = 'relative';
      barContainer.style.maxWidth = '100px';
      barContainer.style.margin = '0 10px';
      barContainer.style.justifyContent = 'flex-end';
      
      const bar = document.createElement('div');
      bar.className = 'bar green';
      const heightPercent = (item.value / maxValue) * 100;
      bar.style.height = `${heightPercent}%`;
      bar.style.width = '100%';
      bar.setAttribute('data-value', item.value);
      bar.setAttribute('data-label', item.label);
      bar.style.animationDelay = `${index * 0.1}s`;
      
      bar.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${item.label}: ${item.value} messages`);
        
        bar.style.backgroundColor = '#57f287';
        bar.style.boxShadow = '0 0 10px rgba(87, 242, 135, 0.5)';
        bar.style.transform = 'scaleY(1.03)';
        bar.style.transformOrigin = 'bottom';
        bar.style.transition = 'all 0.2s ease';
      });
      
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
        
        bar.style.backgroundColor = '';
        bar.style.boxShadow = '';
        bar.style.transform = '';
      });
      
      barContainer.appendChild(bar);
      
      chartArea.appendChild(barContainer);
      
      const label = document.createElement('div');
      label.textContent = this.formatAxisLabel(item.label);
      xAxis.appendChild(label);
    });
    
    const trackingArea = document.createElement('div');
    trackingArea.className = 'chart-tracking-area';
    trackingArea.style.position = 'absolute';
    trackingArea.style.top = '0';
    trackingArea.style.left = '0';
    trackingArea.style.width = '100%';
    trackingArea.style.height = '100%';
    trackingArea.style.zIndex = '1';
    trackingArea.style.pointerEvents = 'none';
    chartArea.appendChild(trackingArea);
  }

  renderServerChart() {
    const chartContainer = document.getElementById('servers-chart');
    if (!chartContainer) return;
    
    const data = this.chartData.servers;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('bar-chart', 'Server Statistics');
    chartContainer.innerHTML = '';
    chartContainer.appendChild(chartStructure);
    
    const chartArea = chartStructure.querySelector('.chart-area');
    const yAxis = chartStructure.querySelector('.y-axis');
    const xAxis = chartStructure.querySelector('.x-axis');
    
    const maxValue = Math.max(...data.map(item => item.value)) * 1.2;
    
    const yLabels = this.generateYAxisLabels(maxValue, 5);
    yAxis.innerHTML = '';
    yLabels.forEach(label => {
      const labelEl = document.createElement('div');
      labelEl.textContent = label;
      yAxis.appendChild(labelEl);
      
      const linePos = (1 - (label / maxValue)) * 100;
      if (label > 0) {
        const gridLine = document.createElement('div');
        gridLine.className = 'h-grid-line';
        gridLine.style.bottom = `${linePos}%`;
        chartArea.appendChild(gridLine);
      }
    });
    
    chartArea.innerHTML = '';
    xAxis.innerHTML = '';
    
    data.forEach((item, index) => {
      const barContainer = document.createElement('div');
      barContainer.className = 'bar-container';
      barContainer.style.flex = '1';
      barContainer.style.display = 'flex';
      barContainer.style.flexDirection = 'column';
      barContainer.style.alignItems = 'center';
      barContainer.style.position = 'relative';
      barContainer.style.maxWidth = '100px';
      barContainer.style.margin = '0 10px';
      barContainer.style.justifyContent = 'flex-end';
      
      const bar = document.createElement('div');
      bar.className = 'bar purple';
      const heightPercent = (item.value / maxValue) * 100;
      bar.style.height = `${heightPercent}%`;
      bar.style.width = '100%';
      bar.setAttribute('data-value', item.value);
      bar.setAttribute('data-label', item.label);
      bar.style.animationDelay = `${index * 0.1}s`;
      
      bar.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${item.label}: ${item.value} servers`);
        
        bar.style.backgroundColor = '#b06bc4';
        bar.style.boxShadow = '0 0 10px rgba(155, 89, 182, 0.5)';
        bar.style.transform = 'scaleY(1.03)';
        bar.style.transformOrigin = 'bottom';
        bar.style.transition = 'all 0.2s ease';
      });
      
      bar.addEventListener('mouseleave', () => {
        this.hideTooltip();
        
        bar.style.backgroundColor = '';
        bar.style.boxShadow = '';
        bar.style.transform = '';
      });
      
      barContainer.appendChild(bar);
      
      chartArea.appendChild(barContainer);
      
      const label = document.createElement('div');
      label.textContent = this.formatAxisLabel(item.label);
      xAxis.appendChild(label);
    });
    
    const trackingArea = document.createElement('div');
    trackingArea.className = 'chart-tracking-area';
    trackingArea.style.position = 'absolute';
    trackingArea.style.top = '0';
    trackingArea.style.left = '0';
    trackingArea.style.width = '100%';
    trackingArea.style.height = '100%';
    trackingArea.style.zIndex = '1';
    trackingArea.style.pointerEvents = 'none';
    chartArea.appendChild(trackingArea);
  }

  createChartStructure(chartType, chartTitle) {
    const chartId = `chart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const structure = document.createElement('div');
    structure.innerHTML = `
      <div class="chart-title">${chartTitle}</div>
      <div class="chart-grid">
        <div class="y-axis"></div>
        <div class="chart-area"></div>
        <div></div>
        <div class="x-axis"></div>
      </div>
      <div class="chart-tooltip" id="${chartId}-tooltip"></div>
    `;
    structure.className = `chart-container ${chartType}`;
    structure.setAttribute('data-chart-id', chartId);
    return structure;
  }

  generateYAxisLabels(maxValue, count) {
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
      if (label.includes('-')) {
        const parts = label.split('-');
        return parts[2] || label;
      }
      return label;
    } else {
      return label.substring(0, 5);
    }
  }

  showTooltip(event, text) {
    const targetBar = event.target;
    const barRect = targetBar.getBoundingClientRect();
    
    const chartContainer = event.target.closest('.chart-container');
    if (!chartContainer) return;
    
    const chartId = chartContainer.getAttribute('data-chart-id');
    const tooltip = document.getElementById(`${chartId}-tooltip`);
    if (!tooltip) return;
    
    tooltip.textContent = text;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    const left = barRect.left + (barRect.width / 2);
    let top = barRect.top - 10;
    
    if (top - tooltipRect.height < 0) {
      top = barRect.bottom + 10;
      tooltip.classList.add('tooltip-bottom');
    } else {
      tooltip.classList.remove('tooltip-bottom');
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    if (tooltip.hideTimeout) {
      clearTimeout(tooltip.hideTimeout);
      tooltip.hideTimeout = null;
    }
    
    tooltip.classList.add('visible');
    tooltip.style.visibility = 'visible';
  }

  hideTooltip() {
    const tooltips = document.querySelectorAll('.chart-tooltip');
    tooltips.forEach(tooltip => {
      if (tooltip.hideTimeout) return;
      
      tooltip.hideTimeout = setTimeout(() => {
        tooltip.classList.remove('visible');
        
        setTimeout(() => {
          tooltip.style.visibility = 'hidden';
          tooltip.hideTimeout = null;
        }, 300);
      }, 200);
    });
  }
}

export default OverviewManager;
