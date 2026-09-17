import '@mantine/core/styles.css';

import { AppProvider } from '@/app/Provider';
import { AppRouter } from '@/app/Router';

function App() {
  return (
    <>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </>
  );
}

export default App;
