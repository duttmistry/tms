import { Order } from 'sequelize';

export const getQuery = (data: any) => {
  const { page, limit, sortBy, orderBy } = data as {
    page: number;
    limit: number;
    sortBy: string;
    orderBy: string;
  };

  let offset = 0;
  if (page > 0 && limit > 0) {
    offset = (page - 1) * limit;
  }

  const order: [[string, string]] | [[string]] | [] =
    sortBy && orderBy ? [[sortBy, orderBy]] : sortBy ? [[sortBy]] : [];

  return { page, limit, order: order as Order, offset };
};
