import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface UserProfile {
  username: string;
  email: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UserProfile>({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: UserProfile) => {
      const response = await axios.put('/api/v1/users/profile', profileData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccess('Profile updated successfully');
      setError('');
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update profile');
      setSuccess('');
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: {
      current_password: string;
      new_password: string;
    }) => {
      const response = await axios.put('/api/v1/users/password', passwordData);
      return response.data;
    },
    onSuccess: () => {
      setSuccess('Password updated successfully');
      setError('');
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
    },
    onError: (error: any) => {
      setError(error.response?.data?.detail || 'Failed to update password');
      setSuccess('');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfileMutation.mutateAsync({
        username: formData.username,
        email: formData.email,
      });
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (!formData.current_password || !formData.new_password) {
      setError('Please fill in all password fields');
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
    } catch (error) {
      console.error('Password update failed:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <form onSubmit={handleProfileUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <form onSubmit={handlePasswordUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="current_password"
                    type="password"
                    value={formData.current_password || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="new_password"
                    type="password"
                    value={formData.new_password || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password || ''}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 