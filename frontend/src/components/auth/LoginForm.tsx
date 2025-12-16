import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Chip, Divider, Grid, Container } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import styled from 'styled-components';
import { useLoginMutation } from '../../services/api';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import type { LoginCredentials } from '../../types/auth';
import { 
  ModernCard, 
  CardContent, 
  ModernTextField, 
  ModernButton, 
  ModernAlert 
} from '../modern';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

// Clean, modern professional styling - elegant enterprise design
const LoginContainer = styled(Box)`
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginWrapper = styled(Container)`
  max-width: 1200px !important;
  position: relative;
  z-index: 1;
`;

const LoginGrid = styled(Grid)`
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 580px;
  border: 1px solid #e2e8f0;
`;

const LeftPanel = styled(Grid)`
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  
  @media (max-width: 960px) {
    display: none;
  }
`;

const RightPanel = styled(Grid)`
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  @media (max-width: 600px) {
    padding: 40px 20px;
  }
`;

const BrandLogo = styled(Box)`
  text-align: center;
  margin-bottom: 36px;
`;

const LogoIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 12px;
`;

const FeatureList = styled(Box)`
  margin-top: 32px;
`;

const FeatureItem = styled(Box)`
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 14px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const LoginCard = styled(ModernCard)`
  background: white !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
`;

const DemoSection = styled(Box)`
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const DemoChip = styled(Chip)`
  margin: 4px !important;
  background: #f1f5f9 !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease !important;
  font-weight: 500 !important;
  
  &:hover {
    background: #1e3a5f !important;
    color: white !important;
    border-color: #1e3a5f !important;
  }
  
  &.selected {
    background: #1e3a5f !important;
    color: white !important;
    border-color: #1e3a5f !important;
  }
`;

const LoginForm: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  // Demo user accounts
  const demoAccounts = [
    { role: 'Super Admin', email: 'admin@steelmanufacturing.com', password: 'Admin123!' },
    { role: 'Manager', email: 'manager.kerala@steelmanufacturing.com', password: 'Manager123!' },
    { role: 'Production', email: 'production@steelmanufacturing.com', password: 'Production123!' },
    { role: 'Sales', email: 'sales@steelmanufacturing.com', password: 'Sales123!' },
    { role: 'QC Inspector', email: 'qc@steelmanufacturing.com', password: 'QC123!' },
  ];

  const features = [
    { icon: '🏭', title: 'Smart Manufacturing', desc: 'AI-powered production optimization' },
    { icon: '📊', title: 'Real-time Analytics', desc: 'Live dashboards and insights' },
    { icon: '🔒', title: 'Enterprise Security', desc: 'Bank-level encryption & compliance' },
    { icon: '📱', title: 'Mobile Ready', desc: 'Access anywhere, anytime' },
    { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized for performance' },
  ];

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setValue('email', account.email);
    setValue('password', account.password);
    setSelectedRole(account.role);
  };

  const onSubmit = async (data: LoginCredentials) => {
    try {
      dispatch(loginStart());
      setError(null);
      
      const result = await login(data).unwrap();
      dispatch(loginSuccess({
        user: result.user,
        token: result.token
      }));
      
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage = err?.data?.error?.message || 'Login failed';
      setError(errorMessage);
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <LoginContainer>
      <LoginWrapper>
        <LoginGrid container>
          {/* Left Panel - Branding & Features */}
          <LeftPanel item xs={12} md={6}>
            <BrandLogo>
              <LogoIcon>🏗️</LogoIcon>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                mb: 1,
                color: '#ffffff',
                letterSpacing: '-0.01em'
              }}>
                SteelForge
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 400
              }}>
                Next-Generation Manufacturing Intelligence
              </Typography>
            </BrandLogo>



            <FeatureList>
              {features.map((feature, index) => (
                <FeatureItem key={index}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600, 
                      color: '#ffffff',
                      fontSize: '0.95rem'
                    }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.8rem'
                    }}>
                      {feature.desc}
                    </Typography>
                  </Box>
                </FeatureItem>
              ))}
            </FeatureList>


          </LeftPanel>

          {/* Right Panel - Login Form */}
          <RightPanel item xs={12} md={6}>
            <LoginCard>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" component="h1" sx={{ 
                    fontWeight: 'bold', 
                    mb: 1, 
                    background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                  }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Sign in to access your dashboard
                  </Typography>
                </Box>

                {error && (
                  <ModernAlert severity="error" style={{ marginBottom: '24px' }}>
                    {error}
                  </ModernAlert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <ModernTextField
                    {...register('email')}
                    fullWidth
                    label="Email Address"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    style={{ marginBottom: '20px' }}
                    autoComplete="email"
                    autoFocus
                    placeholder="Enter your email address"
                  />
                  
                  <ModernTextField
                    {...register('password')}
                    fullWidth
                    label="Password"
                    type="password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    style={{ marginBottom: '24px' }}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  
                  <ModernButton
                    type="submit"
                    fullWidth
                    variant="primary"
                    disabled={isLoading}
                    loading={isLoading}
                    style={{ 
                      marginBottom: '20px', 
                      padding: '16px', 
                      fontSize: '1rem',
                      fontWeight: '600',
                      letterSpacing: '0.025em',
                      borderRadius: '12px',
                      minHeight: '52px'
                    }}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </ModernButton>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                    Quick Demo Access
                  </Typography>
                </Divider>

                <DemoSection>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium', color: '#374151' }}>
                    Try different user roles:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {demoAccounts.map((account) => (
                      <DemoChip
                        key={account.role}
                        label={account.role}
                        size="small"
                        clickable
                        onClick={() => handleDemoLogin(account)}
                        className={selectedRole === account.role ? 'selected' : ''}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#6b7280' }}>
                    Click any role above to auto-fill login credentials
                  </Typography>
                </DemoSection>

                <Box sx={{ 
                  mt: 3, 
                  p: 3, 
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                  borderRadius: 3, 
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mb: 1.5, 
                    fontWeight: 'bold',
                    color: '#0369a1',
                    fontSize: '0.875rem'
                  }}>
                    🔐 Enterprise Security
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'medium', color: '#0369a1' }}>
                      🛡️ SOC 2 Compliant
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'medium', color: '#0369a1' }}>
                      🔒 256-bit Encryption
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'medium', color: '#0369a1' }}>
                      📱 2FA Ready
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Need help? Contact{' '}
                    <Typography component="span" variant="caption" sx={{ 
                      color: '#1e3a5f',
                      fontWeight: 600
                    }}>
                      support@steelforge.com
                    </Typography>
                  </Typography>
                </Box>
              </CardContent>
            </LoginCard>
          </RightPanel>
        </LoginGrid>
      </LoginWrapper>
    </LoginContainer>
  );
};

export default LoginForm;