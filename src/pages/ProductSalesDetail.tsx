import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { AdminTable } from '../components/AdminTable';
import { Badge } from '../components/Badge';
import { formatPrice } from '../utils';
import { salesReportService } from '../services/salesReportService';
import { ProductSalesDetailResponse, SaleLineResponse, SalesSource } from '../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils';
import { ArrowLeft, Box } from 'lucide-react';

export const ProductSalesDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const source = (queryParams.get('source') as SalesSource) || undefined;
  const fromDate = queryParams.get('from') || undefined;
  const toDate = queryParams.get('to') || undefined;

  const [detailData, setDetailData] = useState<ProductSalesDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!productId) return;
    // Mirror Analytics logic for date requirements
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      return;
    }
    fetchDetail();
  }, [productId, page, source, fromDate, toDate]);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data = await salesReportService.getProductSalesDetail(
        Number(productId),
        source,
        fromDate,
        toDate,
        page,
        20
      );
      setDetailData(data);
    } catch (err: any) {
      toast.error(extractErrorMessage(err) || 'Failed to load product sales detail');
      console.error(err);
      if (err?.response?.status === 404) {
        navigate('/admin/reports/items-sold', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      accessor: (s: SaleLineResponse) => new Date(s.dateOfSale).toLocaleString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    },
    {
      header: 'Reference',
      accessor: (s: SaleLineResponse) => s.referenceId
    },
    {
      header: 'Quantity',
      accessor: (s: SaleLineResponse) => s.quantity
    },
    {
      header: 'Amount',
      accessor: (s: SaleLineResponse) => formatPrice(s.amount)
    },
    {
      header: 'Channel',
      accessor: (s: SaleLineResponse) => (
        <Badge variant={s.channel === 'ONLINE' ? 'info' : 'success'}>
          {s.channel}
        </Badge>
      )
    },
    {
      header: 'Sold By',
      accessor: (s: SaleLineResponse) => s.soldBy
    },
    {
      header: 'Location',
      accessor: (s: SaleLineResponse) => s.locationName || '—'
    },
    {
      header: 'Balance After',
      accessor: (s: SaleLineResponse) => s.balanceAfterAtLocation !== null ? s.balanceAfterAtLocation : '—'
    },
  ];

  const goBackUrl = `/admin/reports/items-sold${location.search}`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20 pt-8 px-6">
      <Link 
        to={goBackUrl}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#666666] hover:text-[#1A1A1A] dark:text-zinc-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Items Sold
      </Link>

      <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] card-shadow border border-[#F5F5F5] dark:border-zinc-800 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {detailData && (
            <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-[#F5F5F5] dark:border-zinc-800">
              {detailData.imageUrl ? (
                <img src={detailData.imageUrl} alt={detailData.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Box className="h-8 w-8 opacity-50 text-zinc-400" />
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold dark:text-white">
                {detailData ? detailData.productName : 'Loading...'}
              </h1>
              {detailData && (
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-1 rounded-md font-mono">
                  {detailData.sku}
                </span>
              )}
            </div>
            <p className="text-sm text-[#999999]">
              {(!fromDate && !toDate) ? 'Showing: Today' : `Showing: ${fromDate} to ${toDate}`}
              {source && ` • Channel: ${source}`}
            </p>
          </div>
        </div>

        {detailData && (
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#999999]">Remaining (Global):</span>
              <span className="font-bold text-lg dark:text-white">{detailData.remainingStockGlobal}</span>
            </div>
            {detailData.remainingByLocation && detailData.remainingByLocation.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {detailData.remainingByLocation.map(loc => (
                  <Badge key={loc.locationId} variant="default">
                    {loc.locationName}: {loc.quantityOnHand}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FDFBFB] dark:bg-zinc-950 p-6 rounded-[2rem] border border-[#F5F5F5] dark:border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-1">Total Quantity Sold</p>
          <p className="text-2xl font-bold dark:text-white">
            {detailData?.totalQuantitySold?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-[#FDFBFB] dark:bg-zinc-950 p-6 rounded-[2rem] border border-[#F5F5F5] dark:border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-1">Total Amount Sold</p>
          <p className="text-2xl font-bold dark:text-white">
            {detailData ? formatPrice(detailData.totalAmountSold) : formatPrice(0)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AdminTable
          title="Sales"
          data={detailData?.sales?.content || []}
          columns={columns}
          isLoading={isLoading}
          currentPage={page + 1}
          totalPages={detailData?.sales?.totalPages || 0}
          onPageChange={(p) => setPage(p - 1)}
          itemsPerPage={detailData?.sales?.size || 20}
        />
      </div>
    </div>
  );
};
