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
    
    this.chartConfig = {
      useMockData: false,
      mockDataRange: 'medium',
      mockDataTrend: 'random'
    };
    
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
    
    // Clear existing chart content
    chartContainer.innerHTML = '';
    
    // Create a skeleton loader structure that resembles a chart
    const skeletonStructure = document.createElement('div');
    skeletonStructure.className = 'chart-skeleton';
    skeletonStructure.style.width = '100%';
    skeletonStructure.style.height = '100%';
    skeletonStructure.style.position = 'relative';
    
    // Add title skeleton
    const titleSkeleton = document.createElement('div');
    titleSkeleton.className = 'skeleton';
    titleSkeleton.style.height = '16px';
    titleSkeleton.style.width = '120px';
    titleSkeleton.style.marginBottom = '15px';
    titleSkeleton.style.borderRadius = '4px';
    skeletonStructure.appendChild(titleSkeleton);
    
    // Create chart structure
    const chartSkeleton = document.createElement('div');
    chartSkeleton.className = 'chart-grid-skeleton';
    chartSkeleton.style.height = 'calc(100% - 30px)';
    chartSkeleton.style.display = 'grid';
    chartSkeleton.style.gridTemplateColumns = '40px 1fr';
    chartSkeleton.style.gridTemplateRows = '1fr 25px';
    
    // Y-axis skeleton
    const yAxisSkeleton = document.createElement('div');
    yAxisSkeleton.className = 'y-axis-skeleton';
    yAxisSkeleton.style.display = 'flex';
    yAxisSkeleton.style.flexDirection = 'column';
    yAxisSkeleton.style.justifyContent = 'space-between';
    
    // Add Y-axis labels (5 total)
    for (let i = 0; i < 5; i++) {
      const labelSkeleton = document.createElement('div');
      labelSkeleton.className = 'skeleton';
      labelSkeleton.style.height = '10px';
      labelSkeleton.style.width = '25px';
      labelSkeleton.style.marginRight = '10px';
      labelSkeleton.style.borderRadius = '2px';
      yAxisSkeleton.appendChild(labelSkeleton);
    }
    
    // Chart area skeleton
    const chartAreaSkeleton = document.createElement('div');
    chartAreaSkeleton.className = 'chart-area-skeleton';
    chartAreaSkeleton.style.position = 'relative';
    chartAreaSkeleton.style.borderLeft = '1px solid #36393f';
    
    // Add horizontal grid lines
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
    
    // Determine if we should add bar or line skeletons based on chart ID
    if (chartId === 'users-chart' || chartId === 'servers-chart') {
      // Add bar skeletons
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
        // Random heights for bars
        const height = 10 + Math.random() * 70;
        barSkeleton.style.height = `${height}%`;
        barSkeleton.style.borderRadius = '3px 3px 0 0';
        barSkeleton.style.animationDelay = `${i * 0.1}s`;
        
        barContainer.appendChild(barSkeleton);
        chartAreaSkeleton.appendChild(barContainer);
      }
    } else {
      // Add line skeleton for message chart
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.left = "0";
      svg.style.top = "0";
      
      // Create polyline with random points
      const polyline = document.createElementNS(svgNS, "polyline");
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke", "#36393f");
      polyline.setAttribute("stroke-width", "2");
      
      // Generate random points for the line
      const numPoints = 12;
      let pointsString = '';
      for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * 100;
        const y = 20 + Math.random() * 60;
        pointsString += `${x},${y} `;
      }
      
      polyline.setAttribute("points", pointsString.trim());
      svg.appendChild(polyline);
      
      // Add point skeletons
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
    
    // X-axis skeleton
    const xAxisSkeleton = document.createElement('div');
    xAxisSkeleton.className = 'x-axis-skeleton';
    xAxisSkeleton.style.display = 'flex';
    xAxisSkeleton.style.justifyContent = 'space-around';
    xAxisSkeleton.style.borderTop = '1px solid #36393f';
    xAxisSkeleton.style.paddingTop = '10px';
    
    // Add X-axis labels
    const numLabels = 12;
    for (let i = 0; i < numLabels; i++) {
      const labelSkeleton = document.createElement('div');
      labelSkeleton.className = 'skeleton';
      labelSkeleton.style.height = '10px';
      labelSkeleton.style.width = '16px';
      labelSkeleton.style.borderRadius = '2px';
      xAxisSkeleton.appendChild(labelSkeleton);
    }
    
    // Assemble the chart grid
    chartSkeleton.appendChild(yAxisSkeleton);
    chartSkeleton.appendChild(chartAreaSkeleton);
    chartSkeleton.appendChild(document.createElement('div')); // spacer
    chartSkeleton.appendChild(xAxisSkeleton);
    
    skeletonStructure.appendChild(chartSkeleton);
    chartContainer.appendChild(skeletonStructure);
    
    // Add data-skeleton attribute for identification
    chartContainer.setAttribute('data-skeleton', 'true');
  }

  hideChartLoading(chartId) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    // Remove the skeleton attribute
    chartContainer.removeAttribute('data-skeleton');
  }

  loadSystemStats() {
    this.showSkeleton("total-users");
    this.showSkeleton("online-users");
    this.showSkeleton("new-users");
    this.showSkeleton("total-servers");
    this.showSkeleton("total-messages");
    this.showSkeleton("todays-messages");
    
    if (this.chartConfig.useMockData) {
      setTimeout(() => {
        this.updateSystemStats(this.generateMockSystemStats());
      }, 500);
      return;
    }
    
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

  updateChartConfig(config) {
    this.chartConfig = { ...this.chartConfig, ...config };
    
    this.loadSystemStats();
    this.loadChartData();
  }

  loadChartData() {
    this.showChartLoading('users-chart');
    this.showChartLoading('messages-chart');
    this.showChartLoading('servers-chart');
    
    if (this.chartConfig.useMockData) {
      this.loadMockChartData();
      return;
    }
    
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
  
  loadMockChartData() {
    const dates = this.generateDateArray(14);
    const weeks = this.generateWeekArray(8);
    
    this.chartData.users.daily = dates.map((date, index) => ({
      label: date,
      value: this.generateMockValue(index, 'users')
    }));
    
    this.chartData.users.weekly = weeks.map((week, index) => ({
      label: week,
      value: this.generateMockValue(index, 'users', true)
    }));
    
    this.chartData.messages.daily = dates.map((date, index) => ({
      label: date,
      value: this.generateMockValue(index, 'messages')
    }));
    
    this.chartData.messages.weekly = weeks.map((week, index) => ({
      label: week,
      value: this.generateMockValue(index, 'messages', true)
    }));
    
    this.chartData.servers.growth = dates.map((date, index) => ({
      label: date,
      value: this.generateMockValue(index, 'servers')
    }));
    
    setTimeout(() => {
      this.renderAllCharts();
      this.hideChartLoading('users-chart');
      this.hideChartLoading('messages-chart');
      this.hideChartLoading('servers-chart');
    }, 500);
  }
  
  generateMockSystemStats() {
    const range = this.getMockRange();
    
    return {
      totalUsers: this.getRandomInt(range.medium.min * 10, range.medium.max * 10),
      onlineUsers: this.getRandomInt(range.small.min, range.small.max * 2),
      newUsers: this.getRandomInt(range.small.min, range.small.max),
      totalServers: this.getRandomInt(range.small.min * 5, range.medium.min),
      totalMessages: this.getRandomInt(range.large.min, range.large.max),
      todaysMessages: this.getRandomInt(range.medium.min, range.medium.max)
    };
  }
  
  generateMockValue(index, type, isWeekly = false) {
    const range = this.getMockRange();
    const { mockDataTrend } = this.chartConfig;
    
    let baseRange;
    if (type === 'users') {
      baseRange = isWeekly ? range.medium : range.small;
    } else if (type === 'messages') {
      baseRange = isWeekly ? range.large : range.medium;
    } else {
      baseRange = range.small;
    }
    
    const min = baseRange.min;
    const max = baseRange.max;
    
    switch (mockDataTrend) {
      case 'growing':
        const growthRate = isWeekly ? 1.2 : 1.1;
        return Math.round(min + (max - min) * (index / 10) * growthRate) + this.getRandomInt(-min/10, min/10);
      case 'declining':
        const declineRate = isWeekly ? 0.8 : 0.9;
        return Math.round(max - (max - min) * (index / 10) * declineRate) + this.getRandomInt(-min/10, min/10);
      case 'stable':
        const midValue = (min + max) / 2;
        return Math.round(midValue + this.getRandomInt(-midValue/10, midValue/10));
      case 'random':
      default:
        return this.getRandomInt(min, max);
    }
  }
  
  getMockRange() {
    const { mockDataRange } = this.chartConfig;
    
    switch (mockDataRange) {
      case 'small':
        return {
          small: { min: 1, max: 20 },
          medium: { min: 10, max: 50 },
          large: { min: 50, max: 200 }
        };
      case 'large':
        return {
          small: { min: 100, max: 500 },
          medium: { min: 500, max: 2000 },
          large: { min: 2000, max: 5000 }
        };
      case 'medium':
      default:
        return {
          small: { min: 10, max: 100 },
          medium: { min: 100, max: 500 },
          large: { min: 500, max: 2000 }
        };
    }
  }
  
  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  generateDateArray(days) {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }
  
  generateWeekArray(weeks) {
    const weekLabels = [];
    const today = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - (i * 7 + 6));
      const endOfWeek = new Date();
      endOfWeek.setDate(today.getDate() - (i * 7));
      
      const startMonth = startOfWeek.getMonth() + 1;
      const endMonth = endOfWeek.getMonth() + 1;
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      
      const weekLabel = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
      weekLabels.push(weekLabel);
    }
    
    return weekLabels;
  }

  renderAllCharts() {
    this.renderUserChart();
    this.renderMessageChart();
    this.renderServerChart();
  }

  renderUserChart() {
    const chartContainer = document.getElementById('users-chart');
    if (!chartContainer) return;
    
    const data = this.currentChartPeriod === 'daily' ? 
      this.chartData.users.daily : 
      this.chartData.users.weekly;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('bar-chart', 'New Users');
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
      barContainer.style.maxWidth = '40px';
      barContainer.style.margin = '0 5px';
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
    
    const data = this.currentChartPeriod === 'daily' ? 
      this.chartData.messages.daily : 
      this.chartData.messages.weekly;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('line-chart', 'Message Activity');
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
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return { 
        x, 
        y, 
        value: item.value,
        label: item.label 
      };
    });
    
    const trackingArea = document.createElement('div');
    trackingArea.className = 'chart-tracking-area';
    trackingArea.style.position = 'absolute';
    trackingArea.style.top = '0';
    trackingArea.style.left = '0';
    trackingArea.style.width = '100%';
    trackingArea.style.height = '100%';
    trackingArea.style.zIndex = '1';
    
    trackingArea.addEventListener('mousemove', (e) => {
      const rect = trackingArea.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      
      let closestPoint = points[0];
      let minDistance = Math.abs(x - closestPoint.x);
      
      for (let i = 1; i < points.length; i++) {
        const distance = Math.abs(x - points[i].x);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = points[i];
        }
      }
      
      if (minDistance < 5) {
        this.showTooltip(e, `${closestPoint.label}: ${closestPoint.value} messages`);
        
        let highlightPoint = chartArea.querySelector('.highlight-point');
        if (!highlightPoint) {
          highlightPoint = document.createElement('div');
          highlightPoint.className = 'highlight-point';
          chartArea.appendChild(highlightPoint);
        }
        
        highlightPoint.style.position = 'absolute';
        highlightPoint.style.width = '8px';
        highlightPoint.style.height = '8px';
        highlightPoint.style.backgroundColor = '#ffffff';
        highlightPoint.style.border = '2px solid #5865f2';
        highlightPoint.style.borderRadius = '50%';
        highlightPoint.style.transform = 'translate(-50%, 50%)';
        highlightPoint.style.left = `${closestPoint.x}%`;
        highlightPoint.style.bottom = `${100 - closestPoint.y}%`;
        highlightPoint.style.zIndex = '2';
        highlightPoint.style.pointerEvents = 'none';
        
        if (chartArea.highlightHideTimeout) {
          clearTimeout(chartArea.highlightHideTimeout);
          chartArea.highlightHideTimeout = null;
        }
      }
    });
    
    trackingArea.addEventListener('mouseleave', () => {
      this.hideTooltip();
      
      if (!chartArea.highlightHideTimeout) {
        chartArea.highlightHideTimeout = setTimeout(() => {
          const existingHighlight = chartArea.querySelector('.highlight-point');
          if (existingHighlight) {
            existingHighlight.style.opacity = '0';
            existingHighlight.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
              if (existingHighlight.parentNode === chartArea) {
                chartArea.removeChild(existingHighlight);
              }
              chartArea.highlightHideTimeout = null;
            }, 300);
          }
        }, 200);
      }
    });
    
    chartArea.appendChild(trackingArea);
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.overflow = "visible";
    svg.style.zIndex = "0";
    
    // Create a smooth path instead of polyline
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#5865f2");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    path.classList.add("chart-line");
    
    // Generate smooth curve path using cardinal spline
    let pathD = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const x1 = points[i].x;
      const y1 = points[i].y;
      const x2 = points[i + 1].x;
      const y2 = points[i + 1].y;
      
      // Calculate control points for smooth curve
      const smoothing = 0.2; // Adjust this value between 0 and 1 to control curve smoothness
      
      // Get previous and next points for better curve calculation
      const prev = i > 0 ? points[i - 1] : points[i];
      const next = i < points.length - 2 ? points[i + 2] : points[i + 1];
      
      // Calculate control points for natural cubic spline
      const cp1x = x1 + (x2 - prev.x) * smoothing;
      const cp1y = y1 + (y2 - prev.y) * smoothing;
      const cp2x = x2 - (next.x - x1) * smoothing;
      const cp2y = y2 - (next.y - y1) * smoothing;
      
      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    }
    
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    
    chartArea.appendChild(svg);
    
    // Create data points that appear on top of the path
    points.forEach((point, index) => {
      const dataPoint = document.createElement('div');
      dataPoint.className = 'data-point blue';
      dataPoint.style.left = `${point.x}%`;
      dataPoint.style.bottom = `${100 - point.y}%`;
      dataPoint.style.animationDelay = `${index * 0.1}s`;
      
      dataPoint.addEventListener('mouseenter', (e) => {
        this.showTooltip(e, `${point.label}: ${point.value} messages`);
        
        dataPoint.classList.add('active');
        dataPoint.style.transform = 'translate(-50%, 50%) scale(1.5)';
        dataPoint.style.backgroundColor = '#ffffff';
        dataPoint.style.border = '2px solid #5865f2';
      });
      
      dataPoint.addEventListener('mouseleave', () => {
        this.hideTooltip();
        
        dataPoint.classList.remove('active');
        dataPoint.style.transform = 'translate(-50%, 50%)';
        dataPoint.style.backgroundColor = '#5865f2';
        dataPoint.style.border = 'none';
      });
      
      chartArea.appendChild(dataPoint);
      
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

    const style = document.createElement('style');
    style.textContent = `
      @keyframes draw-path {
        0% {
          stroke-dashoffset: 1000;
        }
        100% {
          stroke-dashoffset: 0;
        }
      }
      .chart-line {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: draw-path 2s ease-in-out forwards;
      }
      .data-point.active {
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
        transition: transform 0.2s ease, background-color 0.2s ease, border 0.2s ease;
      }
      .chart-tracking-area {
        cursor: crosshair;
      }
    `;
    chartContainer.appendChild(style);
  }

  renderServerChart() {
    const chartContainer = document.getElementById('servers-chart');
    if (!chartContainer) return;
    
    const data = this.chartData.servers.growth;
    
    if (!data || data.length === 0) {
      chartContainer.innerHTML = '<div class="text-center text-discord-lighter p-4">No data available</div>';
      return;
    }
    
    const chartStructure = this.createChartStructure('bar-chart', 'Server Growth');
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
      barContainer.style.maxWidth = '40px';
      barContainer.style.margin = '0 5px';
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
