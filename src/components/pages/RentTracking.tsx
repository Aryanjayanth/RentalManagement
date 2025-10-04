
import RentTrackingContainer from '../rent/RentTrackingContainer';

interface RentTrackingProps {
  user?: { role?: string };
}

const RentTracking = ({ user }: RentTrackingProps) => {
  return <RentTrackingContainer user={user} />;
};

export default RentTracking;
