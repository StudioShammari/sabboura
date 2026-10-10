import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { MotionConfig } from 'motion/react';
import Home from '@/pages/Home';
import Classroom from '@/pages/Classroom';
import Plan from '@/pages/Plan';

const Review = lazy(() => import('@/pages/Review'));
const DevStates = lazy(() => import('@/pages/DevStates'));
const DevTest = lazy(() => import('@/pages/DevTest'));
const School = lazy(() => import('@/pages/School'));
const Pitch = lazy(() => import('@/pages/Pitch'));
const Replay = lazy(() => import('@/pages/Replay'));
const DevBody = lazy(() => import('@/pages/DevBody'));

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/plan/:packId" component={Plan} />
          <Route path="/lesson/:id/score" component={Review} />
          <Route path="/lesson/:id">{(p) => <Classroom key={p.id} />}</Route>
          <Route path="/dev/states" component={DevStates} />
          <Route path="/dev/test" component={DevTest} />
          <Route path="/dev/body" component={DevBody} />
          <Route path="/pitch" component={Pitch} />
          <Route path="/school" component={School} />
          <Route path="/replay/:id" component={Replay} />
          <Route><Home /></Route>
        </Switch>
      </Suspense>
    </MotionConfig>
  );
}
