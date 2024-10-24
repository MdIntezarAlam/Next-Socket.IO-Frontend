import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from './label';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isnumbersonly?: string;
  issetundefined?: 'true';
  label?: string | React.ReactNode;
  error?: string;
  tooltip?: React.ReactNode;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, tooltip, type, icon, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (props.isnumbersonly) {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        return props.onChange?.({ ...e, target: { ...e.target, value } });
      }
      if (props.issetundefined && e.target.value === '') {
        return props.onChange?.({
          ...e,
          target: { ...e.target, value: undefined as unknown as string },
        });
      }

      if (type === 'date' && !isValidDate(e.target.value)) {
        return props.onChange?.({
          ...e,
          target: { ...e.target, value: undefined as unknown as string },
        });
      }

      props.onChange?.(e);
    };

    const isValidDate = (value: string) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    };

    const inputComponet = (
      <div className='relative h-[34px]'>
        <input
          type={type}
          className={cn(
            'text-input-foreground inline-block h-10 w-full rounded-md bg-input px-3 py-2 text-sm outline-none ring-ring file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-accent disabled:cursor-default disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60',
            className,
            props.error && 'ring-destructive'
          )}
          ref={ref}
          {...props}
          onChange={handleChange}
        />
        {props.error && (
          <p className='mt-1 text-xs text-destructive'>{props.error}</p>
        )}
        {icon && (
          <div className='absolute right-0 top-0 flex h-full flex-col items-center justify-center'>
            {icon}
          </div>
        )}
      </div>
    );

    if (!label) return inputComponet;
    return (
      <div className='w-full space-y-2'>
        <Label
          dir={props.dir}
          htmlFor={props.id}
          className={cn(props.error && 'text-destructive', 'w-fit')}
        >
          {label}
        </Label>
        {inputComponet}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
