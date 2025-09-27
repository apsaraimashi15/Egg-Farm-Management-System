import React from 'react'
import { useAuth } from '../context/AuthContext'
import Dashboard from './Dashboard'
import BuyerDashboard from './BuyerDashboard'

const RoleBasedDashboard = () => {
  const { user } = useAuth()

  if (user?.role === 'buyer') {
    return <BuyerDashboard />
  }

  return <Dashboard />
}

export default RoleBasedDashboard