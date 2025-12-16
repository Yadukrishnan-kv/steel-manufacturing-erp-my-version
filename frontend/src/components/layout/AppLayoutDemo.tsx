/**
 * AppLayout Demo Component
 * A demo component to test the modernized AppLayout functionality
 */

import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

const AppLayoutDemo: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Modern AppLayout Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This page demonstrates the modernized AppLayout with the new navigation components.
        The layout includes:
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modern AppBar
              </Typography>
              <Typography variant="body2">
                • Compact, professional styling
                • User menu with profile and settings
                • Responsive mobile menu button
                • Search and notifications (when enabled)
                • Theme toggle support
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Modern Sidebar
              </Typography>
              <Typography variant="body2">
                • Collapsible design with smooth animations
                • Icon-only mode with tooltips
                • Hierarchical navigation with expand/collapse
                • Active state highlighting
                • Responsive mobile drawer
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Responsive Design
              </Typography>
              <Typography variant="body2">
                • Desktop: Fixed sidebar with collapse toggle
                • Mobile: Drawer overlay navigation
                • Tablet: Optimized touch interactions
                • Persistent sidebar state
                • Smooth transitions between breakpoints
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preserved Functionality
              </Typography>
              <Typography variant="body2">
                • All existing routes and navigation paths
                • User authentication and logout
                • Redux state management integration
                • API calls and data handling
                • Form validations and workflows
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Testing Instructions
        </Typography>
        <Typography variant="body2" component="div">
          <ol>
            <li>Try collapsing/expanding the sidebar using the toggle button</li>
            <li>Resize the browser window to test responsive behavior</li>
            <li>On mobile, use the hamburger menu to open the navigation drawer</li>
            <li>Navigate between different sections to test routing</li>
            <li>Test the user menu in the top-right corner</li>
            <li>Verify all existing functionality still works</li>
          </ol>
        </Typography>
      </Box>
    </Box>
  );
};

export default AppLayoutDemo;