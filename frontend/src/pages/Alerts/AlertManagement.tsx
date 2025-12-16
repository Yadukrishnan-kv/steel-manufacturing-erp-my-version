import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Settings,
  Email,
  Sms,
  WhatsApp,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'Production' | 'Sales' | 'Quality' | 'Service' | 'HR' | 'Finance' | 'System';
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignedTo: string;
  escalationLevel: number;
  channels: ('email' | 'sms' | 'whatsapp' | 'app')[];
  slaDeadline: Date;
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

interface NotificationRule {
  id: string;
  name: string;
  category: string;
  condition: string;
  priority: string;
  channels: string[];
  recipients: string[];
  escalationRules: {
    level: number;
    delayMinutes: number;
    recipients: string[];
  }[];
  isActive: boolean;
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'Production Delay Alert',
    message: 'Production order PO-001 is running 2 hours behind schedule',
    type: 'warning',
    priority: 'high',
    category: 'Production',
    status: 'active',
    createdAt: new Date('2024-01-15T10:30:00'),
    assignedTo: 'Rajesh Kumar',
    escalationLevel: 1,
    channels: ['email', 'app'],
    slaDeadline: new Date('2024-01-15T16:00:00'),
    relatedEntity: {
      type: 'ProductionOrder',
      id: 'PO-001',
      name: 'Steel Door - Batch 1',
    },
  },
  {
    id: '2',
    title: 'Quality Check Failed',
    message: 'QC inspection failed for order SO-123. Rework required.',
    type: 'error',
    priority: 'critical',
    category: 'Quality',
    status: 'escalated',
    createdAt: new Date('2024-01-15T09:15:00'),
    acknowledgedAt: new Date('2024-01-15T09:45:00'),
    assignedTo: 'Amit Singh',
    escalationLevel: 2,
    channels: ['email', 'sms', 'whatsapp'],
    slaDeadline: new Date('2024-01-15T12:00:00'),
    relatedEntity: {
      type: 'SalesOrder',
      id: 'SO-123',
      name: 'Window Frame Order',
    },
  },
  {
    id: '3',
    title: 'Low Stock Alert',
    message: 'Steel sheets inventory below minimum threshold (5 units remaining)',
    type: 'warning',
    priority: 'medium',
    category: 'Production',
    status: 'acknowledged',
    createdAt: new Date('2024-01-15T08:00:00'),
    acknowledgedAt: new Date('2024-01-15T08:30:00'),
    assignedTo: 'Inventory Manager',
    escalationLevel: 0,
    channels: ['email', 'app'],
    slaDeadline: new Date('2024-01-16T08:00:00'),
  },
];

const mockNotificationRules: NotificationRule[] = [
  {
    id: '1',
    name: 'Production Delay Notification',
    category: 'Production',
    condition: 'Production order delay > 1 hour',
    priority: 'high',
    channels: ['email', 'app'],
    recipients: ['production.manager@company.com'],
    escalationRules: [
      { level: 1, delayMinutes: 60, recipients: ['gm@company.com'] },
      { level: 2, delayMinutes: 120, recipients: ['ceo@company.com'] },
    ],
    isActive: true,
  },
  {
    id: '2',
    name: 'Quality Failure Alert',
    category: 'Quality',
    condition: 'QC inspection status = Failed',
    priority: 'critical',
    channels: ['email', 'sms', 'whatsapp'],
    recipients: ['qc.manager@company.com', 'production.manager@company.com'],
    escalationRules: [
      { level: 1, delayMinutes: 30, recipients: ['gm@company.com'] },
    ],
    isActive: true,
  },
];

