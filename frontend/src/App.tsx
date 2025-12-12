import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

const App: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Steel Manufacturing ERP
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Steel Manufacturing ERP System
        </Typography>
        
        <Routes>
          <Route path="/" element={
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Dashboard</Typography>
              <Typography variant="body2">
                The ERP system is being set up. More features will be available soon.
              </Typography>
            </Box>
          } />
        </Routes>
      </Box>
    </Container>
  );
};

export default App;