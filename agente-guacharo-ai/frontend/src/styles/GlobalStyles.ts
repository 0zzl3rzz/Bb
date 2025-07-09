import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                 'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #333;
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
    outline: none;
  }

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* Loading animation */
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slideInUp 0.3s ease-out;
  }
`;

export const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 10px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

export const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
`;

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'outline' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  min-height: 44px;
  gap: 8px;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          
          &:active {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return `
          background: #f1f5f9;
          color: #475569;
          
          &:hover {
            background: #e2e8f0;
          }
        `;
      case 'outline':
        return `
          background: transparent;
          border: 2px solid #e2e8f0;
          color: #475569;
          
          &:hover {
            border-color: #667eea;
            color: #667eea;
          }
        `;
      default:
        return `
          background: #f1f5f9;
          color: #475569;
          
          &:hover {
            background: #e2e8f0;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  background: white;
  font-family: inherit;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

export const Badge = styled.span<{ variant?: 'success' | 'warning' | 'error' | 'info' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: #d1fae5;
          color: #065f46;
        `;
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      case 'info':
        return `
          background: #dbeafe;
          color: #1e40af;
        `;
      default:
        return `
          background: #f1f5f9;
          color: #475569;
        `;
    }
  }}
`;

export const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Grid = styled.div<{ columns?: number; gap?: string }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 1}, 1fr);
  gap: ${props => props.gap || '20px'};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const Flex = styled.div<{ 
  direction?: 'row' | 'column'; 
  align?: string; 
  justify?: string; 
  gap?: string; 
  wrap?: boolean 
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  align-items: ${props => props.align || 'stretch'};
  justify-content: ${props => props.justify || 'flex-start'};
  gap: ${props => props.gap || '0'};
  flex-wrap: ${props => props.wrap ? 'wrap' : 'nowrap'};
`;

export const Text = styled.p<{ 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  weight?: 'normal' | 'medium' | 'bold';
  color?: string;
}>`
  margin: 0;
  font-size: ${props => {
    switch (props.size) {
      case 'sm': return '14px';
      case 'lg': return '18px';
      case 'xl': return '20px';
      default: return '16px';
    }
  }};
  font-weight: ${props => {
    switch (props.weight) {
      case 'medium': return '500';
      case 'bold': return '700';
      default: return '400';
    }
  }};
  color: ${props => props.color || '#374151'};
  line-height: 1.5;
`;

export const Heading = styled.h1<{ 
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
}>`
  margin: 0 0 16px 0;
  font-weight: 700;
  color: ${props => props.color || '#1f2937'};
  line-height: 1.2;

  ${props => {
    switch (props.level) {
      case 1: return 'font-size: 32px;';
      case 2: return 'font-size: 28px;';
      case 3: return 'font-size: 24px;';
      case 4: return 'font-size: 20px;';
      case 5: return 'font-size: 18px;';
      case 6: return 'font-size: 16px;';
      default: return 'font-size: 32px;';
    }
  }}

  @media (max-width: 768px) {
    font-size: ${props => {
      switch (props.level) {
        case 1: return '28px';
        case 2: return '24px';
        case 3: return '20px';
        case 4: return '18px';
        case 5: return '16px';
        case 6: return '14px';
        default: return '28px';
      }
    }};
  }
`;