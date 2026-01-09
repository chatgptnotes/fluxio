import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: CardProps) {
  return (
    <div className={cn('card', className)}>
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
