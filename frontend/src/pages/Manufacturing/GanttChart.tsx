import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewWeek as ViewWeekIcon,
  ViewDay as ViewDayIcon,
  ViewModule as ViewModuleIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetGanttChartDataQuery,
  useGetProductionOrdersQuery,
} from '../../services/api';

interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  workCenter: string;
  priority: number;
  dependencies?: string[];
}

interface GanttResource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  utilization: number;
}

const GanttChart: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);

  // API hooks
  const {
    data: ganttData,
    isLoading,
    error,
    refetch,
  } = useGetGanttChartDataQuery({
    branchId: selectedBranch || undefined,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const { data: productionOrders } = useGetProductionOrdersQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    branchId: selectedBranch || undefined,
  });

  // Mock Gantt data for demonstration
  const mockTasks: GanttTask[] = ganttData?.tasks || [
    {
      id: '1',
      name: 'PO-2024-001 - Steel Frame Assembly',
      startDate: '2024-12-16',
      endDate: '2024-12-20',
      progress: 65,
      status: 'IN_PROGRESS',
      workCenter: 'Assembly Line 1',
      priority: 8,
    },
    {
      id: '2',
      name: 'PO-2024-002 - CNC Machining Parts',
      startDate: '2024-12-17',
      endDate: '2024-12-19',
      progress: 30,
      status: 'IN_PROGRESS',
      workCenter: 'CNC Machine Center',
      priority: 6,
    },
    {
      id: '3',
      name: 'PO-2024-003 - Welding Operations',
      startDate: '2024-12-18',
      endDate: '2024-12-22',
      progress: 0,
      status: 'SCHEDULED',
      workCenter: 'Welding Station 1',
      priority: 5,
    },
    {
      id: '4',
      name: 'PO-2024-004 - Quality Inspection',
      startDate: '2024-12-21',
      endDate: '2024-12-23',
      progress: 0,
      status: 'SCHEDULED',
      workCenter: 'QC Station',
      priority: 7,
      dependencies: ['1', '2'],
    },
  ];

  const mockResources: GanttResource[] = ganttData?.resources || [
    { id: '1', name: 'Assembly Line 1', type: 'ASSEMBLY', capacity: 24, utilization: 85 },
    { id: '2', name: 'CNC Machine Center', type: 'MACHINING', capacity: 24, utilization: 70 },
    { id: '3', name: 'Welding Station 1', type: 'WELDING', capacity: 16, utilization: 60 },
    { id: '4', name: 'QC Station', type: 'QUALITY', capacity: 8, utilization: 40 },
  ];

  // Status configuration
  const statusConfig = {
    SCHEDULED: { color: '#fff3e0', textColor: '#f57c00', label: 'Scheduled' },
    IN_PROGRESS: { color: theme.palette.primary.main, textColor: 'white', label: 'In Progress' },
    COMPLETED: { color: '#e8f5e8', textColor: '#2e7d32', label: 'Completed' },
    ON_HOLD: { color: '#ffebee', textColor: '#d32f2f', label: 'On Hold' },
  };

  // Priority colors
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#d32f2f'; // High priority - red
    if (priority >= 5) return '#f57c00'; // Medium priority - orange
    return '#2e7d32'; // Low priority - green
  };

  // Generate time grid based on view mode
  const generateTimeGrid = () => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const timeGrid = generateTimeGrid();

  // Calculate task position and width
  const getTaskStyle = (task: GanttTask) => {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    const gridStart = new Date(dateRange.start);
    const totalDays = timeGrid.length;
    
    const startOffset = Math.max(0, (startDate.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000));
    const duration = (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return {
      left: `${left}%`,
      width: `${Math.max(width, 2)}%`, // Minimum 2% width for visibility
    };
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
              <TimelineIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Production Gantt Chart
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Visual production schedule and resource planning
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={() => refetch()}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Controls Section */}
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          mb: 1.5,
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <TextField
            size="small"
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ 
              minWidth: 140,
              '& .MuiInputBase-input': { fontSize: '0.75rem' }
            }}
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ 
              minWidth: 140,
              '& .MuiInputBase-input': { fontSize: '0.75rem' }
            }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>View Mode</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'day' | 'week' | 'month')}
              label="View Mode"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="day">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewDayIcon sx={{ fontSize: 16 }} />
                  Day
                </Box>
              </MenuItem>
              <MenuItem value="week">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewWeekIcon sx={{ fontSize: 16 }} />
                  Week
                </Box>
              </MenuItem>
              <MenuItem value="month">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewModuleIcon sx={{ fontSize: 16 }} />
                  Month
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Zoom Out">
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                sx={{ p: 0.5 }}
              >
                <ZoomOutIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 40, textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton
                size="small"
                onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                sx={{ p: 0.5 }}
              >
                <ZoomInIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Active Tasks
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {mockTasks.filter(t => t.status === 'IN_PROGRESS').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Scheduled Tasks
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {mockTasks.filter(t => t.status === 'SCHEDULED').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Avg Resource Utilization
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {Math.round(mockResources.reduce((sum, r) => sum + r.utilization, 0) / mockResources.length)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Critical Path Tasks
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {mockTasks.filter(t => t.priority >= 8).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gantt Chart */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Time Header */}
            <Box sx={{ 
              display: 'flex', 
              borderBottom: '2px solid', 
              borderColor: 'divider',
              bgcolor: theme.palette.primary.main,
              color: 'white'
            }}>
              <Box sx={{ 
                width: 250, 
                p: 1, 
                borderRight: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Task / Resource
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex' }}>
                {timeGrid.map((date, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      p: 0.5,
                      borderRight: index < timeGrid.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                      textAlign: 'center',
                      minWidth: 60 * zoomLevel,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                      {date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        ...(viewMode === 'day' && { weekday: 'short' })
                      })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Gantt Rows */}
            <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
              {mockResources.map((resource, resourceIndex) => {
                const resourceTasks = mockTasks.filter(task => task.workCenter === resource.name);
                
                return (
                  <Box key={resource.id}>
                    {/* Resource Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      borderBottom: '1px solid', 
                      borderColor: 'divider',
                      bgcolor: '#f8f9fa',
                      minHeight: 40
                    }}>
                      <Box sx={{ 
                        width: 250, 
                        p: 1, 
                        borderRight: '1px solid', 
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {resource.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                            {resource.type} • {resource.capacity}h capacity
                          </Typography>
                        </Box>
                        <Chip
                          label={`${resource.utilization}%`}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: resource.utilization >= 85 ? '#ffebee' : 
                                     resource.utilization >= 70 ? '#fff3e0' : '#e8f5e8',
                            color: resource.utilization >= 85 ? '#d32f2f' : 
                                   resource.utilization >= 70 ? '#f57c00' : '#2e7d32',
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, position: 'relative' }}>
                        {/* Time grid lines */}
                        {timeGrid.map((_, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'absolute',
                              left: `${(index / timeGrid.length) * 100}%`,
                              top: 0,
                              bottom: 0,
                              width: 1,
                              bgcolor: 'divider',
                              opacity: 0.3,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Tasks for this resource */}
                    {resourceTasks.map((task, taskIndex) => (
                      <Box key={task.id} sx={{ 
                        display: 'flex', 
                        borderBottom: taskIndex < resourceTasks.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        minHeight: 50,
                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' }
                      }}>
                        <Box sx={{ 
                          width: 250, 
                          p: 1, 
                          borderRight: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              {task.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              <Chip
                                label={statusConfig[task.status as keyof typeof statusConfig]?.label}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  bgcolor: statusConfig[task.status as keyof typeof statusConfig]?.color,
                                  color: statusConfig[task.status as keyof typeof statusConfig]?.textColor,
                                }}
                              />
                              <Chip
                                label={`P${task.priority}`}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  bgcolor: getPriorityColor(task.priority),
                                  color: 'white',
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, position: 'relative', p: 1 }}>
                          {/* Time grid lines */}
                          {timeGrid.map((_, index) => (
                            <Box
                              key={index}
                              sx={{
                                position: 'absolute',
                                left: `${(index / timeGrid.length) * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: 1,
                                bgcolor: 'divider',
                                opacity: 0.2,
                              }}
                            />
                          ))}
                          
                          {/* Task Bar */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: 24,
                              bgcolor: statusConfig[task.status as keyof typeof statusConfig]?.color,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: statusConfig[task.status as keyof typeof statusConfig]?.textColor,
                              ...getTaskStyle(task),
                            }}
                            onClick={() => setSelectedTask(task)}
                          >
                            {/* Progress Bar */}
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${task.progress}%`,
                                bgcolor: statusConfig[task.status as keyof typeof statusConfig]?.textColor,
                                borderRadius: 1,
                                opacity: 0.3,
                              }}
                            />
                            
                            {/* Task Label */}
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                color: statusConfig[task.status as keyof typeof statusConfig]?.textColor,
                                px: 0.5,
                                position: 'relative',
                                zIndex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {task.progress}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}

                    {resourceTasks.length === 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        minHeight: 40
                      }}>
                        <Box sx={{ 
                          width: 250, 
                          p: 1, 
                          borderRight: '1px solid', 
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            No tasks scheduled
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', mb: 1 }}>
              Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: config.color,
                      border: '1px solid',
                      borderColor: config.textColor,
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {config.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Loading and Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading Gantt chart data...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load Gantt chart data. Please try again.
          </Alert>
        )}
    </Box>
  );
};

export default GanttChart;