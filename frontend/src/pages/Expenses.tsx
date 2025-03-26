import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category_id: number;
  category_name: string;
}

interface Category {
  id: number;
  name: string;
}

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseData, setExpenseData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
  });

  const queryClient = useQueryClient();

  // Fetch expenses
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/expenses/');
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/categories/');
      return response.data;
    },
  });

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Expense, 'id' | 'category_name'>) => {
      const response = await axios.post('/api/v1/expenses/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      handleClose();
    },
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Expense) => {
      const response = await axios.put(`/api/v1/expenses/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      handleClose();
    },
  });

  // Delete expense mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExpense(null);
    setExpenseData({
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category_id: '',
    });
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setExpenseData({
      amount: expense.amount.toString(),
      description: expense.description,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      category_id: expense.category_id.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      amount: parseFloat(expenseData.amount),
      description: expenseData.description,
      date: expenseData.date,
      category_id: parseInt(expenseData.category_id),
    };

    if (selectedExpense) {
      await updateMutation.mutateAsync({
        ...data,
        id: selectedExpense.id,
        category_name: selectedExpense.category_name,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: ({ value }) => format(new Date(value as string), 'MMM d, yyyy'),
    },
    { field: 'category_name', headerName: 'Category', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Expense
        </Button>
      </Box>

      <DataGrid
        rows={expenses || []}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        pageSizeOptions={[10]}
        disableRowSelectionOnClick
        autoHeight
        loading={expensesLoading}
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Amount"
              type="number"
              fullWidth
              value={expenseData.amount}
              onChange={(e) =>
                setExpenseData({ ...expenseData, amount: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              value={expenseData.description}
              onChange={(e) =>
                setExpenseData({ ...expenseData, description: e.target.value })
              }
              required
            />
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              value={expenseData.date}
              onChange={(e) =>
                setExpenseData({ ...expenseData, date: e.target.value })
              }
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              margin="dense"
              label="Category"
              fullWidth
              value={expenseData.category_id}
              onChange={(e) =>
                setExpenseData({ ...expenseData, category_id: e.target.value })
              }
              required
              SelectProps={{ native: true }}
            >
              <option value="">Select a category</option>
              {categories?.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" color="primary">
              {selectedExpense ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 