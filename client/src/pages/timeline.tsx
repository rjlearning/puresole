import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EntryCard from '@/components/flexible/EntryCard';
import { Plus, Filter, Search, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Entry {
  id: string;
  entryType: string;
  title?: string;
  content?: string;
  moodScore?: number;
  energyLevel?: number;
  stressLevel?: number;
  tags?: string[];
  recordedAt: string;
  data?: Record<string, any>;
}

export default function Timeline() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<number>(30); // days

  // Fetch entries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['entries', filterType, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      params.append('limit', '100');

      const startDate = startOfDay(subDays(new Date(), dateRange));
      params.append('startDate', startDate.toISOString());

      const response = await fetch(`/api/entries?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch entries');
      return response.json();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete entry');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast({
        title: 'Entry deleted',
        description: 'Your entry has been deleted successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        variant: 'destructive'
      });
    }
  });

  const entries: Entry[] = entriesData?.entries || [];

  // Filter entries by search
  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.title?.toLowerCase().includes(query) ||
      entry.content?.toLowerCase().includes(query) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.recordedAt), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, Entry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Timeline View</h1>
          <p className="text-gray-400">Your mental health journey over time</p>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mood">Mood</SelectItem>
                  <SelectItem value="journal">Journal</SelectItem>
                  <SelectItem value="sleep">Sleep</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="symptom">Symptom</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={String(dateRange)} onValueChange={(v) => setDateRange(Number(v))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/20">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            Loading your timeline...
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No entries yet</h2>
              <p className="text-gray-400 mb-6">
                Start tracking your mental health journey by creating your first entry
              </p>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="mr-2 h-5 w-5" />
                Create Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="relative">
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/20 rounded-lg px-4 py-2 mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {groupedEntries[date].length} {groupedEntries[date].length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>

                {/* Entries for this date */}
                <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                  {groupedEntries[date].map((entry) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-purple-500 border-2 border-gray-900"></div>

                      <EntryCard
                        entry={entry}
                        onEdit={(id) => console.log('Edit', id)}
                        onDelete={handleDelete}
                        onClick={(id) => console.log('View', id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {filteredEntries.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mt-8">
            <CardHeader>
              <CardTitle className="text-white">Period Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{entries.length}</div>
                  <div className="text-sm text-gray-400">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400">
                    {entries.filter(e => e.moodScore).length > 0
                      ? Math.round(
                          entries
                            .filter(e => e.moodScore)
                            .reduce((sum, e) => sum + (e.moodScore || 0), 0) /
                          entries.filter(e => e.moodScore).length
                        )
                      : '-'}
                  </div>
                  <div className="text-sm text-gray-400">Avg Mood</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {entries.filter(e => e.energyLevel).length > 0
                      ? Math.round(
                          entries
                            .filter(e => e.energyLevel)
                            .reduce((sum, e) => sum + (e.energyLevel || 0), 0) /
                          entries.filter(e => e.energyLevel).length
                        )
                      : '-'}
                  </div>
                  <div className="text-sm text-gray-400">Avg Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {new Set(entries.flatMap(e => e.tags || [])).size}
                  </div>
                  <div className="text-sm text-gray-400">Unique Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
