'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
}

export function ImageViewer({ images, initialIndex = 0 }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const openViewer = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeViewer = () => {
    setIsOpen(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <>
      {/* Thumbnails */}
      <div className="grid grid-cols-2 gap-2 w-48">
        {images.slice(0, 2).map((photoUrl: string, photoIndex: number) => (
          <button
            key={photoIndex}
            onClick={() => openViewer(photoIndex)}
            className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 hover:border-red-500 transition-all group cursor-pointer"
          >
            <Image
              src={photoUrl}
              alt={`Foto ${photoIndex + 1}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                  Clique para ampliar
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal Viewer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeViewer}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={closeViewer}
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 text-white hover:bg-white/10 h-12 w-12"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 text-white hover:bg-white/10 h-12 w-12"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div
            className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={images[currentIndex]}
                alt={`Foto ${currentIndex + 1}`}
                fill
                className="object-contain rounded-lg"
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Instruction */}
          <div className="absolute bottom-4 right-4 text-zinc-400 text-xs">
            Pressione ESC para fechar • ← → para navegar
          </div>
        </div>
      )}
    </>
  );
}
