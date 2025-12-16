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

// Clean, modern professional styling
const LoginContainer = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const LoginWrapper = styled(Container)`
  max-width: 1200px !important;
  position: relative;
  z-index: 1;
`;

const LoginGrid = styled(Grid)`
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-height: 600px;
`;

const LeftPanel = styled(Grid)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
  
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
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const LogoIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
`;

const FeatureList = styled(Box)`
  margin-top: 40px;
  position: relative;
  z-index: 1;
`;

const FeatureItem = styled(Box)`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(8px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-right: 16px;
  min-width: 50px;
`;

const LoginCard = styled(ModernCard)`
  background: white !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
`;

const DemoSection = styled(Box)`
  margin-top: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const DemoChip = styled(Chip)`
  margin: 4px !important;
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: #3b82f6 !important;
    color: white !important;
    border-color: #3b82f6 !important;
    transform: translateY(-1px);
  }
  
  &.selected {
    background: #3b82f6 !important;
    color: white !important;
    border-color: #3b82f6 !important;
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
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                SteelForge
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 'normal' }}>
                Next-Generation Manufacturing Intelligence
              </Typography>
            </BrandLogo>



            <FeatureList>
              {features.map((feature, index) => (
                <FeatureItem key={index}>
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
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
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b' }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
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
                    style={{ marginBottom: '20px', padding: '14px', fontSize: '1rem' }}
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

                <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
                  <Typography variant="caption" color="#0369a1" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                    🔐 Enterprise Security
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" color="#0369a1" sx={{ fontWeight: 'medium' }}>
                      🛡️ SOC 2 Compliant
                    </Typography>
                    <Typography variant="caption" color="#0369a1" sx={{ fontWeight: 'medium' }}>
                      🔒 256-bit Encryption
                    </Typography>
                    <Typography variant="caption" color="#0369a1" sx={{ fontWeight: 'medium' }}>
                      📱 2FA Ready
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Need help? Contact support at{' '}
                    <Typography component="span" variant="caption" sx={{ color: '#3b82f6', fontWeight: 'medium' }}>
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