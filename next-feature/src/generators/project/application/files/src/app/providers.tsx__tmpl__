import React, { ReactNode } from "react";
import { Toaster } from "sonner";
import ReactQueryProvider from "../lib/providers/react-query-provider";
import { ThemeProvider } from "../lib/providers/theme-provider";


interface Props {
  children: ReactNode;
}

const Providers = ({ children }: Props) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ReactQueryProvider>
        <Toaster position="bottom-right" />
        {children}
      </ReactQueryProvider>
    </ThemeProvider>
  );
};

export default Providers;
