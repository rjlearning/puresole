import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Calendar, Download, Share2, Trash2, Eye, TrendingUp, Activity, Target, Heart } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  report_type: string;
  start_date: string;
  end_date: string;
  status: string;
  view_count: number;
  downloaded_count: number;
  share_code?: string;
  created_at: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewReport = async (reportType: string) => {
    try {
      const today = new Date();
      const daysBack = reportType === 'weekly' ? 7 : 30;
      const startDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${reportType === 'weekly' ? 'Weekly' : 'Monthly'} Wellness Report`,
          reportType,
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        })
      });

      const data = await response.json();

      if (data.reportId) {
        setShowGenerateModal(false);
        loadReports();
        setLocation(`/reports/${data.reportId}`);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'weekly': return <Calendar className="w-5 h-5" />;
      case 'monthly': return <TrendingUp className="w-5 h-5" />;
      case 'therapist': return <Heart className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Wellness Reports</h1>
            <p className="text-gray-600">Track your mental health journey over time</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Generate Report
          </button>
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate New Report</h2>
              <p className="text-gray-600 mb-6">Choose the type of report you'd like to generate</p>

              <div className="space-y-3">
                <button
                  onClick={() => generateNewReport('weekly')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Weekly Report</div>
                    <div className="text-sm text-gray-600">Last 7 days of data</div>
                  </div>
                </button>

                <button
                  onClick={() => generateNewReport('monthly')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                >
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Monthly Report</div>
                    <div className="text-sm text-gray-600">Last 30 days of data</div>
                  </div>
                </button>

                <button
                  onClick={() => generateNewReport('therapist')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-pink-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all"
                >
                  <Heart className="w-6 h-6 text-pink-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Therapist Report</div>
                    <div className="text-sm text-gray-600">Comprehensive report for sharing</div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reports List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No reports yet</h3>
            <p className="text-gray-600 mb-6">Generate your first wellness report to track your progress</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Generate Your First Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border-2 border-gray-100 hover:border-blue-200"
              >
                {/* Report Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getReportIcon(report.report_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 line-clamp-1">
                        {report.title}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize">
                        {report.report_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(report.start_date)} - {formatDate(report.end_date)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{report.view_count} views</span>
                  </div>
                  {report.share_code && (
                    <div className="flex items-center gap-1">
                      <Share2 className="w-4 h-4" />
                      <span>Shared</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocation(`/reports/${report.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Created {formatDate(report.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
