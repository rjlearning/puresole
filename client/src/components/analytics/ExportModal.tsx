import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportModalProps {
  userId?: string;
  triggerButton?: React.ReactNode;
}

type ExportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'comprehensive' | 'baselines-only' | 'predictions-only' | 'insights-only';

interface ExportStatus {
  status: 'idle' | 'generating' | 'success' | 'error';
  message?: string;
  downloadUrl?: string;
  fileSizeKB?: number;
}

const formatOptions = [
  {
    value: 'pdf',
    label: 'PDF Report',
    icon: FileText,
    description: 'Comprehensive report with charts and visualizations',
    color: 'text-red-600'
  },
  {
    value: 'csv',
    label: 'CSV Data',
    icon: FileSpreadsheet,
    description: 'Raw data export for external analysis',
    color: 'text-green-600'
  },
  {
    value: 'json',
    label: 'JSON Data',
    icon: FileJson,
    description: 'Structured data for API integration',
    color: 'text-blue-600'
  }
];

const reportTypeOptions = [
  {
    value: 'comprehensive',
    label: 'Comprehensive Report',
    description: 'All analytics, insights, and predictions'
  },
  {
    value: 'baselines-only',
    label: 'Baselines Only',
    description: 'Personal baselines and deviations'
  },
  {
    value: 'predictions-only',
    label: 'Predictions Only',
    description: 'Wellness forecasts and trends'
  },
  {
    value: 'insights-only',
    label: 'Insights Only',
    description: 'AI recommendations and action items'
  }
];

export default function ExportModal({ userId, triggerButton }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('comprehensive');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ status: 'idle' });

  const generateExport = async () => {
    setExportStatus({ status: 'generating', message: 'Generating your report...' });

    try {
      const response = await fetch('/api/advanced-analytics/reports/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: selectedFormat,
          reportType: selectedReportType,
          startDate: dateRange.from?.toISOString(),
          endDate: dateRange.to?.toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate export');
      }

      const data = await response.json();

      setExportStatus({
        status: 'success',
        message: 'Report generated successfully!',
        downloadUrl: data.export.downloadUrl || `/api/advanced-analytics/reports/${data.export.id}/download`,
        fileSizeKB: data.export.fileSizeKB
      });
    } catch (err) {
      setExportStatus({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  };

  const handleDownload = () => {
    if (exportStatus.downloadUrl) {
      window.open(exportStatus.downloadUrl, '_blank');
    }
  };

  const resetModal = () => {
    setExportStatus({ status: 'idle' });
    setSelectedFormat('pdf');
    setSelectedReportType('comprehensive');
    setDateRange({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetModal, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Data</DialogTitle>
          <DialogDescription>
            Generate and download your wellness analytics in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Export Format</Label>
            <RadioGroup value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
              <div className="space-y-2">
                {formatOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        selectedFormat === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFormat(option.value as ExportFormat)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-5 h-5 ${option.color}`} />
                          <Label htmlFor={option.value} className="font-semibold cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Report Type Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Report Type</Label>
            <RadioGroup value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
              <div className="grid grid-cols-1 gap-2">
                {reportTypeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedReportType === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReportType(option.value as ReportType)}
                  >
                    <RadioGroupItem value={option.value} id={`type-${option.value}`} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={`type-${option.value}`} className="font-medium cursor-pointer block">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Date Range Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Date Range</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    {dateRange.from ? dateRange.from.toLocaleDateString() : 'Select start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-gray-500">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal flex-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    {dateRange.to ? dateRange.to.toLocaleDateString() : 'Select end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Date Shortcuts */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  to: new Date()
                })}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  to: new Date()
                })}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({
                  from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                  to: new Date()
                })}
              >
                Last 90 Days
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          <AnimatePresence>
            {exportStatus.status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {exportStatus.status === 'generating' && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      {exportStatus.message}
                      <Progress className="mt-2" value={undefined} />
                    </AlertDescription>
                  </Alert>
                )}

                {exportStatus.status === 'success' && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {exportStatus.message}
                      {exportStatus.fileSizeKB && (
                        <div className="mt-1 text-sm">
                          File size: {exportStatus.fileSizeKB.toFixed(0)} KB
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {exportStatus.status === 'error' && (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {exportStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter>
          <div className="flex items-center gap-2 w-full justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>

            {exportStatus.status === 'success' ? (
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            ) : (
              <Button
                onClick={generateExport}
                disabled={exportStatus.status === 'generating' || !dateRange.from || !dateRange.to}
              >
                {exportStatus.status === 'generating' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Export
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
