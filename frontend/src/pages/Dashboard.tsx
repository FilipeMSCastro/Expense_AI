import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ExpenseSummary {
  total: number;
  byCategory: Record<string, number>;
  monthly: Record<string, number>;
}

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery<ExpenseSummary>({
    queryKey: ['expenseSummary'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/expenses/summary');
      return response.data;
    },
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  const monthlyData = {
    labels: Object.keys(summary?.monthly || {}),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: Object.values(summary?.monthly || {}),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const categoryData = {
    labels: Object.keys(summary?.byCategory || {}),
    datasets: [
      {
        data: Object.values(summary?.byCategory || {}),
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
        ],
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Total Expenses Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4">
                ${summary?.total.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Expense Trend
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={monthlyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Category Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right' as const,
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            {/* Add a table or list of recent transactions here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 