const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>(mockNotificationRules);
  const [selectedTab, setSelectedTab] = useState(0);
  // const [openDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'info': return <Info color="info" />;
      case 'success': return <CheckCircle color="success" />;
      default: return <Notifications />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'acknowledged': return 'warning';
      case 'resolved': return 'success';
      case 'escalated': return 'secondary';
      default: return 'default';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
    return true;
  });

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const, acknowledgedAt: new Date() }
        : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const, resolvedAt: new Date() }
        : alert
    ));
  };

  const toggleNotificationRule = (ruleId: string) => {
    setNotificationRules(notificationRules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const AlertsTab = () => (
    <>
      {/* Alert Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Alerts
                  </Typography>
                  <Typography variant="h5">
                    {alerts.filter(a => a.status === 'active').length}
                  </Typography>
                </Box>
                <Badge badgeContent={alerts.filter(a => a.status === 'active').length} color="error">
                  <NotificationsActive color="error" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Critical Alerts
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {alerts.filter(a => a.priority === 'critical').length}
                  </Typography>
                </Box>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Escalated
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {alerts.filter(a => a.status === 'escalated').length}
                  </Typography>
                </Box>
                <Warning color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Resolved Today
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {alerts.filter(a => a.status === 'resolved').length}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert List
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>SLA Deadline</TableCell>
                  <TableCell>Channels</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getAlertIcon(alert.type)}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {alert.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.message}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{alert.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={alert.priority}
                        color={getPriorityColor(alert.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status}
                        color={getStatusColor(alert.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{alert.assignedTo}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alert.slaDeadline.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {alert.channels.includes('email') && <Email fontSize="small" />}
                        {alert.channels.includes('sms') && <Sms fontSize="small" />}
                        {alert.channels.includes('whatsapp') && <WhatsApp fontSize="small" />}
                        {alert.channels.includes('app') && <Notifications fontSize="small" />}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {alert.status === 'active' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {(alert.status === 'acknowledged' || alert.status === 'escalated') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        <IconButton size="small" onClick={() => setSelectedAlert(alert)}>
                          <Visibility />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );

  const NotificationRulesTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Notification Rules</Typography>
          <Button variant="contained" startIcon={<Settings />}>
            Add Rule
          </Button>
        </Box>
        <List>
          {notificationRules.map((rule, index) => (
            <React.Fragment key={rule.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: rule.isActive ? 'success.main' : 'grey.400' }}>
                    <Settings />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={rule.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Category: {rule.category} • Priority: {rule.priority}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Condition: {rule.condition}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {rule.channels.includes('email') && <Email fontSize="small" />}
                        {rule.channels.includes('sms') && <Sms fontSize="small" />}
                        {rule.channels.includes('whatsapp') && <WhatsApp fontSize="small" />}
                        {rule.channels.includes('app') && <Notifications fontSize="small" />}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={rule.isActive}
                      onChange={() => toggleNotificationRule(rule.id)}
                    />
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              {index < notificationRules.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Alert & Notification Management
      </Typography>

      <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Active Alerts" />
        <Tab label="Notification Rules" />
        <Tab label="Alert History" />
      </Tabs>

      {selectedTab === 0 && <AlertsTab />}
      {selectedTab === 1 && <NotificationRulesTab />}
      {selectedTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6">Alert History</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Historical alert data and analytics will be displayed here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Alert Details Dialog */}
      <Dialog 
        open={!!selectedAlert} 
        onClose={() => setSelectedAlert(null)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedAlert.title}</Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>{selectedAlert.message}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{selectedAlert.category}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip
                    label={selectedAlert.priority}
                    color={getPriorityColor(selectedAlert.priority) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip
                    label={selectedAlert.status}
                    color={getStatusColor(selectedAlert.status) as any}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1">{selectedAlert.assignedTo}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body1">{selectedAlert.createdAt.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">SLA Deadline</Typography>
                  <Typography variant="body1">{selectedAlert.slaDeadline.toLocaleString()}</Typography>
                </Grid>
                {selectedAlert.relatedEntity && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Related Entity</Typography>
                    <Typography variant="body1">
                      {selectedAlert.relatedEntity.type}: {selectedAlert.relatedEntity.name} ({selectedAlert.relatedEntity.id})
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAlert(null)}>Close</Button>
              {selectedAlert.status === 'active' && (
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    handleAcknowledgeAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  Acknowledge
                </Button>
              )}
              {(selectedAlert.status === 'acknowledged' || selectedAlert.status === 'escalated') && (
                <Button 
                  variant="contained" 
                  color="success"
                  onClick={() => {
                    handleResolveAlert(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                >
                  Resolve
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AlertManagement;