import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminTable } from '../components/AdminTable';
import { Badge } from '../components/Badge';
import { Dropdown } from '../components/Dropdown';
import { formatPrice } from '../utils';
import { salesReportService } from '../services/salesReportService';
import { SoldProductSummary, SalesSource, ItemsSoldReportResponse } from '../types';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '../utils';
import { Box } from 'lucide-react';

export const ItemsSoldReport = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read initial values from URL if present (useful if navigating back)
  const queryParams = new URLSearchParams(location.search);
  
  const [reportData, setReportData] = useState<ItemsSoldReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(0);
  const [source, setSource] = useState<SalesSource | ''>((queryParams.get('source') as SalesSource) || '');
  const [fromDate, setFromDate] = useState<string>(queryParams.get('from') || '');
  const [toDate, setToDate] = useState<string>(queryParams.get('to') || '');

  useEffect(() => {
    // Only fetch if both dates are set, or both are empty
    if ((fromDate && !toDate) || (!fromDate && toDate)) {
      return;
    }
    fetchReport();
  }, [page, source, fromDate, toDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await salesReportService.getItemsSoldReport(
        source || undefined,
        fromDate || undefined,
        toDate || undefined,
        page,
        20
      );
      setReportData(data);
    } catch (err: any) {
      toast.error(extractErrorMessage(err) || 'Failed to load report');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: (p: SoldProductSummary) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            const qs = new URLSearchParams();
            if (source) qs.set('source', source);
            if (fromDate) qs.set('from', fromDate);
            if (toDate) qs.set('to', toDate);
            navigate(`/admin/reports/items-sold/${p.productId}?${qs.toString()}`);
          }}
        >
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.productName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Box className="h-5 w-5 opacity-50 text-zinc-400" />
            )}
          </div>
          <div>
            <span className="font-bold text-zinc-900 dark:text-white group-hover:underline">
              {p.productName}
            </span>
            <span className="text-xs text-zinc-500 block">{p.sku}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Quantity Sold',
      accessor: (p: SoldProductSummary) => p.quantitySold
    },
    {
      header: 'Total Amount',
      accessor: (p: SoldProductSummary) => formatPrice(p.totalAmount)
    },
    {
      header: 'Remaining (Global)',
      accessor: (p: SoldProductSummary) => (
        <div className="group relative inline-block">
          <span className="cursor-help border-b border-dashed border-zinc-400">
            {p.remainingStockGlobal}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-xl whitespace-nowrap pointer-events-none z-10 shadow-xl">
            {p.remainingByLocation && p.remainingByLocation.length > 0 ? (
              <div className="flex gap-2">
                {p.remainingByLocation.map(loc => (
                  <span key={loc.locationId}>{loc.locationName}: <span className="font-bold">{loc.quantityOnHand}</span></span>
                )).reduce((prev, curr) => <>{prev} <span className="text-zinc-500 mx-1">·</span> {curr}</>)}
              </div>
            ) : (
              'No location data'
            )}
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20 pt-8 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Items Sold</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {(!fromDate && !toDate) ? 'Showing: Today' : `Showing: ${fromDate} to ${toDate}`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-[#B8E0F7] dark:bg-zinc-800 p-1 rounded-xl text-xs px-2 w-full sm:w-auto">
            <input 
              type="date" 
              value={fromDate} 
              max={toDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }} 
              className="bg-transparent border-none outline-none dark:text-white py-1.5 focus:ring-0 cursor-pointer w-full sm:w-auto" 
            />
            <span className="text-[#999999] font-bold">to</span>
            <input 
              type="date" 
              value={toDate} 
              min={fromDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }} 
              className="bg-transparent border-none outline-none dark:text-white py-1.5 focus:ring-0 cursor-pointer w-full sm:w-auto" 
            />
          </div>
          <div className="w-full sm:w-44">
            <Dropdown
              value={source}
              onChange={(val) => { setSource(val as SalesSource | ''); setPage(0); }}
              options={[
                { label: 'ALL Channels', value: '' },
                { label: 'Walk-in', value: 'WALK_IN' },
                { label: 'Online', value: 'ONLINE' }
              ]}
              placeholder="ALL Channels"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] card-shadow border border-[#F5F5F5] dark:border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-1">Overall Quantity Sold</p>
          <p className="text-2xl font-bold dark:text-white">
            {reportData?.overallQuantitySold?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] card-shadow border border-[#F5F5F5] dark:border-zinc-800">
          <p className="text-xs font-bold uppercase tracking-widest text-[#999999] mb-1">Overall Amount Sold</p>
          <p className="text-2xl font-bold dark:text-white">
            {reportData ? formatPrice(reportData.overallAmountSold) : formatPrice(0)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AdminTable
          title=""
          data={reportData?.products?.content || []}
          columns={columns}
          isLoading={isLoading}
          currentPage={page + 1}
          totalPages={reportData?.products?.totalPages || 0}
          onPageChange={(p) => setPage(p - 1)}
          itemsPerPage={reportData?.products?.size || 20}
        />
      </div>
    </div>
  );
};
