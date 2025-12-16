import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  ArrowBack as ArrowBackIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetCalendarViewDataQuery,
  useGetProductionOrdersQuery,
} from '../../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: 'production' | 'maintenance' | 'delivery' | 'inspection';
  status: string;
  priority: number;
  workCenter?: string;
  details?: any;
}

const CalendarView: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [eventDialog, setEventDialog] = useState(false);

  // Calculate date range based on view mode
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (viewMode === 'week') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      end.setDate(start.getDate() + 6);
    } else {
      // day view - same day
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const dateRange = getDateRange();

  // API hooks
  const {
    data: calendarData,
    isLoading,
    error,
    refetch,
  } = useGetCalendarViewDataQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Mock calendar events for demonstration
  const mockEvents: CalendarEvent[] = calendarData?.events || [
    {
      id: '1',
      title: 'PO-2024-001 - Steel Frame Assembly',
      startDate: '2024-12-16',
      endDate: '2024-12-20',
      type: 'production',
      status: 'IN_PROGRESS',
      priority: 8,
      workCenter: 'Assembly Line 1',
    },
    {
      id: '2',
      title: 'CNC Machine Maintenance',
      startDate: '2024-12-18',
      endDate: '2024-12-18',
      type: 'maintenance',
      status: 'SCHEDULED',
      priority: 9,
      workCenter: 'CNC Machine Center',
    },
    {
      id: '3',
      title: 'Quality Inspection - Batch 001',
      startDate: '2024-12-19',
      endDate: '2024-12-19',
      type: 'inspection',
      status: 'SCHEDULED',
      priority: 7,
      workCenter: 'QC Station',
    },
    {
      id: '4',
      title: 'Customer Delivery - ABC Corp',
      startDate: '2024-12-22',
      endDate: '2024-12-22',
      type: 'delivery',
      status: 'SCHEDULED',
      priority: 8,
    },
  ];

  // Event type configuration
  const eventTypeConfig = {
    production: { color: theme.palette.primary.main, textColor: 'white', label: 'Production', icon: <EventIcon /> },
    maintenance: { color: '#f57c00', textColor: 'white', label: 'Maintenance', icon: <ScheduleIcon /> },
    delivery: { color: '#2e7d32', textColor: 'white', label: 'Delivery', icon: <EventIcon /> },
    inspection: { color: '#9c27b0', textColor: 'white', label: 'Inspection', icon: <EventIcon /> },
  };

  // Status configuration
  const statusConfig = {
    SCHEDULED: { color: '#fff3e0', textColor: '#f57c00', label: 'Scheduled' },
    IN_PROGRESS: { color: theme.palette.primary.main, textColor: 'white', label: 'In Progress' },
    COMPLETED: { color: '#e8f5e8', textColor: '#2e7d32', label: 'Completed' },
    CANCELLED: { color: '#ffebee', textColor: '#d32f2f', label: 'Cancelled' },
  };

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const events = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedEvents(events);
    if (events.length > 0) {
      setEventDialog(true);
    }
  };

  // Generate calendar grid for month view
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      days.push(weekDays);
      
      // Stop if we've covered the entire month and the next week starts in the next month
      if (current.getMonth() !== month && weekDays[6].getMonth() !== month) {
        break;
      }
    }
    
    return days;
  };

  const monthGrid = generateMonthGrid();

  // Get current view title
  const getViewTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          pb: 1,
          borderBottom: '2px solid',
          borderColor: theme.palette.primary.main,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={() => navigate('/manufacturing')}
              sx={{ p: 0.5 }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalendarIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Production Calendar
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Schedule overview and event management
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant={viewMode === 'day' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<ViewDayIcon sx={{ fontSize: 16 }} />}
              onClick={() => setViewMode('day')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<ViewWeekIcon sx={{ fontSize: 16 }} />}
              onClick={() => setViewMode('week')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
              size="small"
              startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
              onClick={() => setViewMode('month')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Month
            </Button>
          </Box>
        </Box>

        {/* Navigation Controls */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={navigatePrevious} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, minWidth: 200, textAlign: 'center' }}>
              {getViewTitle()}
            </Typography>
            <IconButton onClick={navigateNext} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
            onClick={goToToday}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Today
          </Button>
        </Box>

        {/* Event Type Legend */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <Chip
              key={type}
              icon={config.icon}
              label={config.label}
              size="small"
              sx={{
                bgcolor: config.color,
                color: config.textColor,
                fontWeight: 600,
                height: 28,
                fontSize: '0.75rem',
                '& .MuiChip-icon': { 
                  color: config.textColor, 
                  fontSize: 16 
                }
              }}
            />
          ))}
        </Box>

        {/* Calendar Grid */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {viewMode === 'month' && (
              <Box>
                {/* Day Headers */}
                <Grid container sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs key={day} sx={{ p: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                {/* Calendar Days */}
                {monthGrid.map((week, weekIndex) => (
                  <Grid container key={weekIndex} sx={{ minHeight: 120 }}>
                    {week.map((date, dayIndex) => {
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dayEvents = getEventsForDate(date);

                      return (
                        <Grid 
                          item 
                          xs 
                          key={dayIndex}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            p: 0.5,
                            cursor: 'pointer',
                            bgcolor: isCurrentMonth ? 'white' : 'grey.50',
                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' },
                            ...(isToday && {
                              bgcolor: `${theme.palette.primary.light}15`,
                              borderColor: theme.palette.primary.main,
                            })
                          }}
                          onClick={() => handleDateClick(date)}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: '0.75rem', 
                              fontWeight: isToday ? 600 : 400,
                              color: isCurrentMonth ? 'text.primary' : 'text.secondary',
                              mb: 0.5
                            }}
                          >
                            {date.getDate()}
                          </Typography>
                          
                          {/* Events */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            {dayEvents.slice(0, 3).map((event) => (
                              <Box
                                key={event.id}
                                sx={{
                                  bgcolor: eventTypeConfig[event.type]?.color,
                                  color: eventTypeConfig[event.type]?.textColor,
                                  borderRadius: 0.5,
                                  px: 0.5,
                                  py: 0.25,
                                  fontSize: '0.65rem',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {event.title}
                              </Box>
                            ))}
                            {dayEvents.length > 3 && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                                +{dayEvents.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                ))}
              </Box>
            )}

            {/* Week and Day views would be implemented similarly */}
            {(viewMode === 'week' || viewMode === 'day') && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  {viewMode === 'week' ? 'Week' : 'Day'} view implementation coming soon
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Events for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </DialogTitle>
          <DialogContent>
            <List>
              {selectedEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: eventTypeConfig[event.type]?.color,
                            }}
                          />
                          <Typography variant="subtitle2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {event.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            Type: {eventTypeConfig[event.type]?.label}
                          </Typography>
                          {event.workCenter && (
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Work Center: {event.workCenter}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Chip
                              label={statusConfig[event.status as keyof typeof statusConfig]?.label}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: statusConfig[event.status as keyof typeof statusConfig]?.color,
                                color: statusConfig[event.status as keyof typeof statusConfig]?.textColor,
                              }}
                            />
                            <Chip
                              label={`Priority: ${event.priority}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: event.priority >= 8 ? '#d32f2f' : event.priority >= 5 ? '#f57c00' : '#2e7d32',
                                color: 'white',
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < selectedEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEventDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Loading and Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading calendar data...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load calendar data. Please try again.
          </Alert>
        )}
    </Box>
  );
};

export default CalendarView;