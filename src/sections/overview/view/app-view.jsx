import React, { useState, useEffect } from 'react';
import { DateRangePicker } from 'react-date-range';
import { format, addDays, isValid, parseISO, differenceInYears, differenceInMonths } from 'date-fns';

import { DataGrid } from '@mui/x-data-grid';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Box, Card, Button, Popover } from '@mui/material';

import { getAll } from 'src/API/sales';

import Scrollbar from 'src/components/scrollbar';

import SearchToolbar from './search-toolbar';
import AppWebsiteVisits from '../app-website-visits';
import AppWidgetSummary from '../app-widget-summary';
import { applyFilter, getComparator } from './utils';
import AppConversionRates from '../app-conversion-rates';

const formatDate = (dateString) => {
  const date = parseISO(dateString);
  if (!isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
};

const DATAGRID_COLUMNS = [
  { field: 'No', headerName: 'No', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'product', headerName: 'Product Name', width: 250, headerAlign: 'center', align: 'center' },
  { field: 'sales', headerName: 'Sales Item', width: 250, headerAlign: 'center', align: 'center', valueGetter: (params) => `${params.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} PCS` },
  { field: 'revenue', headerName: 'Revenue', width: 250, headerAlign: 'center', align: 'center', valueGetter: (params) => `IDR ${params.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
  { field: 'date', headerName: 'Date', width: 250, headerAlign: 'center', align: 'center', valueGetter: (params) => formatDate(params) },
];

export default function AppView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState([
    {
      startDate: addDays(new Date(), -7),
      endDate: new Date(),
      key: 'selection',
    }
  ]);

  const order = 'asc';
  const orderBy = 'No';
  const [filterName, setFilterName] = useState('');

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
  };

  useEffect(() => {
    getAll().then((res) => {
      setData(res.data.map((row, i) => ({
        ...row,
      })));
      setLoading(false);
    });
  }, []);

  const filterDataByDate = (d, startDate, endDate) => d.filter((item) => {
    const itemDate = parseISO(item.date);
    if (!isValid(itemDate)) return false;
    return itemDate >= startDate && itemDate <= endDate;
  });

  const dataFiltered = applyFilter({
    inputData: filterDataByDate(data, value[0].startDate, value[0].endDate),
    comparator: getComparator(order, orderBy),
    filterName,
  }).map((row, index) => ({
    ...row,
    No: index + 1,
  }));

  const Calender = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formatChartData = (filteredData) => {
    const {startDate} = value[0];
    const {endDate} = value[0];
    const isMonthly = differenceInMonths(endDate, startDate) > 1;
    const isYearly = differenceInYears(endDate, startDate) > 1;

    const groupedData = filteredData.reduce((acc, curr) => {
      const date = parseISO(curr.date);
      if (!isValid(date)) return acc;
      
      let key;
      if (isYearly) {
        key = format(date, 'yyyy');
      } else if (isMonthly) {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }

      if (!acc[key]) {
        acc[key] = 0;
      }

      acc[key] += curr.sales;
      return acc;
    }, {});

    const labels = Object.keys(groupedData).sort();
    const salesData = labels.map((label) => groupedData[label]);

    return { labels, salesData };
  };

  const { labels, salesData } = formatChartData(dataFiltered);

  const formatChartDataForProducts = (filteredData) => {
    const { startDate } = value[0];
    const { endDate } = value[0];
    const isMonthly = differenceInMonths(endDate, startDate) > 1;
    const isYearly = differenceInYears(endDate, startDate) > 1;
  
    // Objek untuk menyimpan penjualan per produk
    const productSales = {};
  
    // Iterasi data penjualan
    filteredData.forEach((item) => {
      const date = parseISO(item.date);
      if (!isValid(date)) return;
  
      let key;
      if (isYearly) {
        key = format(date, 'yyyy');
      } else if (isMonthly) {
        key = format(date, 'yyyy-MM');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }
  
      // Mengakumulasi penjualan produk
      if (!productSales[item.product]) {
        productSales[item.product] = {};
      }
      if (!productSales[item.product][key]) {
        productSales[item.product][key] = 0;
      }
      productSales[item.product][key] += item.sales;
    });
  
    // Mengonversi struktur data menjadi format yang sesuai untuk AppConversionRates
    const series = Object.keys(productSales).map((product) => {
      const d = Object.values(productSales[product]);
      return { label: product, value: d.reduce((total, v) => total + v, 0) };
    });
  
    return { series };
  };
  const { series } = formatChartDataForProducts(dataFiltered);

  const calculateTotalSalesAndRevenue = (filteredData) => {
    let totalSales = 0;
    let totalRevenue = 0;
  
    filteredData.forEach((item) => {
      totalSales += item.sales;
      totalRevenue += item.revenue;
    });
  
    return { totalSales, totalRevenue };
  };
  
  const findBestSellingProduct = (filteredData) => {
    const productSalesMap = {};
  
    filteredData.forEach((item) => {
      if (!productSalesMap[item.product]) {
        productSalesMap[item.product] = 0;
      }
      productSalesMap[item.product] += item.sales;
    });
  
    let bestSellingProduct = '';
    let maxSales = 0;
  
    Object.entries(productSalesMap).forEach(([product, sales]) => {
      if (sales > maxSales) {
        maxSales = sales;
        bestSellingProduct = product;
      }
    });
  
    return bestSellingProduct;
  };

  const { totalSales, totalRevenue } = calculateTotalSalesAndRevenue(dataFiltered);
  const bestSellingProduct = findBestSellingProduct(dataFiltered);
  console.log(bestSellingProduct);
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid container direction="column" xs={12} sm={12} md={12}>
          <Grid container justifyContent="flex-end" spacing={2}>
            <Grid item>
              <Button variant="outlined" onClick={(e) => Calender(e)}>
                Calendar
              </Button>
            </Grid>
          </Grid>
          <Grid container xs={12} sm={12} md={12}>
            <Grid xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title="Total Sales"
                total={totalSales}
                color="success"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_bag.png" />}
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title="Total Revenue"
                total={totalRevenue}
                color="warning"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_buy.png" />}
              />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title="Best Selling Product"
                p={bestSellingProduct}
                color="error"
                icon={<img alt="icon" src="/assets/icons/glass/ic_glass_message.png" />}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid xs={12} md={12} lg={12}>
          <AppWebsiteVisits
            title="Sales Trend"
            chart={{
              labels,
              series: [
                {
                  name: 'Sales',
                  type: 'area',
                  fill: 'gradient',
                  data: salesData,
                },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={12} lg={12}>
          <AppConversionRates
            title="Product Conversion Rates"
            chart={{
              series
            }}
          />
        </Grid>
        <Grid xs={12} md={12} lg={12}>
          <Card>
            <SearchToolbar filterName={filterName} onFilterName={handleFilterByName} />
            <Scrollbar>
              {loading ? (
                <Typography textAlign="center" variant="subtitle2" marginBottom={5}>.....Loading</Typography>
              ) : (
                <Box sx={{ height: 'auto' }}>
                  <DataGrid
                    rows={dataFiltered}
                    columns={DATAGRID_COLUMNS}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                    disableRowSelectionOnClick
                    getRowHeight={() => 'auto'}
                  />
                </Box>
              )}
            </Scrollbar>
          </Card>
        </Grid>
      </Grid>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <DateRangePicker
          onChange={(item) => setValue([item.selection])}
          moveRangeOnFirstSelection={false}
          months={2}
          ranges={value}
          direction="vertical"
        />
      </Popover>
    </Container>
  );
}
