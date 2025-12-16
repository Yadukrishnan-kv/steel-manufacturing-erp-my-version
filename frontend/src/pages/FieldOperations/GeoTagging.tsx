import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  PhotoCamera,
  AccessTime,
  Person,
  Work,
  Visibility,
  CheckCircle,
} from '@mui/icons-material';

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

interface FieldActivity {
  id: string;
  employeeId: string;
  employeeName: string;
  activityType: 'Site Visit' | 'Installation' | 'Service Call' | 'Quality Check' | 'Delivery';
  location: GeoLocation;
  address: string;
  startTime: Date;
  endTime?: Date;
  status: 'In Progress' | 'Completed' | 'Pending Approval';
  photos: string[];
  notes: string;
  customerName?: string;
  orderId?: string;
}

// Mock data
const mockActivities: FieldActivity[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'Rajesh Kumar',
    activityType: 'Installation',
    location: {
      latitude: 10.8505,
      longitude: 76.2711,
      accuracy: 5,
      timestamp: new Date(),
    },
    address: 'MG Road, Kochi, Kerala 682016',
    startTime: new Date('2024-01-15T09:30:00'),
    endTime: new Date('2024-01-15T14:30:00'),
    status: 'Completed',
    photos: ['photo1.jpg', 'photo2.jpg'],
    notes: 'Installation completed successfully. Customer satisfied with the work.',
    customerName: 'ABC Steel Works',
    orderId: 'ORD-001',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Priya Sharma',
    activityType: 'Site Visit',
    location: {
      latitude: 11.0168,
      longitude: 76.9558,
      accuracy: 8,
      timestamp: new Date(),
    },
    address: 'Coimbatore Road, Tamil Nadu 641001',
    startTime: new Date('2024-01-15T11:00:00'),
    status: 'In Progress',
    photos: ['photo3.jpg'],
    notes: 'Site measurement in progress. Customer requirements being documented.',
    customerName: 'XYZ Construction',
  },
];

