/**
 * Theme Demo Component
 * Demonstrates the new design system in action
 */

import React from 'react';
import styled from 'styled-components';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import { useModernTheme, getColor, getSpacing, getShadow, getBorderRadius } from '../../theme';

const StyledDemoCard = styled(Card)`
  background: ${getColor('neutral.white')};
  border: 1px solid ${getColor('neutral.gray.200')};
  border-radius: ${getBorderRadius('lg')};
  box-shadow: ${getShadow('md')};
  padding: ${getSpacing(6)};
  margin: ${getSpacing(4)};
  
  &:hover {
    box-shadow: ${getShadow('lg')};
    transform: translateY(-2px);
    transition: all 0.2s ease-in-out;
  }
`;

const ColorSwatch = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${getBorderRadius('md')};
  background-color: ${props => props.color};
  border: 1px solid ${getColor('neutral.gray.200')};
  margin: ${getSpacing(2)};
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: ${getSpacing(2)};
  margin: ${getSpacing(4)} 0;
`;

export const ThemeDemo: React.FC = () => {
  const { mode, toggleTheme } = useModernTheme();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Modern Design System Demo
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={toggleTheme}
        sx={{ mb: 3 }}
      >
        Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
      </Button>

      <StyledDemoCard>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Design Tokens in Action
          </Typography>
          
          <Typography variant="body1" paragraph>
            This component demonstrates the new Procore-inspired design system with:
          </Typography>
          
          <ul>
            <li>Modern color palette with semantic colors</li>
            <li>Professional Inter typography</li>
            <li>Consistent spacing scale (4px base unit)</li>
            <li>Subtle shadows and border radius</li>
            <li>Smooth hover transitions</li>
          </ul>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Primary Color Scale
          </Typography>
          <ColorGrid>
            <ColorSwatch color="#f8fafc" title="Primary 50" />
            <ColorSwatch color="#f1f5f9" title="Primary 100" />
            <ColorSwatch color="#e2e8f0" title="Primary 200" />
            <ColorSwatch color="#cbd5e1" title="Primary 300" />
            <ColorSwatch color="#94a3b8" title="Primary 400" />
            <ColorSwatch color="#64748b" title="Primary 500" />
            <ColorSwatch color="#475569" title="Primary 600" />
            <ColorSwatch color="#334155" title="Primary 700" />
            <ColorSwatch color="#1e293b" title="Primary 800" />
            <ColorSwatch color="#0f172a" title="Primary 900" />
          </ColorGrid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary">
              Primary Button
            </Button>
            <Button variant="contained" color="secondary">
              Secondary Button
            </Button>
            <Button variant="outlined" color="primary">
              Outlined Button
            </Button>
            <Button variant="text" color="primary">
              Text Button
            </Button>
          </Box>
        </CardContent>
      </StyledDemoCard>
    </Box>
  );
};