import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
  });

  const queryClient = useQueryClient();

  // Fetch expenses
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/expenses/');
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/categories/');
      return response.data;
    },
  });

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: async (newExpense: Omit<Expense, 'id'>) => {
      const response = await axios.post('/api/v1/expenses/', newExpense);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      handleClose();
    },
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedExpense: Expense) => {
      const response = await axios.put(`/api/v1/expenses/${updatedExpense.id}`, updatedExpense);
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

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      valueFormatter: (params) => format(new Date(params.value), 'MM/dd/yyyy'),
    },
    { field: 'category_name', headerName: 'Category', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          <IconButton onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleOpen = () => {
    setSelectedExpense(null);
    setFormData({
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      category_id: '',
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
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
    const expenseData = {
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: formData.date,
      category_id: parseInt(formData.category_id),
    };

    if (selectedExpense) {
      await updateMutation.mutateAsync({
        ...expenseData,
        id: selectedExpense.id,
      });
    } else {
      await createMutation.mutateAsync(expenseData);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Expenses</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Expense
        </Button>
      </Box>

      <DataGrid
        rows={expenses || []}
        columns={columns}
        loading={isLoading}
        autoHeight
      />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  required
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select a category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedExpense ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
 