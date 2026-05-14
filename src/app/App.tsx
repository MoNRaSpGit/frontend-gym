import { AppUpdateNotice } from "../shared/components/AppUpdateNotice";
import { GymHomePage } from "../features/gym/GymHomePage";

export function App() {
  return (
    <>
      <GymHomePage />
      <AppUpdateNotice />
    </>
  );
}
