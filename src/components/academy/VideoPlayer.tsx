'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  videoProvider: 'youtube' | 'vimeo' | 'other';
  onProgress?: (progress: number) => void; // 0-100
  onComplete?: () => void;
  autoMarkComplete?: boolean;
  lessonId?: string;
  enrollmentId?: string;
}

export function VideoPlayer({
  videoUrl,
  videoProvider,
  onProgress,
  onComplete,
  autoMarkComplete = true,
  lessonId,
  enrollmentId,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extrair ID do vídeo da URL
  const getVideoId = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    } else if (provider === 'vimeo') {
      const regExp = /vimeo.*\/(\d+)/i;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }
    return null;
  };

  const videoId = getVideoId(videoUrl, videoProvider);

  // Gerar embed URL
  const getEmbedUrl = () => {
    if (!videoId) return videoUrl;

    if (videoProvider === 'youtube') {
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
    } else if (videoProvider === 'vimeo') {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return videoUrl;
  };

  const embedUrl = getEmbedUrl();

  // Simular tracking de progresso (YouTube API requer mais setup)
  useEffect(() => {
    if (isPlaying && !progressIntervalRef.current) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + 2, 100); // Incrementa 2% a cada segundo

          // Chamar callback de progresso
          if (onProgress) {
            onProgress(newProgress);
          }

          // Marcar como completo aos 90%
          if (newProgress >= 90 && !hasMarkedComplete && autoMarkComplete) {
            markAsComplete();
          }

          return newProgress;
        });
      }, 1000); // A cada 1 segundo
    } else if (!isPlaying && progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, hasMarkedComplete, autoMarkComplete, onProgress]);

  const markAsComplete = async () => {
    if (!lessonId || !enrollmentId || hasMarkedComplete) return;

    setHasMarkedComplete(true);

    try {
      const res = await fetch(`/api/academy/enrollments/${enrollmentId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          action: 'complete',
        }),
      });

      if (res.ok) {
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Erro ao marcar aula como completa:', error);
      setHasMarkedComplete(false);
    }
  };

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden">
      {/* Video Embed */}
      <div className="relative pb-[56.25%]">
        {' '}
        {/* 16:9 aspect ratio */}
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Player"
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Overlay info */}
      {hasMarkedComplete && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          ✓ Aula concluída
        </div>
      )}
    </div>
  );
}
