import { useState, useEffect } from 'react'
import { useRouter } from 'next/router' 

const API_BASE = 'https://ela-untraceable-foresakenly.ngrok-free.dev';

export default function InvitationPage() {
  const router = useRouter()
  const { eventId, guestId, token } = router.query
  const [guestData, setGuestData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (eventId && guestId && token) {
      loadInvitation()
    }
  }, [eventId, guestId, token])

  const loadInvitation = async () => {
    try {
      console.log('🔄 Loading invitation for:', { eventId, guestId, token });
      
      const response = await fetch(`${API_BASE}/api/event-plans/invitation/${eventId}/${guestId}/${token}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'  // 🚨 ADD THIS HEADER
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 API response:', data);

      if (data.success) {
        setGuestData(data.guest);
      } else {
        setMessage(data.error || 'Invalid invitation link');
      }
    } catch (error) {
      console.error('❌ Load invitation error:', error);
      setMessage(`Failed to load invitation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const respondToInvitation = async (status) => {
    if (!guestData) return
    
    setResponding(true)
    try {
      const response = await fetch(`${API_BASE}/api/event-plans/invitation/${eventId}/${guestId}/${token}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'  // 🚨 ADD THIS HEADER TOO
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setGuestData(prev => ({ ...prev, status }));
      } else {
        setMessage(data.error || 'Failed to send response');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setMessage('Failed to send response');
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your invitation...</div>
      </div>
    )
  }

  if (!guestData && message) {
    return (
      <div className="container">
        <div className="error-message">{message}</div>
      </div>
    )
  }

  if (!guestData) {
    return (
      <div className="container">
        <div className="error-message">Invalid invitation link</div>
      </div>
    )
  }

  // 🚨 FIX: Use the correct data structure
  // The API returns: { success: true, guest: { event: { client_name, ... } } }
  const event = guestData.event || {};
  // 🚨 FIX: Use only client_name, ignore partner_name
  const displayNames = event.client_name || 'The Couple';

  return (
    <div className="container">
      <div className="invitation-card">
        {message && (
          <div className={`message ${guestData.status ? 'success' : 'info'}`}>
            {message}
          </div>
        )}

        <h1>YOU ARE INVITED</h1>
        <p className="subtitle">THE WEDDING OF</p>
        <div className="divider"></div>

        {/* 🚨 FIXED: Using only client_name */}
        <h2 className="couple-names">
          {displayNames}
        </h2>
        
        <p className="event-date">
          {new Date(event.event_date).toLocaleDateString('en-PH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        <p className="instruction">
          Kindly confirm your attendance to reserve your seat.
        </p>

        {!guestData.status || guestData.status === 'Pending' ? (
          <div className="buttons">
            <button 
              className="btn going" 
              onClick={() => respondToInvitation('Accepted')}
              disabled={responding}
            >
              {responding ? 'Sending...' : 'Going'}
            </button>
            <button 
              className="btn decline" 
              onClick={() => respondToInvitation('Declined')}
              disabled={responding}
            >
              {responding ? 'Sending...' : 'Decline'}
            </button>
          </div>
        ) : (
          <div className="already-responded">
            You have already {guestData.status.toLowerCase()} this invitation.
          </div>
        )}
      </div>

      <style jsx>{`
        /* Your existing CSS styles */
      `}</style>
    </div>
  )
}