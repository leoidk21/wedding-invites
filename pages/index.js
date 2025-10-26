import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

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
      // Direct Supabase query to verify invitation
      const { data, error } = await supabase
        .from('event_guests')
        .select(`
          *,
          event_plans (
            client_name,
            partner_name,
            event_type,
            event_date,
            venue
          )
        `)
        .eq('id', guestId)
        .eq('event_plan_id', eventId)
        .eq('invite_token', token)
        .single()

      if (error) throw error
      
      if (data) {
        setGuestData(data)
      } else {
        setMessage('Invalid invitation link')
      }
    } catch (error) {
      console.error('Error loading invitation:', error)
      setMessage('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const respondToInvitation = async (status) => {
    if (!guestData) return
    
    setResponding(true)
    try {
      // Update guest status directly in Supabase
      const { error } = await supabase
        .from('event_guests')
        .update({ 
          status: status,
          responded_at: new Date().toISOString()
        })
        .eq('id', guestId)
        .eq('event_plan_id', eventId)
        .eq('invite_token', token)

      if (error) throw error

      setMessage(`Thank you! You have ${status.toLowerCase()} the invitation.`)
      setGuestData(prev => ({ ...prev, status }))
      
    } catch (error) {
      console.error('Error responding to invitation:', error)
      setMessage('Failed to send response. Please try again.')
    } finally {
      setResponding(false)
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

  const { event_plans: event } = guestData

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

        <h2 className="couple-names">
          {event.client_name} & {event.partner_name}
        </h2>
        
        <p className="event-date">
          {new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        <p className="venue">{event.venue}</p>

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
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .invitation-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 500px;
          width: 100%;
          text-align: center;
        }

        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5em;
        }

        .subtitle {
          color: #666;
          font-size: 1.2em;
          margin-bottom: 20px;
        }

        .divider {
          width: 100px;
          height: 2px;
          background: #667eea;
          margin: 20px auto;
        }

        .couple-names {
          color: #333;
          font-size: 1.8em;
          margin: 20px 0;
        }

        .event-date {
          color: #666;
          font-size: 1.2em;
          margin-bottom: 10px;
        }

        .venue {
          color: #888;
          font-size: 1em;
          margin-bottom: 30px;
        }

        .instruction {
          color: #666;
          font-size: 1.1em;
          margin-bottom: 30px;
        }

        .buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .btn {
          padding: 12px 30px;
          border: none;
          border-radius: 25px;
          font-size: 1.1em;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn.going {
          background: #4CAF50;
          color: white;
        }

        .btn.decline {
          background: #f44336;
          color: white;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .message {
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 10px;
          font-weight: bold;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.info {
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .already-responded {
          padding: 20px;
          background: #e7f3ff;
          color: #0066cc;
          border-radius: 10px;
          font-weight: bold;
        }

        .loading, .error-message {
          background: white;
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          font-size: 1.2em;
        }

        .error-message {
          color: #f44336;
        }
      `}</style>
    </div>
  )
}