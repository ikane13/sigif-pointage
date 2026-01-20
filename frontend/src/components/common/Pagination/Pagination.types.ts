export interface PaginationProps {
  page: number;           // 1-based
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
  maxPageButtons?: number; // ex: 5
  disabled?: boolean;
  showWhenSinglePage?: boolean;
}
