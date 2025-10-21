import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { cn } from "@/lib/utils"

interface FormCardProps extends React.ComponentProps<typeof Card> {
  title?: string
  description?: string
}

/**
 * FormCard - Cartão padronizado para seções de formulários
 *
 * Usa as cores do tema HRX:
 * - bg-card (zinc-900 no dark mode)
 * - border-border (zinc-800 no dark mode)
 * - text-card-foreground (white no dark mode)
 */
function FormCard({
  title,
  description,
  children,
  className,
  ...props
}: FormCardProps) {
  return (
    <Card
      className={cn(
        "border-border",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-xl">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  )
}

export { FormCard }
