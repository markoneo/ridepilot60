import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, Building2, DollarSign, FileText, TrendingUp, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { saveAs } from 'file-saver';

interface MonthlyData {
  [month: string]: {
    [companyId: string]: number;
    total: number;
  };
}

interface DailyData {
  [date: string]: {
    [companyId: string]: number;
    total: number;
  };
}

interface CompanyData {
  id: string;
  name: string;
  total: number;
  monthlyBreakdown: {
    [month: string]: number;
  };
  dailyBreakdown: {
    [date: string]: number;
  };
}

export default function FinancialReport() {
  const navigate = useNavigate();
  const { projects, companies } = useData();
  const [yearToDate, setYearToDate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [years, setYears] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(true);

  // Get all available years from project data
  useEffect(() => {
    const projectYears = projects.map(project => new Date(project.date).getFullYear());
    const uniqueYears = Array.from(new Set(projectYears)).sort((a, b) => b - a); // Sort descending
    setYears(uniqueYears.length ? uniqueYears : [new Date().getFullYear()]);
  }, [projects]);

  // Process data when projects or selected filters change
  useEffect(() => {
    if (projects.length === 0 || companies.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Filter projects for selected year
      const yearProjects = projects.filter(project => {
        const projectYear = new Date(project.date).getFullYear();
        return projectYear === selectedYear;
      });

      // Calculate monthly data
      const months: MonthlyData = {};
      const daily: DailyData = {};
      const companyTotals: { [key: string]: { total: number, months: { [key: string]: number }, days: { [key: string]: number } } } = {};
      let ytdTotal = 0;

      // Initialize company totals
      companies.forEach(company => {
        companyTotals[company.id] = {
          total: 0,
          months: {},
          days: {}
        };
      });

      // Process each project
      yearProjects.forEach(project => {
        const date = new Date(project.date);
        const monthKey = date.toLocaleString('default', { month: 'long' });
        const dateKey = project.date; // YYYY-MM-DD format
        
        // Initialize month if not exists
        if (!months[monthKey]) {
          months[monthKey] = { total: 0 };
          companies.forEach(company => {
            months[monthKey][company.id] = 0;
          });
        }

        // Initialize day if not exists
        if (!daily[dateKey]) {
          daily[dateKey] = { total: 0 };
          companies.forEach(company => {
            daily[dateKey][company.id] = 0;
          });
        }

        // Add to monthly company total
        months[monthKey][project.company] = (months[monthKey][project.company] || 0) + project.price;
        months[monthKey].total += project.price;

        // Add to daily company total
        daily[dateKey][project.company] = (daily[dateKey][project.company] || 0) + project.price;
        daily[dateKey].total += project.price;
        
        // Add to company total
        companyTotals[project.company] = companyTotals[project.company] || { total: 0, months: {}, days: {} };
        companyTotals[project.company].total += project.price;
        companyTotals[project.company].months[monthKey] = (companyTotals[project.company].months[monthKey] || 0) + project.price;
        companyTotals[project.company].days[dateKey] = (companyTotals[project.company].days[dateKey] || 0) + project.price;
        
        // Add to YTD
        ytdTotal += project.price;
      });

      // Convert to sorted array for display
      const monthNames = Object.keys(months).sort((a, b) => {
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });

      // Sort months chronologically
      const orderedMonths: MonthlyData = {};
      monthNames.forEach(month => {
        orderedMonths[month] = months[month];
      });

      // Sort daily data chronologically
      const orderedDaily: DailyData = {};
      Object.keys(daily).sort().forEach(date => {
        orderedDaily[date] = daily[date];
      });

      // Format company data for display
      const formattedCompanyData = companies
        .map(company => ({
          id: company.id,
          name: company.name,
          total: companyTotals[company.id]?.total || 0,
          monthlyBreakdown: companyTotals[company.id]?.months || {},
          dailyBreakdown: companyTotals[company.id]?.days || {}
        }))
        .sort((a, b) => b.total - a.total); // Sort by highest total

      setMonthlyData(orderedMonths);
      setDailyData(orderedDaily);
      setCompanyData(formattedCompanyData);
      setYearToDate(ytdTotal);
      setLoading(false);
    } catch (error) {
      console.error('Error processing financial data:', error);
      setLoading(false);
    }
  }, [projects, companies, selectedYear]);

  // Filter daily data for selected month if in daily view
  const filteredDailyData = React.useMemo(() => {
    if (viewMode !== 'daily') return {};
    
    return Object.keys(dailyData)
      .filter(date => {
        const dateObj = new Date(date);
        return dateObj.getMonth() + 1 === selectedMonth && dateObj.getFullYear() === selectedYear;
      })
      .reduce((acc, date) => {
        acc[date] = dailyData[date];
        return acc;
      }, {} as DailyData);
  }, [dailyData, selectedMonth, selectedYear, viewMode]);

  // Generate CSV for download
  const generateCsv = () => {
    const isDaily = viewMode === 'daily';
    const dataToExport = isDaily ? filteredDailyData : monthlyData;
    const periods = Object.keys(dataToExport);
    
    // Create header row
    let csvContent = isDaily ? 'Company,Date,Amount\n' : 'Company,';
    
    if (!isDaily) {
      // Add month headers for monthly view
      periods.forEach(period => {
        csvContent += `"${period}",`;
      });
      csvContent += 'Year Total\n';
    }

    if (isDaily) {
      // Daily CSV format - one row per company per day
      companyData.forEach(company => {
        periods.forEach(date => {
          const amount = company.dailyBreakdown[date] || 0;
          if (amount > 0) {
            csvContent += `"${company.name}","${date}",€${amount.toFixed(2)}\n`;
          }
        });
      });
    } else {
      // Monthly CSV format
      companyData.forEach(company => {
        csvContent += `"${company.name}",`;
        
        // Add monthly values
        periods.forEach(month => {
          const value = company.monthlyBreakdown[month] || 0;
          csvContent += `€${value.toFixed(2)},`;
        });
        
        // Add company total
        csvContent += `€${company.total.toFixed(2)}\n`;
      });

      // Add total row
      csvContent += 'Monthly Total,';
      periods.forEach(month => {
        csvContent += `€${monthlyData[month].total.toFixed(2)},`;
      });
      csvContent += `€${yearToDate.toFixed(2)}\n`;
    }

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const filename = isDaily 
      ? `daily_report_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`
      : `financial_report_${selectedYear}.csv`;
    saveAs(blob, filename);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/statistics')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-1 sm:mb-0 mr-3"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Financial Report</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'monthly' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart2 className="w-4 h-4 mr-1 inline" />
                Monthly
              </button>
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'daily' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1 inline" />
                Daily
              </button>
            </div>

            <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border-none focus:ring-0 text-gray-700 py-1 pl-2 pr-7 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {viewMode === 'daily' && (
              <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border-none focus:ring-0 text-gray-700 py-1 pl-2 pr-7 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={generateCsv}
              className="flex items-center justify-center bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <h2 className="text-lg font-medium text-gray-900">
                      {viewMode === 'monthly' ? 'Year-to-Date' : 'Month'} Total: 
                      <span className="font-bold text-green-600 ml-2">
                        €{viewMode === 'monthly' 
                          ? yearToDate.toFixed(2) 
                          : Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)
                        }
                      </span>
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    {viewMode === 'monthly' 
                      ? selectedYear 
                      : `${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`
                    }
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Company
                      </th>
                      {viewMode === 'monthly' ? (
                        <>
                          {Object.keys(monthlyData).map((month) => (
                            <th
                              key={month}
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {month}
                            </th>
                          ))}
                          <th scope="col" className="bg-gray-100 px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Total
                          </th>
                        </>
                      ) : (
                        <>
                          {Object.keys(filteredDailyData).slice(0, 10).map((date) => (
                            <th
                              key={date}
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </th>
                          ))}
                          {Object.keys(filteredDailyData).length > 10 && (
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ...
                            </th>
                          )}
                          <th scope="col" className="bg-gray-100 px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Month Total
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companyData.map((company, index) => (
                      <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="sticky left-0 px-6 py-3 whitespace-nowrap font-medium text-gray-900 border-r border-gray-200 bg-inherit">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            {company.name}
                          </div>
                        </td>
                        
                        {viewMode === 'monthly' ? (
                          <>
                            {Object.keys(monthlyData).map((month) => {
                              const value = company.monthlyBreakdown[month] || 0;
                              return (
                                <td key={`${company.id}-${month}`} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {value > 0 ? `€${value.toFixed(2)}` : '—'}
                                </td>
                              );
                            })}
                            <td className="bg-gray-100 px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              €{company.total.toFixed(2)}
                            </td>
                          </>
                        ) : (
                          <>
                            {Object.keys(filteredDailyData).slice(0, 10).map((date) => {
                              const value = company.dailyBreakdown[date] || 0;
                              return (
                                <td key={`${company.id}-${date}`} className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {value > 0 ? `€${value.toFixed(2)}` : '—'}
                                </td>
                              );
                            })}
                            {Object.keys(filteredDailyData).length > 10 && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                ...
                              </td>
                            )}
                            <td className="bg-gray-100 px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              €{Object.keys(filteredDailyData).reduce((sum, date) => sum + (company.dailyBreakdown[date] || 0), 0).toFixed(2)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-gray-300">
                      <th className="sticky left-0 bg-green-50 px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200">
                        {viewMode === 'monthly' ? 'Monthly Total' : 'Daily Total'}
                      </th>
                      {viewMode === 'monthly' ? (
                        <>
                          {Object.keys(monthlyData).map((month) => (
                            <th
                              key={`total-${month}`}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                              €{monthlyData[month].total.toFixed(2)}
                            </th>
                          ))}
                          <th className="bg-green-100 px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            €{yearToDate.toFixed(2)}
                          </th>
                        </>
                      ) : (
                        <>
                          {Object.keys(filteredDailyData).slice(0, 10).map((date) => (
                            <th
                              key={`total-${date}`}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                              €{filteredDailyData[date].total.toFixed(2)}
                            </th>
                          ))}
                          {Object.keys(filteredDailyData).length > 10 && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              ...
                            </th>
                          )}
                          <th className="bg-green-100 px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                            €{Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)}
                          </th>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Report Information */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start">
                <FileText className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    This report shows the financial breakdown of all projects by company and {viewMode === 'monthly' ? 'month' : 'day'} for {selectedYear}
                    {viewMode === 'daily' && ` - ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}`}.
                  </p>
                  <p>
                    Total revenue for {viewMode === 'monthly' ? selectedYear : `${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}: 
                    <span className="font-medium text-green-600 ml-1">
                      €{viewMode === 'monthly' 
                        ? yearToDate.toFixed(2) 
                        : Object.values(filteredDailyData).reduce((sum, day) => sum + day.total, 0).toFixed(2)
                      }
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}