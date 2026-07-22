import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "../../lib/utils"






const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn(
      "flex flex-row items-center gap-3 sm:gap-4", // ✅ Augmenté l'espacement
      className
    )}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    isActive?: boolean
  }
>(({ className, isActive, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-royal-700 text-white shadow-sm hover:bg-royal-800"
        : "text-gray-600 hover:bg-royal-50 hover:text-royal-700",
      "focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-offset-2",
      className
    )}
    {...props}
  >
    {children}
  </a>
))
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Page précédente"
    className={cn("gap-1 px-2 sm:px-3 sm:pl-2.5 text-xs sm:text-sm", className)}
    {...props}
  >
    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    <span className="hidden sm:inline-block">Précédent</span>
  </PaginationLink>
)

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Page suivante"
    className={cn("gap-1 px-2 sm:px-3 sm:pr-2.5 text-xs sm:text-sm", className)}
    {...props}
  >
    <span className="hidden sm:inline-block">Suivant</span>
    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
  </PaginationLink>
)

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center text-gray-500 text-sm", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Plus de pages</span>
  </span>
)

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
}