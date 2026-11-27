import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Workspace } from '../components/Workspace';

export function ScannerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const startDemo = location.state?.demo === true;

  useEffect(() => {
    if (startDemo) navigate('/scanner', { replace: true });
  }, [navigate, startDemo]);

  return <Workspace demoTrigger={startDemo ? 1 : 0} />;
}
