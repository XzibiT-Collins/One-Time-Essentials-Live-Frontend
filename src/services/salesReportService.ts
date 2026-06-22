import api from './api';
import {
    CustomApiResponse,
    ItemsSoldReportResponse,
    ProductSalesDetailResponse,
    SalesSource
} from '../types';

export const salesReportService = {
    /**
     * GET /api/v1/admin/inventory/sales/items-sold
     */
    getItemsSoldReport: async (source?: SalesSource, from?: string, to?: string, page: number = 0, size: number = 20): Promise<ItemsSoldReportResponse> => {
        const params: any = { page, size };
        if (source) params.source = source;
        if (from && to) {
            params.from = from;
            params.to = to;
        }
        
        const response = await api.get<CustomApiResponse<ItemsSoldReportResponse>>(
            `/admin/inventory/sales/items-sold`,
            { params }
        );
        return response.data.data;
    },

    /**
     * GET /api/v1/admin/inventory/sales/items-sold/{productId}
     */
    getProductSalesDetail: async (productId: number, source?: SalesSource, from?: string, to?: string, page: number = 0, size: number = 20): Promise<ProductSalesDetailResponse> => {
        const params: any = { page, size };
        if (source) params.source = source;
        if (from && to) {
            params.from = from;
            params.to = to;
        }
        
        const response = await api.get<CustomApiResponse<ProductSalesDetailResponse>>(
            `/admin/inventory/sales/items-sold/${productId}`,
            { params }
        );
        return response.data.data;
    }
};
