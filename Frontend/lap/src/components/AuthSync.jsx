import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getMeApi } from '../api/services/users'
import { syncAuthUser } from '../store/authSlice'

const SYNC_INTERVAL_MS = 30000

export default function AuthSync() {
  const dispatch = useDispatch()
  const access = useSelector((s) => s.auth.access)

  const syncUser = useCallback(async () => {
    if (!localStorage.getItem('access')) return
    try {
      const res = await getMeApi()
      dispatch(syncAuthUser(res.data))
    } catch {
      // Auth failures are handled by the axios interceptor.
    }
  }, [dispatch])

  useEffect(() => {
    if (!access) return undefined

    syncUser()

    const intervalId = window.setInterval(syncUser, SYNC_INTERVAL_MS)
    const handleFocus = () => syncUser()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncUser()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [access, syncUser])

  return null
}
