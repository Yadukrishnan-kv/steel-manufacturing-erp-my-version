/**
 * Modern Component Library Demo
 * Showcases all the modern components and their variants
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import { ModernButton } from '../Button';
import { PlayArrow, Download, Settings, Delete } from '@mui/icons-material';
import DashboardDemo from '../Dashboard/DashboardDemo';

const DemoContainer = styled.div`
  padding: ${({ theme }) => theme.custom.spacing[8]};
  max-width: 1200px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.custom.typography.fontFamily.primary};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.custom.spacing[12]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.custom.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  margin-bottom: ${({ theme }) => theme.custom.spacing[6]};
  border-bottom: 2px solid ${({ theme }) => theme.custom.colors.primary[200]};
  padding-bottom: ${({ theme }) => theme.custom.spacing[2]};
`;

const SubSection = styled.div`
  margin-bottom: ${({ theme }) => theme.custom.spacing[8]};
`;

const SubTitle = styled.h3`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[800]};
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.custom.spacing[4]};
  margin-bottom: ${({ theme }) => theme.custom.spacing[6]};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.custom.spacing[3]};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.custom.spacing[3]};
  flex-wrap: wrap;
`;

const CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[100]};
  border: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  padding: ${({ theme }) => theme.custom.spacing[4]};
  font-family: ${({ theme }) => theme.custom.typography.fontFamily.mono};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  overflow-x: auto;
  margin: ${({ theme }) => theme.custom.spacing[4]} 0;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.base};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
`;

export const ModernComponentDemo: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const handleClickDemo = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <DemoContainer theme={theme}>
      <h1 style={{ 
        fontSize: theme.custom.typography.fontSize['4xl'],
        fontWeight: theme.custom.typography.fontWeight.bold,
        color: theme.custom.colors.primary[700],
        textAlign: 'center',
        marginBottom: theme.custom.spacing[12]
      }}>
        Modern UI Design System Demo
      </h1>

      <Section theme={theme}>
        <SectionTitle theme={theme}>Button Variants</SectionTitle>
        
        <SubSection theme={theme}>
          <SubTitle theme={theme}>Basic Variants</SubTitle>
          <Description theme={theme}>
            The modern button component supports five distinct variants: primary, secondary, tertiary, ghost, and danger.
            Each variant has its own visual style while maintaining consistent behavior.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton variant="primary">Primary Button</ModernButton>
            <ModernButton variant="secondary">Secondary Button</ModernButton>
            <ModernButton variant="tertiary">Tertiary Button</ModernButton>
            <ModernButton variant="ghost">Ghost Button</ModernButton>
            <ModernButton variant="danger">Danger Button</ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`<ModernButton variant="primary">Primary Button</ModernButton>
<ModernButton variant="secondary">Secondary Button</ModernButton>
<ModernButton variant="tertiary">Tertiary Button</ModernButton>
<ModernButton variant="ghost">Ghost Button</ModernButton>
<ModernButton variant="danger">Danger Button</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Button Sizes</SubTitle>
          <Description theme={theme}>
            Buttons come in three sizes: small, medium (default), and large. Each size maintains proper proportions and touch targets.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton size="small" variant="primary">Small</ModernButton>
            <ModernButton size="medium" variant="primary">Medium</ModernButton>
            <ModernButton size="large" variant="primary">Large</ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`<ModernButton size="small" variant="primary">Small</ModernButton>
<ModernButton size="medium" variant="primary">Medium</ModernButton>
<ModernButton size="large" variant="primary">Large</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Button States</SubTitle>
          <Description theme={theme}>
            Buttons support various states including disabled and loading. The loading state shows a spinner and prevents interaction.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton variant="primary">Normal</ModernButton>
            <ModernButton variant="primary" disabled>Disabled</ModernButton>
            <ModernButton variant="primary" loading={loading} onClick={handleLoadingDemo}>
              {loading ? 'Loading...' : 'Click to Load'}
            </ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`<ModernButton variant="primary">Normal</ModernButton>
<ModernButton variant="primary" disabled>Disabled</ModernButton>
<ModernButton variant="primary" loading={loading}>Loading Button</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Buttons with Icons</SubTitle>
          <Description theme={theme}>
            Buttons can include start and end icons to enhance their meaning and visual appeal.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton 
              variant="primary" 
              startIcon={<PlayArrow />}
            >
              Play Video
            </ModernButton>
            <ModernButton 
              variant="secondary" 
              startIcon={<Download />}
            >
              Download
            </ModernButton>
            <ModernButton 
              variant="tertiary" 
              endIcon={<Settings />}
            >
              Settings
            </ModernButton>
            <ModernButton 
              variant="danger" 
              startIcon={<Delete />}
            >
              Delete
            </ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`<ModernButton variant="primary" startIcon={<PlayArrow />}>
  Play Video
</ModernButton>
<ModernButton variant="secondary" startIcon={<Download />}>
  Download
</ModernButton>
<ModernButton variant="tertiary" endIcon={<Settings />}>
  Settings
</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Interactive Demo</SubTitle>
          <Description theme={theme}>
            Click the button below to see interactive behavior. The button maintains state and provides visual feedback.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton 
              variant="primary" 
              onClick={handleClickDemo}
              startIcon={<PlayArrow />}
            >
              Clicked {clickCount} times
            </ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`const [clickCount, setClickCount] = useState(0);

<ModernButton 
  variant="primary" 
  onClick={() => setClickCount(prev => prev + 1)}
>
  Clicked {clickCount} times
</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Full Width Buttons</SubTitle>
          <Description theme={theme}>
            Buttons can span the full width of their container using the fullWidth prop.
          </Description>
          
          <div style={{ maxWidth: '400px' }}>
            <ModernButton variant="primary" fullWidth style={{ marginBottom: theme.custom.spacing[3] }}>
              Full Width Primary
            </ModernButton>
            <ModernButton variant="secondary" fullWidth>
              Full Width Secondary
            </ModernButton>
          </div>

          <CodeBlock theme={theme}>
{`<ModernButton variant="primary" fullWidth>
  Full Width Primary
</ModernButton>
<ModernButton variant="secondary" fullWidth>
  Full Width Secondary
</ModernButton>`}
          </CodeBlock>
        </SubSection>

        <SubSection theme={theme}>
          <SubTitle theme={theme}>Link Buttons</SubTitle>
          <Description theme={theme}>
            Buttons can render as links when the href prop is provided, maintaining button styling with link behavior.
          </Description>
          
          <ButtonRow theme={theme}>
            <ModernButton 
              variant="primary" 
              href="https://example.com"
              target="_blank"
            >
              External Link
            </ModernButton>
            <ModernButton 
              variant="secondary" 
              href="/dashboard"
            >
              Internal Link
            </ModernButton>
          </ButtonRow>

          <CodeBlock theme={theme}>
{`<ModernButton 
  variant="primary" 
  href="https://example.com"
  target="_blank"
>
  External Link
</ModernButton>
<ModernButton variant="secondary" href="/dashboard">
  Internal Link
</ModernButton>`}
          </CodeBlock>
        </SubSection>
      </Section>

      <Section theme={theme}>
        <SectionTitle theme={theme}>Dashboard Components</SectionTitle>
        <Description theme={theme}>
          Comprehensive dashboard components including KPI cards, data tables, charts, and responsive grids.
        </Description>
        <DashboardDemo />
      </Section>

      <Section theme={theme}>
        <SectionTitle theme={theme}>Design System Features</SectionTitle>
        
        <Description theme={theme}>
          The Modern UI Design System provides:
        </Description>
        
        <ul style={{ 
          color: theme.custom.colors.neutral.gray[700],
          fontSize: theme.custom.typography.fontSize.base,
          lineHeight: theme.custom.typography.lineHeight.relaxed,
          marginLeft: theme.custom.spacing[6]
        }}>
          <li>Consistent design tokens for colors, typography, and spacing</li>
          <li>Full Material-UI compatibility and theme integration</li>
          <li>Comprehensive accessibility support (WCAG 2.1 AA)</li>
          <li>Responsive design with mobile-first approach</li>
          <li>Property-based testing for reliability</li>
          <li>TypeScript support with full type safety</li>
          <li>Styled-components integration for modern CSS-in-JS</li>
          <li>Procore-inspired professional aesthetics</li>
        </ul>
      </Section>
    </DemoContainer>
  );
};

export default ModernComponentDemo;