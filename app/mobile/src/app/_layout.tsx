import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function TabLayout() {
  return (
    <QueryClientProvider client={queryClient}>
        <AnimatedSplashOverlay />
          <AppTabs />
    </QueryClientProvider>
  );
}