const GeoTagging: React.FC = () => {
  const [activities, setActivities] = useState<FieldActivity[]>(mockActivities);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<FieldActivity | null>(null);
  const [newActivity, setNewActivity] = useState({
    activityType: 'Site Visit',
    customerName: '',
    orderId: '',
    notes: '',
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          });
          setLocationError('');
        },
        () => {
          setLocationError('Unable to retrieve location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  const handleStartActivity = () => {
    if (!currentLocation) {
      setLocationError('Please enable location services to start an activity.');
      return;
    }

    const activity: FieldActivity = {
      id: Date.now().toString(),
      employeeId: 'EMP001', // Current user
      employeeName: 'Current User',
      activityType: newActivity.activityType as any,
      location: currentLocation,
      address: 'Fetching address...', // In real app, reverse geocode
      startTime: new Date(),
      status: 'In Progress',
      photos: [],
      notes: newActivity.notes,
      customerName: newActivity.customerName,
      orderId: newActivity.orderId,
    };

    setActivities([activity, ...activities]);
    setOpenDialog(false);
    setNewActivity({
      activityType: 'Site Visit',
      customerName: '',
      orderId: '',
      notes: '',
    });
  };

  const handleCompleteActivity = (activityId: string) => {
    setActivities(activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, status: 'Completed' as const, endTime: new Date() }
        : activity
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending Approval': return 'warning';
      default: return 'default';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Installation': return <Work />;
      case 'Site Visit': return <LocationOn />;
      case 'Service Call': return <Person />;
      case 'Quality Check': return <CheckCircle />;
      case 'Delivery': return <Work />;
      default: return <LocationOn />;
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Field Operations - Geo Tagging
      </Typography>

      {/* Current Location Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MyLocation color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Current Location</Typography>
              </Box>
              {currentLocation ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Latitude: {currentLocation.latitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Longitude: {currentLocation.longitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {currentLocation.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Location not available
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<MyLocation />}
                  onClick={getCurrentLocation}
                >
                  Refresh Location
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LocationOn />}
                  onClick={() => setOpenDialog(true)}
                  disabled={!currentLocation}
                >
                  Start Activity
                </Button>
              </Box>
            </Grid>
          </Grid>
          {locationError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {locationError}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Activity Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Today's Activities
              </Typography>
              <Typography variant="h5">
                {activities.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Progress
              </Typography>
              <Typography variant="h5" color="info.main">
                {activities.filter(a => a.status === 'In Progress').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h5" color="success.main">
                {activities.filter(a => a.status === 'Completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Hours
              </Typography>
              <Typography variant="h5">
                {activities
                  .filter(a => a.endTime)
                  .reduce((total, a) => {
                    const duration = (a.endTime!.getTime() - a.startTime.getTime()) / (1000 * 60 * 60);
                    return total + duration;
                  }, 0)
                  .toFixed(1)}h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activities List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Field Activities
          </Typography>
          <List>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getStatusColor(activity.status) + '.main' }}>
                      {getActivityIcon(activity.activityType)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {activity.activityType}
                        </Typography>
                        <Chip
                          label={activity.status}
                          color={getStatusColor(activity.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <Person sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {activity.employeeName}
                          {activity.customerName && (
                            <>
                              {' • '}
                              <strong>{activity.customerName}</strong>
                            </>
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {activity.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          {activity.startTime.toLocaleTimeString()}
                          {activity.endTime && ` - ${activity.endTime.toLocaleTimeString()}`}
                          {' • Duration: '}
                          {formatDuration(activity.startTime, activity.endTime)}
                        </Typography>
                        {activity.notes && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            "{activity.notes}"
                          </Typography>
                        )}
                        {activity.photos.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <PhotoCamera sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {activity.photos.length} photo(s) attached
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {activity.status === 'In Progress' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleCompleteActivity(activity.id)}
                        >
                          Complete
                        </Button>
                      )}
                      <IconButton size="small" onClick={() => setSelectedActivity(activity)}>
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < activities.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Start Activity Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Field Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Activity Type</InputLabel>
                <Select
                  value={newActivity.activityType}
                  label="Activity Type"
                  onChange={(e) => setNewActivity({ ...newActivity, activityType: e.target.value })}
                >
                  <MenuItem value="Site Visit">Site Visit</MenuItem>
                  <MenuItem value="Installation">Installation</MenuItem>
                  <MenuItem value="Service Call">Service Call</MenuItem>
                  <MenuItem value="Quality Check">Quality Check</MenuItem>
                  <MenuItem value="Delivery">Delivery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newActivity.customerName}
                onChange={(e) => setNewActivity({ ...newActivity, customerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order ID (Optional)"
                value={newActivity.orderId}
                onChange={(e) => setNewActivity({ ...newActivity, orderId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={newActivity.notes}
                onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
              />
            </Grid>
            {currentLocation && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Location:</strong><br />
                    Lat: {currentLocation.latitude.toFixed(6)}, 
                    Lng: {currentLocation.longitude.toFixed(6)}<br />
                    Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStartActivity}>
            Start Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Details Dialog */}
      <Dialog 
        open={!!selectedActivity} 
        onClose={() => setSelectedActivity(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedActivity && (
          <>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Activity Type</Typography>
                  <Typography variant="body1">{selectedActivity.activityType}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedActivity.status}
                    color={getStatusColor(selectedActivity.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{selectedActivity.address}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coordinates: {selectedActivity.location.latitude.toFixed(6)}, {selectedActivity.location.longitude.toFixed(6)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Start Time</Typography>
                  <Typography variant="body1">{selectedActivity.startTime.toLocaleString()}</Typography>
                </Grid>
                {selectedActivity.endTime && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">End Time</Typography>
                    <Typography variant="body1">{selectedActivity.endTime.toLocaleString()}</Typography>
                  </Grid>
                )}
                {selectedActivity.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                    <Typography variant="body1">{selectedActivity.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedActivity(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GeoTagging;