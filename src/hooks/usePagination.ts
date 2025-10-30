import { useState, useMemo } from 'react';

export interface PaginationState {
    page: number;
    pageSize: number;
    offset: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface PaginationActions {
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    goToFirstPage: () => void;
    goToLastPage: () => void;
}

export interface UsePaginationProps {
    initialPage?: number;
    initialPageSize?: number;
    totalItems?: number;
}

export interface UsePaginationReturn {
    pagination: PaginationState;
    actions: PaginationActions;
}

export const usePagination = ({
    initialPage = 1,
    initialPageSize = 20,
    totalItems = 0
}: UsePaginationProps = {}): UsePaginationReturn => {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const pagination = useMemo((): PaginationState => {
        const totalPages = Math.ceil(totalItems / pageSize);
        const offset = (page - 1) * pageSize;

        return {
            page,
            pageSize,
            offset,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };
    }, [page, pageSize, totalItems]);

    const actions = useMemo((): PaginationActions => ({
        setPage: (newPage: number) => {
            const clampedPage = Math.max(1, Math.min(newPage, pagination.totalPages));
            setPage(clampedPage);
        },
        setPageSize: (newPageSize: number) => {
            setPageSize(newPageSize);
            // Reset to first page when changing page size
            setPage(1);
        },
        nextPage: () => {
            if (pagination.hasNextPage) {
                setPage(page + 1);
            }
        },
        previousPage: () => {
            if (pagination.hasPreviousPage) {
                setPage(page - 1);
            }
        },
        goToFirstPage: () => setPage(1),
        goToLastPage: () => setPage(pagination.totalPages)
    }), [page, pagination.hasNextPage, pagination.hasPreviousPage, pagination.totalPages]);

    return { pagination, actions };
};