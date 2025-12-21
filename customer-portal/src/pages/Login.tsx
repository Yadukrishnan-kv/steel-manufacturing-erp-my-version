import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  Stack,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { login, clearError } from '../store/slices/authSlice'
import { ModernButton } from '../components/modern'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Login() {
  const theme = useTheme()
  const [tabValue, setTabValue] = useState(0)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    dispatch(clearError())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const credentials = {
      password,
      ...(tabValue === 0 ? { email } : { phone }),
    }
    
    dispatch(login(credentials))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={24}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* Header Section - More compact */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.custom.colors.primary[600]} 0%, ${theme.custom.colors.primary[700]} 100%)`,
              color: 'white',
              p: 3,
              textAlign: 'center',
            }}
          >
            <BusinessIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Steel ERP
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Customer Portal
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    minHeight: 40,
                  },
                }}
              >
                <Tab 
                  icon={<EmailIcon fontSize="small" />} 
                  iconPosition="start" 
                  label="Email Login" 
                />
                <Tab 
                  icon={<PhoneIcon fontSize="small" />} 
                  iconPosition="start" 
                  label="Phone Login" 
                />
              </Tabs>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TabPanel value={tabValue} index={0}>
                  <TextField
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="small"
                    InputProps={{
                      sx: { borderRadius: 2 },
                    }}
                  />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <TextField
                    fullWidth
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    size="small"
                    InputProps={{
                      sx: { borderRadius: 2 },
                    }}
                  />
                </TabPanel>

                <TextField
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="small"
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />

                <ModernButton
                  type="submit"
                  fullWidth
                  variant="primary"
                  size="large"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Sign In
                </ModernButton>
              </Stack>
            </form>

            <Divider sx={{ my: 2.5 }} />

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.875rem' }}>
                Don't have an account?
              </Typography>
              <ModernButton
                href="/register"
                variant="tertiary"
                size="small"
              >
                Create Account
              </ModernButton>
            </Box>
          </CardContent>
        </Card>

        {/* Demo Credentials - More compact */}
        <Paper
          elevation={8}
          sx={{
            mt: 2,
            p: 2.5,
            borderRadius: 2,
            backgroundColor: '#ffffff',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5, textAlign: 'center', fontSize: '0.95rem' }}>
            Demo Credentials
          </Typography>
          <Stack spacing={0.5}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Email: customer@example.com
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Phone: 9876543210
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Password: Customer123!
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}