import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DashboardCardProps extends React.ComponentProps<typeof Card> {
  title: string
  value?: string | number
  description?: string
  icon?: LucideIcon
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  trend?: {
    value: number
    label: string
  }
}

const variantStyles = {
  default: {
    card: "border-border",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    card: "border-primary/30 bg-primary/5",
    icon: "text-primary",
    value: "text-primary",
  },
  success: {
    card: "border-green-600/30 bg-green-600/5",
    icon: "text-green-500",
    value: "text-green-500",
  },
  warning: {
    card: "border-yellow-600/30 bg-yellow-600/5",
    icon: "text-yellow-500",
    value: "text-yellow-500",
  },
  danger: {
    card: "border-red-600/30 bg-red-600/5",
    icon: "text-red-500",
    value: "text-red-500",
  },
}

/**
 * DashboardCard - Cartão padronizado para métricas e estatísticas
 *
 * Usa as cores do tema HRX com variants opcionais:
 * - default: bg-card (zinc-900)
 * - primary: red-600 (HRX primary color)
 * - success: green
 * - warning: yellow
 * - danger: red
 */
function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
  className,
  children,
  ...props
}: DashboardCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card
      className={cn(
        styles.card,
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", styles.icon)} />
        )}
      </CardHeader>
      <CardContent>
        {value !== undefined && (
          <div className={cn("text-2xl font-bold", styles.value)}>
            {value}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span className={cn(
              "font-medium",
              trend.value >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {trend.value >= 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">
              {trend.label}
            </span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

export { DashboardCard }
