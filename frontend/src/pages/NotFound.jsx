import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="Page not found"
        description="This page does not exist in the prototype. Use the navigation to return to the overview."
        action={<Link to="/overview" className="btn-primary">Go to overview</Link>}
      />
    </div>
  );
}
