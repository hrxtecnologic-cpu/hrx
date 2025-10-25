'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function WizardStep({
  title,
  description,
  children,
  className,
  icon,
}: WizardStepProps) {
  return (
    <div className={cn('animate-in fade-in-50 duration-500', className)}>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600/10 flex items-center justify-center text-red-500">
                {icon}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-zinc-200">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm text-zinc-400 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
