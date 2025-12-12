import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { store } from './store/store';
import App from './App';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('App Component', () => {
  it('renders the main heading', () => {
    renderWithProviders(<App />);
    
    const heading = screen.getByText('Steel Manufacturing ERP');
    expect(heading).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    renderWithProviders(<App />);
    
    const welcomeMessage = screen.getByText('Welcome to the Steel Manufacturing ERP System');
    expect(welcomeMessage).toBeInTheDocument();
  });

  it('renders the dashboard section', () => {
    renderWithProviders(<App />);
    
    const dashboardHeading = screen.getByText('Dashboard');
    expect(dashboardHeading).toBeInTheDocument();
  });
});