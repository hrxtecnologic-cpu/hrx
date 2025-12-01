'use client';

import { useState } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ClipboardCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { LessonContentType } from '@/types/academy';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  contentType: LessonContentType;
  videoUrl?: string;
  durationMinutes: number;
  isPreview: boolean;
  isMandatory: boolean;
  order: number;
}

interface LessonBuilderProps {
  value: Lesson[];
  onChange: (lessons: Lesson[]) => void;
}

export function LessonBuilder({ value, onChange }: LessonBuilderProps) {
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const contentTypeIcons = {
    video: Video,
    text: FileText,
    quiz: HelpCircle,
    assignment: ClipboardCheck
  };

  const contentTypeLabels = {
    video: 'Vídeo',
    text: 'Texto',
    quiz: 'Quiz',
    assignment: 'Atividade'
  };

  const contentTypeColors = {
    video: 'bg-red-500/10 text-red-500 border-red-500/20',
    text: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    quiz: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    assignment: 'bg-green-500/10 text-green-500 border-green-500/20'
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      description: '',
      contentType: 'video',
      durationMinutes: 0,
      isPreview: false,
      isMandatory: true,
      order: value.length
    };

    onChange([...value, newLesson]);
    setExpandedLesson(newLesson.id);
  };

  const removeLesson = (id: string) => {
    const updatedLessons = value
      .filter((lesson) => lesson.id !== id)
      .map((lesson, index) => ({ ...lesson, order: index }));
    onChange(updatedLessons);
    if (expandedLesson === id) {
      setExpandedLesson(null);
    }
  };

  const updateLesson = (id: string, updates: Partial<Lesson>) => {
    onChange(
      value.map((lesson) =>
        lesson.id === id ? { ...lesson, ...updates } : lesson
      )
    );
  };

  const moveLesson = (id: string, direction: 'up' | 'down') => {
    const index = value.findIndex((lesson) => lesson.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === value.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newLessons = [...value];
    const [removed] = newLessons.splice(index, 1);
    newLessons.splice(newIndex, 0, removed);

    // Update order indices
    const reorderedLessons = newLessons.map((lesson, idx) => ({
      ...lesson,
      order: idx
    }));

    onChange(reorderedLessons);
  };

  const totalDuration = value.reduce(
    (sum, lesson) => sum + (lesson.durationMinutes || 0),
    0
  );

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            Aulas do Curso
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {value.length} aula{value.length !== 1 ? 's' : ''} • {formatDuration(totalDuration)} total
          </p>
        </div>
        <Button
          type="button"
          onClick={addLesson}
          size="sm"
          className="bg-white text-black hover:bg-red-500 hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Aula
        </Button>
      </div>

      {/* Lessons List */}
      {value.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">
              Nenhuma aula adicionada ainda
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Clique em &quot;Adicionar Aula&quot; para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {value
            .sort((a, b) => a.order - b.order)
            .map((lesson, index) => {
              const Icon = contentTypeIcons[lesson.contentType];
              const isExpanded = expandedLesson === lesson.id;

              return (
                <Card
                  key={lesson.id}
                  className="bg-zinc-900 border-zinc-800 overflow-hidden"
                >
                  {/* Lesson Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() =>
                      setExpandedLesson(isExpanded ? null : lesson.id)
                    }
                  >
                    <GripVertical className="h-5 w-5 text-zinc-600 flex-shrink-0" />

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={contentTypeColors[lesson.contentType]}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {contentTypeLabels[lesson.contentType]}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {lesson.title || `Aula ${index + 1} (sem título)`}
                      </p>
                      {lesson.durationMinutes > 0 && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDuration(lesson.durationMinutes)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {lesson.isPreview && (
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                          Preview
                        </Badge>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLesson(lesson.id, 'up');
                        }}
                        disabled={index === 0}
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                      >
                        ↑
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveLesson(lesson.id, 'down');
                        }}
                        disabled={index === value.length - 1}
                        className="h-8 w-8 text-zinc-500 hover:text-white"
                      >
                        ↓
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLesson(lesson.id);
                        }}
                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lesson Details (Expanded) */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4 space-y-4 border-t border-zinc-800">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label className="text-sm text-white">Título da Aula</Label>
                        <Input
                          value={lesson.title}
                          onChange={(e) =>
                            updateLesson(lesson.id, { title: e.target.value })
                          }
                          placeholder="Ex: Introdução ao Bartending"
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label className="text-sm text-white">Descrição</Label>
                        <Textarea
                          value={lesson.description}
                          onChange={(e) =>
                            updateLesson(lesson.id, { description: e.target.value })
                          }
                          placeholder="Breve descrição do conteúdo da aula..."
                          className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                        />
                      </div>

                      {/* Content Type & Duration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-white">Tipo de Conteúdo</Label>
                          <Select
                            value={lesson.contentType}
                            onValueChange={(value: string | number | boolean) =>
                              updateLesson(lesson.id, { contentType: value as LessonContentType })
                            }
                          >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              {Object.entries(contentTypeLabels).map(([key, label]) => (
                                <SelectItem
                                  key={key}
                                  value={key}
                                  className="text-white hover:bg-zinc-700"
                                >
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-white">Duração (minutos)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={lesson.durationMinutes || ''}
                            onChange={(e) =>
                              updateLesson(lesson.id, {
                                durationMinutes: parseInt(e.target.value) || 0
                              })
                            }
                            placeholder="0"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                      </div>

                      {/* Video URL (if video type) */}
                      {lesson.contentType === 'video' && (
                        <div className="space-y-2">
                          <Label className="text-sm text-white">URL do Vídeo</Label>
                          <Input
                            value={lesson.videoUrl || ''}
                            onChange={(e) =>
                              updateLesson(lesson.id, { videoUrl: e.target.value })
                            }
                            placeholder="https://youtube.com/watch?v=..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                      )}

                      {/* Checkboxes */}
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lesson.isPreview}
                            onChange={(e) =>
                              updateLesson(lesson.id, { isPreview: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
                          />
                          <span className="text-sm text-white">Aula Preview (grátis)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lesson.isMandatory}
                            onChange={(e) =>
                              updateLesson(lesson.id, { isMandatory: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600"
                          />
                          <span className="text-sm text-white">Obrigatória</span>
                        </label>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
