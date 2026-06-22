'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'u rejim'}
      className={cn(
        'h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground',
        className,
      )}
      aria-label="Mavzuni almashtirish"
    >
      {mounted ? (
        theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}
