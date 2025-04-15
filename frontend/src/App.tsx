import { Navigate, Route, Routes } from 'react-router-dom';
import AuthenticatedRoute from './components/common/Authorization/AuthenticatedRoute';
import NotFound from './components/common/NotFound';
import { useAuthContext } from './context/AuthContext';
import Dashboard from './page/Dashboard/Dashboard';
import EditMaintenance from './page/Dashboard/EditMaintenance';
import ForgotPassword from './page/ForgotPassword';
import HomePage from './page/HomePage';
import Login from './page/Login';
import PaymentSuccess from './page/Payment/PaymentSuccess';
import Pricing from './page/Payment/Pricing';
import RedirectToken from './page/RedirectToken';
import ResetForgottenPassword from './page/ResetForgottenPassword';
import SignUp from './page/SignUp';
import TenantRoute from './components/common/Authorization/TenantRoute';
import MaintenanceWorker from './page/MaintenanceWorker';
import LandlordRoute from './components/common/Authorization/LandlordRoute';
import Tenant from './page/TenantDashboard/Tenant';
import CondoPayments from './page/CondoPayments';
import MainNav from './components/common/MainNav';

const App = () => {
  const { user, isLoading } = useAuthContext();
  
  if(isLoading) {
    return 
    // loading spinner (but the problem is if it's fast it's like flickering)
    // (
    //   <div className='h-screen w-full flex items-center justify-center'>
    //     <LoadingSpinner />
    //   </div>
    // )
  }
  
  return (
    <div className='font-sans'>
      <Routes>
        <Route path="/" element={<MainNav><HomePage /></MainNav>} />

        {/* Authentication Routes */}
        <Route path='/login' element={user ? <Navigate to={'/'} /> : <MainNav><Login /></MainNav>} />
        <Route path='/signup' element={user ? <Navigate to={'/'} /> : <MainNav><SignUp /></MainNav>} />
        <Route path='/redirecttoken' element={user ? <Navigate to={'/'} /> : <MainNav><RedirectToken /></MainNav>} />
        <Route path='/forgot-password' element={user ? <Navigate to={'/'} /> : <MainNav><ForgotPassword /></MainNav>} />
        <Route path='/forgot-password/reset' element={user ? <Navigate to={'/'} /> : <MainNav><ResetForgottenPassword /></MainNav>} />

        {/* Subscription related routes */}
        <Route path='/pricing' element={<MainNav><Pricing /></MainNav>} />
        <Route path='/payment-status' element={
          <AuthenticatedRoute>
            <PaymentSuccess />
          </AuthenticatedRoute>
        } />
        
        {/* Dashboards Landlord */}
        <Route path='/dashboard/*' element={
          <LandlordRoute>
            <Dashboard />
          </LandlordRoute>
        } />
      
        {/* Dashboard Tenant */}
        <Route path='/tenant/*' element={
          <TenantRoute>
            <Tenant />
          </TenantRoute>
        } />

        {/* Maintenance Page */}
        <Route path='/editMaintenanceRequest/:maintenanceId' element={<EditMaintenance />} />
        <Route path='/maintenance/worker/:maintenanceId' element={<MaintenanceWorker />} />

        {/* we still need to put these pages to their proper url like dashboard of tenant or landlord  */}
        <Route path='/condoPayments/*' element={ <CondoPayments /> } />

        {/* Error Pages */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
