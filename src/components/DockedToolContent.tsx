import type { ComponentProps } from 'react';
import { X } from 'lucide-react';
import { DialogClose, DialogContent } from '@/components/ui/dialog';

/** Persistent utilities share an anchor while the document remains interactive. */
export function DockedToolContent({
  label,
  className = '',
  children,
  ...props
}: Omit<ComponentProps<typeof DialogContent>, 'className'> & {
  label: string;
  className?: string;
}) {
  return (
    <DialogContent
      {...props}
      className={`docked-tool-panel ${className}`}
      positioning="custom"
      showOverlay={false}
      showCloseButton={false}
    >
      <div className="docked-tool-toolbar">
        <span>{label}</span>
        <DialogClose aria-label={`${label} 닫기`}>
          <X size={18} aria-hidden="true" />
        </DialogClose>
      </div>
      {children}
    </DialogContent>
  );
}
