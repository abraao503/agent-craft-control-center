import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Quantas páginas mostrar ao redor da atual (padrão: 2) */
  siblingCount?: number;
  /** Mostrar informações de contagem de itens */
  showItemCount?: boolean;
  /** Offset para cálculo dos itens (padrão: 0) */
  itemsPerPage?: number;
  /** Total de itens */
  totalItems?: number;
  /** Texto customizado para contador (ex: "empresas", "usuários") */
  itemLabel?: string;
}

/**
 * Componente de paginação inteligente que lida com grandes quantidades de páginas
 * usando truncamento com reticências (...) e mostrando sempre primeira/última página.
 *
 * @example
 * ```tsx
 * <SmartPagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 *   showItemCount
 *   itemsPerPage={10}
 *   totalItems={data.total}
 *   itemLabel="empresas"
 * />
 * ```
 *
 * Padrão de exibição:
 * - Poucas páginas (1-7): `← 1 2 3 4 5 6 7 →`
 * - Página inicial: `← 1 2 3 4 5 ... 20 →`
 * - Página intermediária: `← 1 ... 8 9 10 11 12 ... 20 →`
 * - Página final: `← 1 ... 16 17 18 19 20 →`
 */
export function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 2,
  showItemCount = false,
  itemsPerPage = 10,
  totalItems = 0,
  itemLabel = "itens",
}: SmartPaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];

    // Sempre mostra primeira página
    if (currentPage > siblingCount) {
      pages.push(0);
      if (currentPage > siblingCount + 1) {
        pages.push("ellipsis-start");
      }
    }

    // Páginas ao redor da atual
    const startPage = Math.max(0, currentPage - siblingCount);
    const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Sempre mostra última página
    if (currentPage < totalPages - siblingCount - 1) {
      if (currentPage < totalPages - siblingCount - 2) {
        pages.push("ellipsis-end");
      }
      pages.push(totalPages - 1);
    }

    return pages;
  };

  const pageNumbers = renderPageNumbers();

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Pagination>
          <PaginationContent>
            {/* Botão Anterior */}
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Números de páginas */}
            {pageNumbers.map((page, index) => {
              if (typeof page === "string") {
                // Renderiza reticências
                return (
                  <PaginationItem key={`${page}-${index}`}>
                    <span className="px-4 text-muted-foreground">...</span>
                  </PaginationItem>
                );
              }

              // Renderiza número da página
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Botão Próximo */}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages - 1, currentPage + 1))
                }
                className={
                  currentPage === totalPages - 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Contador de itens (opcional) */}
      {showItemCount && totalItems > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Mostrando {currentPage * itemsPerPage + 1} a{" "}
          {Math.min((currentPage + 1) * itemsPerPage, totalItems)} de{" "}
          {totalItems} {itemLabel}
        </div>
      )}
    </div>
  );
}
