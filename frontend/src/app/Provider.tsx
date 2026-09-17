import React from 'react';
import { createTheme, MantineProvider } from '@mantine/core';

type AppProviderProps = {
  children: React.ReactNode;
};

const theme = createTheme({
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  primaryColor: 'cyan',
});

export function AppProvider({ children }: AppProviderProps) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
