export interface Pagination {
    totalPages: number;
    pageNumber: number;
    offset: number;
  }
  

export const pagination = (page: string, limit: string, count: number): Pagination => {
  const totalPages: number = Math.ceil(count / parseInt(limit));
  const pageNumber: number = parseInt(page) > totalPages ? totalPages : parseInt(page);
  const offset: number = (parseInt(page) - 1) * parseInt(limit);

  return { totalPages, pageNumber, offset };
};
