import React, { useEffect, useState, useRef } from 'react';
import { Activity, Building2, CheckCircle2, Timer, Users, TrendingUp, Calendar, ArrowLeft, FileText, DollarSign, Award, Trophy, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Only load Chart.js on client-side as needed
let Pie: any = () => <div className="h-64 flex items-center justify-center text-gray-500">Loading chart...</div>;

// Dynamically import Chart.js components to prevent mobile issues
if (typeof window !== 'undefined') {
  import('react-chartjs-2').then(module => {
    Pie = module.Pie;
  }).catch(err => {
    console.error("Could not load Chart.js components:", err);
  });
  
  // Register required components only if in browser
  try {
    ChartJS.register(ArcElement, Tooltip, Legend, Title);
  } catch (err) {
    console.warn("Could not register Chart.js components:", err);
  }
}

// Define colors for pie chart
const chartColors = [
  '#4ade80', // green-400
  '#60a5fa', // blue-400
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
];

export default function Statistics() {
  const navigate = useNavigate();
  const { projects, companies, drivers } = useData();
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalRevenue: 0
  });
  const [companyStats, setCompanyStats] = useState<{ [key: string]: number }>({});
  const [topDrivers, setTopDrivers] = useState<Array<{ id: string; total: number }>>([]);
  const [monthlyStats, setMonthlyStats] = useState<{ [key: string]: number }>({});
  const [dailyEarnings, setDailyEarnings] = useState<{ [key: string]: number }>({});
  const [allTimeBestDay, setAllTimeBestDay] = useState<{ date: string; earnings: number; dayName: string } | null>(null);
  const [pieChartData, setPieChartData] = useState<any>(null);
  const [chartError, setChartError] = useState<boolean>(false);

  const getCompanyName = (id: string) => {
    const company = companies.find(c => c.id === id);
    return company?.name || 'Unknown Company';
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find(d => d.id === id);
    return driver?.name || 'Unknown Driver';
  };

  // Calculate statistics
  useEffect(() => {
    try {
      // Project statistics
      const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        totalRevenue: projects.reduce((sum, p) => sum + p.price, 0)
      };
      setStatistics(stats);

      // Company distribution
      const companyDist = projects.reduce((acc, project) => {
        acc[project.company] = (acc[project.company] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      setCompanyStats(companyDist);

      // Monthly revenue
      const monthly = projects.reduce((acc, project) => {
        const month = new Date(project.date).toLocaleString('default', { month: 'long' });
        acc[month] = (acc[month] || 0) + project.price;
        return acc;
      }, {} as { [key: string]: number });
      setMonthlyStats(monthly);

      // Daily earnings - last 30 days
      const daily = projects.reduce((acc, project) => {
        const dateKey = project.date; // YYYY-MM-DD format
        acc[dateKey] = (acc[dateKey] || 0) + project.price;
        return acc;
      }, {} as { [key: string]: number });
      
      // Sort daily earnings by date and keep only last 30 days
      const sortedDates = Object.keys(daily).sort().reverse().slice(0, 30);
      const recentDailyEarnings = sortedDates.reduce((acc, date) => {
        acc[date] = daily[date];
        return acc;
      }, {} as { [key: string]: number });
      
      setDailyEarnings(recentDailyEarnings);

      // Calculate all-time best earning day
      let bestDate = '';
      let bestEarnings = 0;
      for (const [date, earnings] of Object.entries(daily)) {
        if (earnings > bestEarnings) {
          bestEarnings = earnings;
          bestDate = date;
        }
      }
      
      if (bestDate && bestEarnings > 0) {
        const dayName = new Date(bestDate).toLocaleDateString('en-US', { weekday: 'long' });
        setAllTimeBestDay({
          date: bestDate,
          earnings: bestEarnings,
          dayName
        });
      } else {
        setAllTimeBestDay(null);
      }

      // Top drivers by earnings
      const driverEarnings = drivers
        .map(driver => ({
          id: driver.id,
          total: driver.total_earnings || 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopDrivers(driverEarnings);

      // Create pie chart data
      if (Object.keys(companyDist).length > 0) {
        // Calculate total projects for percentage calculation
        const totalProjects = Object.values(companyDist).reduce((sum, count) => sum + count, 0);
        
        // Prepare data for pie chart
        const companyNames = Object.keys(companyDist).map(id => getCompanyName(id));
        const companyCounts = Object.values(companyDist);
        
        setPieChartData({
          labels: companyNames,
          datasets: [{
            data: companyCounts,
            backgroundColor: chartColors.slice(0, companyCounts.length),
            borderColor: chartColors.map(color => color + '80'), // 50% opacity
            borderWidth: 1,
          }],
        });
      }
    } catch (error) {
      console.error("Error calculating statistics:", error);
      setChartError(true);
    }
  }, [projects, companies, drivers]);

  // Pie chart options - enhanced with percentage display
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const, // Better for mobile
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        enabled: true,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} projects (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: false
      }
    },
    animation: {
      duration: 500 // Shorter animations for mobile
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Back to Dashboard</span>
            </button>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Statistics</h1>
          </div>
          
          <button
            onClick={() => navigate('/financial-report')}
            className="flex items-center px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
          >
            <FileText className="w-4 h-4 mr-2" />
            Financial Report
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Projects</p>
                <h3 className="text-lg sm:text-2xl font-bold">{statistics.total}</h3>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Active Projects</p>
                <h3 className="text-lg sm:text-2xl font-bold">{statistics.active}</h3>
              </div>
              <Timer className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Completed</p>
                <h3 className="text-lg sm:text-2xl font-bold">{statistics.completed}</h3>
              </div>
              <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">Total Revenue</p>
                <h3 className="text-lg sm:text-2xl font-bold">€{statistics.totalRevenue.toFixed(2)}</h3>
              </div>
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
          {/* Daily Earnings */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Daily Earnings (Last 30 Days)
            </h3>
            <div className="space-y-3 sm:space-y-4 max-h-72 overflow-y-auto">
              {Object.entries(dailyEarnings)
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .slice(0, 10)
                .map(([date, earnings]) => {
                  const maxEarnings = Math.max(...Object.values(dailyEarnings));
                  const percentage = maxEarnings ? (earnings / maxEarnings) * 100 : 0;
                  
                  return (
                    <div key={date} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-20 sm:w-24 h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm min-w-[60px] text-right">€{earnings.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              
              {Object.keys(dailyEarnings).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No earnings data available</p>
                </div>
              )}
            </div>
            
            {Object.keys(dailyEarnings).length > 10 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/financial-report')}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  View Full Report →
                </button>
              </div>
            )}
          </div>

          {/* Company Distribution - Enhanced with percentages */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-purple-500" />
              Companies Distribution
            </h3>

            {pieChartData && !chartError ? (
              <div className="h-56 sm:h-72 relative">
                <div className="pie-container">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const totalProjects = Object.values(companyStats).reduce((sum, count) => sum + count, 0);
                  
                  return Object.entries(companyStats)
                    .sort((a, b) => b[1] - a[1]) // Sort by project count descending
                    .map(([companyId, count]) => {
                      const percentage = totalProjects > 0 ? ((count / totalProjects) * 100).toFixed(1) : '0';
                      const maxCount = Math.max(...Object.values(companyStats));
                      const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={companyId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700">{getCompanyName(companyId)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full">
                                {count}
                              </span>
                              <span className="text-sm text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                          
                          {/* Visual bar representation */}
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
                
                {Object.keys(companyStats).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No company data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {/* Monthly Revenue Trend */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              Monthly Revenue
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(monthlyStats)
                .sort((a, b) => b[1] - a[1]) // Sort by revenue amount
                .slice(0, 5)
                .map(([month, revenue]) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month}</span>
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-24 sm:w-32 h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(revenue / Math.max(...Object.values(monthlyStats))) * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-sm">€{revenue.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              This Week Summary
            </h3>
            <div className="space-y-4">
              {(() => {
                const now = new Date();
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                
                const weekProjects = projects.filter(p => {
                  const projectDate = new Date(p.date);
                  return projectDate >= startOfWeek && projectDate <= now;
                });
                
                const weekEarnings = weekProjects.reduce((sum, p) => sum + p.price, 0);
                const avgDailyEarnings = weekEarnings / 7;
                
                // Calculate daily earnings for this week
                const dailyWeekEarnings = weekProjects.reduce((acc, project) => {
                  const dateKey = project.date;
                  acc[dateKey] = (acc[dateKey] || 0) + project.price;
                  return acc;
                }, {} as { [key: string]: number });
                
                // Find the best earning day for this week
                let bestWeekDay = null;
                let bestWeekEarnings = 0;
                for (const [date, earnings] of Object.entries(dailyWeekEarnings)) {
                  if (earnings > bestWeekEarnings) {
                    bestWeekEarnings = earnings;
                    bestWeekDay = date;
                  }
                }
                
                const bestWeekDayName = bestWeekDay 
                  ? new Date(bestWeekDay).toLocaleDateString('en-US', { weekday: 'long' })
                  : 'No data';
                
                // Check if this week's best day is a new all-time record
                const isNewRecord = allTimeBestDay && bestWeekEarnings > allTimeBestDay.earnings;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="font-semibold text-green-600">€{weekEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Projects Completed</span>
                      <span className="font-semibold">{weekProjects.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Daily Earnings</span>
                      <span className="font-semibold text-blue-600">€{avgDailyEarnings.toFixed(2)}</span>
                    </div>
                    
                    {/* All-time Best Day Record */}
                    {allTimeBestDay && (
                      <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm text-gray-600">All-Time Record</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-purple-700">{allTimeBestDay.dayName}</div>
                          <div className="text-sm font-medium text-purple-600">€{allTimeBestDay.earnings.toFixed(2)}</div>
                          <div className="text-xs text-purple-500">
                            {new Date(allTimeBestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* This Week's Best Day */}
                    {bestWeekDay && (
                      <div className={`flex justify-between items-center p-3 rounded-lg border-2 ${
                        isNewRecord 
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-300' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center">
                          {isNewRecord ? (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-orange-600 mr-1" />
                              <Trophy className="w-4 h-4 text-orange-600 mr-2" />
                            </div>
                          ) : (
                            <Award className="w-4 h-4 text-yellow-600 mr-2" />
                          )}
                          <div>
                            <span className="text-sm text-gray-600">
                              {isNewRecord ? 'NEW RECORD!' : 'Best Day This Week'}
                            </span>
                            {isNewRecord && (
                              <div className="text-xs text-orange-600 font-medium">All-Time High!</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isNewRecord ? 'text-orange-700' : 'text-yellow-700'}`}>
                            {bestWeekDayName}
                          </div>
                          <div className={`text-sm font-medium ${isNewRecord ? 'text-orange-600' : 'text-yellow-600'}`}>
                            €{bestWeekEarnings.toFixed(2)}
                          </div>
                          {isNewRecord && (
                            <div className="text-xs text-orange-500">
                              Previous: €{allTimeBestDay?.earnings.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Top Drivers */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-500" />
              Top Drivers by Earnings
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {topDrivers.map(({ id, total }, index) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 mr-2 sm:mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{getDriverName(id)}</span>
                  </div>
                  <span className="font-medium text-sm text-green-600">€{total.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Timeline */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3 sm:mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Project Timeline
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 5 }).map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() - index);
                const dayProjects = projects.filter(p => 
                  new Date(p.date).toDateString() === date.toDateString()
                );
                
                return (
                  <div key={date.toISOString()} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center space-x-2">
                      {dayProjects.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {dayProjects.slice(0, 3).map((project, i) => (
                              <div
                                key={project.id}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-medium text-blue-600"
                                title={project.clientName}
                              >
                                {project.clientName.charAt(0)}
                              </div>
                            ))}
                          </div>
                          {dayProjects.length > 3 && (
                            <span className="text-xs sm:text-sm text-gray-500">+{dayProjects.length - 3}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No projects</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}