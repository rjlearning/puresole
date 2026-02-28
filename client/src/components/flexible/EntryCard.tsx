import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Zap,
  Brain,
  Moon,
  Activity,
  MessageSquare,
  Pill,
  Camera,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

interface EntryCardProps {
  entry: {
    id: string;
    entryType: string;
    title?: string;
    content?: string;
    moodScore?: number;
    energyLevel?: number;
    stressLevel?: number;
    tags?: string[];
    recordedAt: string | Date;
    data?: Record<string, any>;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

const getTypeIcon = (type: string) => {
  const iconMap: Record<string, JSX.Element> = {
    mood: <Heart className="h-4 w-4" />,
    energy: <Zap className="h-4 w-4" />,
    sleep: <Moon className="h-4 w-4" />,
    activity: <Activity className="h-4 w-4" />,
    journal: <MessageSquare className="h-4 w-4" />,
    symptom: <Brain className="h-4 w-4" />,
    medication: <Pill className="h-4 w-4" />,
    photo: <Camera className="h-4 w-4" />,
  };
  return iconMap[type] || <Heart className="h-4 w-4" />;
};

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    mood: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    energy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    sleep: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    activity: 'bg-green-500/20 text-green-300 border-green-500/30',
    journal: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    symptom: 'bg-red-500/20 text-red-300 border-red-500/30',
    medication: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    photo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return colorMap[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
};

const getMoodGradient = (score?: number) => {
  if (!score) return 'from-gray-500/20 to-gray-600/20';
  if (score >= 70) return 'from-green-500/20 to-emerald-600/20';
  if (score >= 40) return 'from-yellow-500/20 to-orange-600/20';
  return 'from-red-500/20 to-pink-600/20';
};

export default function EntryCard({ entry, onEdit, onDelete, onClick }: EntryCardProps) {
  const {
    id,
    entryType,
    title,
    content,
    moodScore,
    energyLevel,
    stressLevel,
    tags,
    recordedAt,
    data
  } = entry;

  let formattedDate = 'Unknown Date';
  try {
    if (recordedAt) {
      formattedDate = format(new Date(recordedAt), 'MMM d, yyyy • h:mm a');
    }
  } catch (err) {
    console.error('Invalid date provided to EntryCard:', recordedAt);
  }

  return (
    <Card
      className="bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group rounded-2xl"
      onClick={() => onClick?.(id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${entryType === 'mood' ? 'bg-pink-50 text-pink-600' :
              entryType === 'energy' ? 'bg-yellow-50 text-yellow-600' :
                entryType === 'voice' ? 'bg-violet-50 text-violet-600' :
                  'bg-slate-50 text-slate-600'
              }`}>
              {getTypeIcon(entryType)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 capitalize leading-none mb-1.5">
                {title || entryType.replace('_', ' ')}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{formattedDate}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-100 shadow-lg rounded-xl">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(id);
                }}
                className="text-slate-600 focus:bg-slate-50 focus:text-slate-900"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(id);
                }}
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {content && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed font-medium">{content}</p>
        )}

        {/* Metrics */}
        <div className="flex gap-3 mb-4">
          {moodScore !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50 border border-pink-100">
              <Heart className="h-3 w-3 text-pink-500" />
              <span className="text-xs font-bold text-pink-700">{moodScore}</span>
            </div>
          )}
          {energyLevel !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-yellow-50 border border-yellow-100">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-bold text-yellow-700">{energyLevel}</span>
            </div>
          )}
          {stressLevel !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
              <Brain className="h-3 w-3 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">{stressLevel}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-bold px-2 py-0.5 rounded-md"
              >
                #{tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-400">+{tags.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
